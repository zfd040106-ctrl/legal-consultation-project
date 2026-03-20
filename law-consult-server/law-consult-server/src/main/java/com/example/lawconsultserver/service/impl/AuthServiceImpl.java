package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.common.exception.BusinessException;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.entity.LawyerDocument;
import com.example.lawconsultserver.entity.LawyerInfo;
import com.example.lawconsultserver.entity.User;
import com.example.lawconsultserver.mapper.LawyerDocumentMapper;
import com.example.lawconsultserver.mapper.LawyerInfoMapper;
import com.example.lawconsultserver.mapper.UserMapper;
import com.example.lawconsultserver.service.AuthService;
import com.example.lawconsultserver.service.MediaAssetService;
import com.example.lawconsultserver.util.PasswordUtil;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private LawyerInfoMapper lawyerInfoMapper;

    @Autowired
    private LawyerDocumentMapper lawyerDocumentMapper;

    @Autowired
    private MediaAssetService mediaAssetService;

    @Override
    @Transactional
    public ApiResponse<?> register(String phone, String account, String username,
                                   String password, String confirmPassword, String role,
                                   String licenseNumber, String firmName, String specialization,
                                   List<String> documentUrls) {
        validateRegisterInput(phone, account, username, password, confirmPassword, role,
                licenseNumber, firmName, specialization, documentUrls);

        if (accountExists(account)) {
            throw new BusinessException("Account already exists");
        }
        if (phoneExists(phone)) {
            throw new BusinessException("Phone number already registered");
        }

        User user = new User();
        user.setPhone(phone);
        user.setAccount(account);
        user.setUsername(username);
        user.setPassword(PasswordUtil.encode(password));
        user.setRole(role);
        user.setStatus("lawyer".equals(role) ? "pending_approval" : "active");

        if (userMapper.insertUser(user) <= 0) {
            throw new BusinessException("Register failed");
        }

        if ("lawyer".equals(role)) {
            upsertLawyerProfile(user.getId(), licenseNumber, firmName, specialization);
            replaceLawyerDocuments(user.getId(), documentUrls);
        }

        Map<String, Object> data = buildUserPayload(user);
        String message = "lawyer".equals(role)
                ? "Lawyer registration submitted. Please wait for review."
                : "Register success";
        return ApiResponse.success(message, data);
    }

    @Override
    public ApiResponse<?> login(String account, String password) {
        User user = validateAccountPassword(account, password);

        if ("pending_approval".equals(user.getStatus())) {
            throw new BusinessException("Account is pending approval");
        }
        if ("blocked".equals(user.getStatus())) {
            if ("lawyer".equals(user.getRole())) {
                throw new BusinessException("Lawyer application was rejected. Please resubmit your materials.");
            }
            throw new BusinessException("Account is blocked");
        }

        return ApiResponse.success("Login success", buildUserPayload(user));
    }

    @Override
    public ApiResponse<?> getLawyerReapplyInfo(String account, String password) {
        User user = validateBlockedLawyer(account, password);
        LawyerInfo lawyerInfo = lawyerInfoMapper.selectByUserId(user.getId());
        if (lawyerInfo == null) {
            throw new BusinessException("Lawyer profile not found");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("phone", user.getPhone());
        data.put("account", user.getAccount());
        data.put("username", user.getUsername());
        data.put("licenseNumber", lawyerInfo.getLicenseNumber());
        data.put("firmName", lawyerInfo.getFirmName());
        data.put("specialization", lawyerInfo.getSpecialization());
        data.put("documentUrls", lawyerDocumentMapper.selectByLawyerId(user.getId()).stream()
                .map(LawyerDocument::getDocumentUrl)
                .toList());
        return ApiResponse.success(data);
    }

    @Override
    @Transactional
    public ApiResponse<?> reapplyLawyer(String phone, String account, String username,
                                        String password, String confirmPassword,
                                        String licenseNumber, String firmName, String specialization,
                                        List<String> documentUrls) {
        validateLawyerOnlyInput(phone, account, username, password, confirmPassword,
                licenseNumber, firmName, specialization, documentUrls);

        User user = validateBlockedLawyer(account, password);
        User phoneOwner = userMapper.selectUserByPhone(phone);
        if (phoneOwner != null && !phoneOwner.getId().equals(user.getId())) {
            throw new BusinessException("Phone number already registered");
        }

        User updateUser = new User();
        updateUser.setId(user.getId());
        updateUser.setPhone(phone);
        updateUser.setUsername(username);
        updateUser.setPassword(PasswordUtil.encode(password));
        if (userMapper.updateUser(updateUser) <= 0 || userMapper.updateUserStatus(user.getId(), "pending_approval") <= 0) {
            throw new BusinessException("Resubmit failed");
        }

        upsertLawyerProfile(user.getId(), licenseNumber, firmName, specialization);
        if (documentUrls != null && !documentUrls.isEmpty()) {
            replaceLawyerDocuments(user.getId(), documentUrls);
        } else {
            if (lawyerDocumentMapper.resetStatusByLawyerId(user.getId()) <= 0) {
                throw new BusinessException("Please upload qualification documents again");
            }
        }

        User latest = userMapper.selectUserById(user.getId());
        return ApiResponse.success("Resubmit success", buildUserPayload(latest));
    }

    @Override
    public ApiResponse<?> adminLogin(String account, String password) {
        User user = validateAccountPassword(account, password);
        if (!"admin".equals(user.getRole())) {
            throw new BusinessException("No admin permission");
        }
        if ("blocked".equals(user.getStatus())) {
            throw new BusinessException("Account is blocked");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("adminId", user.getId());
        data.put("account", user.getAccount());
        data.put("username", user.getUsername());
        data.put("adminName", user.getUsername());
        data.put("adminRole", "admin");
        data.put("permissions", new String[]{"*"});
        return ApiResponse.success("Login success", data);
    }

    @Override
    public ApiResponse<?> logout(Integer userId) {
        return ApiResponse.success("Logout success", null);
    }

    @Override
    public boolean accountExists(String account) {
        return userMapper.selectUserByAccount(account) != null;
    }

    @Override
    public boolean phoneExists(String phone) {
        return userMapper.selectUserByPhone(phone) != null;
    }

    private User validateAccountPassword(String account, String password) {
        if (StringUtils.isBlank(account) || StringUtils.isBlank(password)) {
            throw new BusinessException("Account and password are required");
        }

        User user = userMapper.selectUserByAccount(account);
        if (user == null) {
            throw new BusinessException("Account not found");
        }
        if (!PasswordUtil.matches(password, user.getPassword())) {
            throw new BusinessException("Password is incorrect");
        }
        return user;
    }

    private User validateBlockedLawyer(String account, String password) {
        User user = validateAccountPassword(account, password);
        if (!"lawyer".equals(user.getRole())) {
            throw new BusinessException("Only rejected lawyers can resubmit");
        }
        if (!"blocked".equals(user.getStatus())) {
            throw new BusinessException("Current lawyer does not need resubmission");
        }
        return user;
    }

    private void validateRegisterInput(String phone, String account, String username,
                                       String password, String confirmPassword, String role,
                                       String licenseNumber, String firmName, String specialization,
                                       List<String> documentUrls) {
        if (StringUtils.isBlank(phone) || StringUtils.isBlank(account)
                || StringUtils.isBlank(username) || StringUtils.isBlank(password)) {
            throw new BusinessException("Required fields cannot be empty");
        }
        if (!password.equals(confirmPassword)) {
            throw new BusinessException("Passwords do not match");
        }
        if (!Character.isUpperCase(account.charAt(0))) {
            throw new BusinessException("Account must start with an uppercase prefix");
        }
        if (!"user".equals(role) && !"lawyer".equals(role)) {
            throw new BusinessException("Invalid role");
        }
        if ("lawyer".equals(role)) {
            validateLawyerOnlyInput(phone, account, username, password, confirmPassword,
                    licenseNumber, firmName, specialization, documentUrls);
        }
    }

    private void validateLawyerOnlyInput(String phone, String account, String username,
                                         String password, String confirmPassword,
                                         String licenseNumber, String firmName, String specialization,
                                         List<String> documentUrls) {
        if (StringUtils.isBlank(phone) || StringUtils.isBlank(account)
                || StringUtils.isBlank(username) || StringUtils.isBlank(password)) {
            throw new BusinessException("Required fields cannot be empty");
        }
        if (!password.equals(confirmPassword)) {
            throw new BusinessException("Passwords do not match");
        }
        if (StringUtils.isBlank(licenseNumber) || StringUtils.isBlank(firmName)
                || StringUtils.isBlank(specialization)) {
            throw new BusinessException("Lawyer profile is incomplete");
        }
        if (documentUrls == null || documentUrls.isEmpty()) {
            List<LawyerDocument> existingDocuments = userMapper.selectUserByAccount(account) == null
                    ? List.of()
                    : lawyerDocumentMapper.selectByLawyerId(userMapper.selectUserByAccount(account).getId());
            if (existingDocuments.isEmpty()) {
                throw new BusinessException("Qualification documents are required");
            }
        }
    }

    private void upsertLawyerProfile(Integer userId, String licenseNumber, String firmName, String specialization) {
        LawyerInfo existing = lawyerInfoMapper.selectByUserId(userId);
        if (existing == null) {
            LawyerInfo lawyerInfo = new LawyerInfo();
            lawyerInfo.setUserId(userId);
            lawyerInfo.setLicenseNumber(licenseNumber);
            lawyerInfo.setFirmName(firmName);
            lawyerInfo.setSpecialization(specialization);
            lawyerInfo.setTotalConsultations(0);
            if (lawyerInfoMapper.insertLawyerInfo(lawyerInfo) <= 0) {
                throw new BusinessException("Save lawyer profile failed");
            }
            return;
        }

        existing.setLicenseNumber(licenseNumber);
        existing.setFirmName(firmName);
        existing.setSpecialization(specialization);
        if (lawyerInfoMapper.updateLawyerInfo(existing) <= 0) {
            throw new BusinessException("Update lawyer profile failed");
        }
    }

    private void replaceLawyerDocuments(Integer lawyerId, List<String> documentUrls) {
        List<String> normalizedUrls = mediaAssetService.sanitizeStoredPaths(documentUrls);
        if (normalizedUrls == null || normalizedUrls.isEmpty()) {
            throw new BusinessException("Qualification documents are required");
        }

        lawyerDocumentMapper.deleteByLawyerId(lawyerId);
        for (String url : normalizedUrls) {
            LawyerDocument document = new LawyerDocument();
            document.setLawyerId(lawyerId);
            document.setDocumentUrl(mediaAssetService.normalizeStoredDocumentUrl(url));
            document.setDocumentType("registration_document");
            document.setStatus("pending");
            if (lawyerDocumentMapper.insertDocument(document) <= 0) {
                throw new BusinessException("Save lawyer documents failed");
            }
        }
    }

    private Map<String, Object> buildUserPayload(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("id", user.getId());
        data.put("account", user.getAccount());
        data.put("username", user.getUsername());
        data.put("phone", user.getPhone());
        data.put("role", user.getRole());
        data.put("status", user.getStatus());
        return data;
    }
}
