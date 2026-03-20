package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.common.exception.BusinessException;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.entity.Complaint;
import com.example.lawconsultserver.entity.User;
import com.example.lawconsultserver.mapper.ComplaintMapper;
import com.example.lawconsultserver.mapper.UserMapper;
import com.example.lawconsultserver.service.MediaAssetService;
import com.example.lawconsultserver.service.UserService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ComplaintMapper complaintMapper;

    @Autowired
    private MediaAssetService mediaAssetService;

    @Override
    public ApiResponse<?> getUserProfile(Integer userId) {
        if (userId == null) {
            throw new BusinessException("User ID cannot be null");
        }
        User user = userMapper.selectUserById(userId);
        if (user == null) {
            throw new BusinessException("User not found");
        }
        return ApiResponse.success(user);
    }

    @Override
    @Transactional
    public ApiResponse<?> updateUserProfile(Integer userId, String username, String avatar) {
        if (userId == null) {
            throw new BusinessException("User ID cannot be null");
        }
        User user = userMapper.selectUserById(userId);
        if (user == null) {
            throw new BusinessException("User not found");
        }

        if (StringUtils.isNotBlank(username)) {
            user.setUsername(username);
        }
        String normalizedAvatar = mediaAssetService.normalizeStoredAvatar(avatar);
        if (StringUtils.isNotBlank(normalizedAvatar)) {
            user.setAvatar(normalizedAvatar);
        }

        int result = userMapper.updateUser(user);
        if (result <= 0) {
            throw new BusinessException("Failed to update profile");
        }

        return ApiResponse.success("Profile updated", user);
    }

    @Override
    @Transactional
    public ApiResponse<?> submitComplaint(Integer userId, String content, String reason,
                                          String type, String contact, Integer consultationId) {
        if (userId == null || StringUtils.isBlank(content)) {
            throw new BusinessException("Missing required parameters");
        }

        String normalizedReason = StringUtils.defaultIfBlank(StringUtils.trimToNull(reason), "unspecified");

        Complaint complaint = new Complaint();
        complaint.setUserId(userId);
        complaint.setContent(content);
        complaint.setReason(normalizedReason);
        complaint.setType(type);
        complaint.setContact(contact);
        complaint.setConsultationId(consultationId);
        complaint.setStatus("pending");

        int result = complaintMapper.insertComplaint(complaint);
        if (result <= 0) {
            throw new BusinessException("Failed to submit complaint");
        }

        return ApiResponse.success("Feedback submitted", null);
    }
}
