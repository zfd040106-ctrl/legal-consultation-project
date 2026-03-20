package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.common.exception.BusinessException;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.common.response.PageResponse;
import com.example.lawconsultserver.entity.*;
import com.example.lawconsultserver.mapper.*;
import com.example.lawconsultserver.service.AdminService;
import com.example.lawconsultserver.service.MediaAssetService;
import com.example.lawconsultserver.service.WalletService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminServiceImpl implements AdminService {

    private static final int DEFAULT_PAGE_SIZE = 10;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private LawyerInfoMapper lawyerInfoMapper;

    @Autowired
    private LawyerDocumentMapper lawyerDocumentMapper;

    @Autowired
    private AnnouncementMapper announcementMapper;

    @Autowired
    private ComplaintMapper complaintMapper;

    @Autowired
    private ConsultationMapper consultationMapper;

    @Autowired
    private AuditLogMapper auditLogMapper;

    @Autowired
    private CarouselItemMapper carouselItemMapper;

    @Autowired
    private WalletService walletService;

    @Autowired
    private MediaAssetService mediaAssetService;

    @Override
    public ApiResponse<?> getAdminProfile(Integer adminId) {
        if (adminId == null) {
            throw new BusinessException("管理员ID不能为空");
        }

        User admin = userMapper.selectUserById(adminId);
        if (admin == null) {
            throw new BusinessException("管理员不存在");
        }
        if (!"admin".equals(admin.getRole())) {
            throw new BusinessException("该用户不是管理员");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", admin.getId());
        data.put("account", admin.getAccount());
        data.put("username", admin.getUsername());
        data.put("phone", admin.getPhone());
        data.put("avatar", admin.getAvatar());
        data.put("status", admin.getStatus());
        data.put("createdAt", admin.getCreatedAt());
        return ApiResponse.success(data);
    }

    @Override
    public ApiResponse<?> getUserList(Integer page, Integer pageSize, String role, String status, String keyword) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        long total = userMapper.countUsersExcludePending(role, status, keyword);
        List<User> users = userMapper.selectUsersExcludePending(role, status, keyword, offset, pageSize);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, users));
    }

    @Override
    @Transactional
    public ApiResponse<?> updateUserStatus(Integer userId, String status) {
        if (userId == null || StringUtils.isBlank(status)) {
            throw new BusinessException("参数不完整");
        }
        if (userMapper.selectUserById(userId) == null) {
            throw new BusinessException("用户不存在");
        }
        if (userMapper.updateUserStatus(userId, status) <= 0) {
            throw new BusinessException("修改用户状态失败");
        }
        return ApiResponse.success("修改成功", null);
    }

    @Override
    public ApiResponse<?> getUserDetail(Integer userId) {
        if (userId == null) {
            throw new BusinessException("用户ID不能为空");
        }
        User user = userMapper.selectUserById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return ApiResponse.success(user);
    }

    @Override
    @Transactional
    public ApiResponse<?> deleteUser(Integer userId) {
        if (userId == null) {
            throw new BusinessException("用户ID不能为空");
        }
        if (userMapper.selectUserById(userId) == null) {
            throw new BusinessException("用户不存在");
        }
        if (userMapper.deleteUser(userId) <= 0) {
            throw new BusinessException("删除用户失败");
        }
        return ApiResponse.success("删除成功", null);
    }

    @Override
    public ApiResponse<?> getLawyerApprovalList(Integer page, Integer pageSize) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        long total = userMapper.countUsers("lawyer", "pending_approval");
        List<User> lawyers = userMapper.selectUsers("lawyer", "pending_approval", offset, pageSize);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, lawyers));
    }

    @Override
    public ApiResponse<?> getLawyerDetail(Integer lawyerId) {
        if (lawyerId == null) {
            throw new BusinessException("律师ID不能为空");
        }

        User lawyer = userMapper.selectUserById(lawyerId);
        if (lawyer == null) {
            throw new BusinessException("律师不存在");
        }
        if (!"lawyer".equals(lawyer.getRole())) {
            throw new BusinessException("该用户不是律师");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", lawyer.getId());
        data.put("account", lawyer.getAccount());
        data.put("username", lawyer.getUsername());
        data.put("name", lawyer.getUsername());
        data.put("phone", lawyer.getPhone());
        data.put("avatar", lawyer.getAvatar());
        data.put("status", lawyer.getStatus());
        data.put("createdAt", lawyer.getCreatedAt());

        LawyerInfo lawyerInfo = lawyerInfoMapper.selectByUserId(lawyerId);
        if (lawyerInfo != null) {
            data.put("licenseNumber", lawyerInfo.getLicenseNumber());
            data.put("lawFirmName", lawyerInfo.getFirmName());
            data.put("field", lawyerInfo.getSpecialization());
            data.put("yearsOfPractice", lawyerInfo.getExperienceYears());
            data.put("totalConsultations", lawyerInfo.getTotalConsultations());
        }

        List<LawyerDocument> documents = lawyerDocumentMapper.selectByLawyerId(lawyerId);
        if (documents != null && !documents.isEmpty()) {
            List<Map<String, String>> certificates = documents.stream().map(doc -> {
                Map<String, String> cert = new HashMap<>();
                cert.put("url", doc.getDocumentUrl());
                cert.put("name", doc.getDocumentType() != null ? doc.getDocumentType() : "证件文件");
                return cert;
            }).toList();
            data.put("certificates", certificates);
        }

        return ApiResponse.success(data);
    }

    @Override
    @Transactional
    public ApiResponse<?> approveLawyer(Integer adminId, Integer lawyerId, Boolean approved, String reason) {
        if (lawyerId == null || approved == null) {
            throw new BusinessException("参数不完整");
        }

        User lawyer = userMapper.selectUserById(lawyerId);
        if (lawyer == null) {
            throw new BusinessException("律师不存在");
        }
        if (!"lawyer".equals(lawyer.getRole())) {
            throw new BusinessException("该用户不是律师");
        }

        String oldStatus = lawyer.getStatus();
        String newStatus = approved ? "active" : "blocked";
        if (userMapper.updateUserStatus(lawyerId, newStatus) <= 0) {
            throw new BusinessException("审核律师失败");
        }

        AuditLog log = new AuditLog();
        log.setAdminId(adminId);
        log.setTargetType("lawyer");
        log.setTargetId(lawyerId);
        log.setAction(approved ? "approve" : "reject");
        log.setReason(reason);
        log.setOldStatus(oldStatus);
        log.setNewStatus(newStatus);
        auditLogMapper.insertLog(log);

        return ApiResponse.success(approved ? "审核通过" : "审核拒绝", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> publishAnnouncement(Integer adminId, String title, String content, Boolean isPinned, String status) {
        if (adminId == null || StringUtils.isBlank(title) || StringUtils.isBlank(content)) {
            throw new BusinessException("参数不完整");
        }

        Announcement announcement = new Announcement();
        announcement.setAdminId(adminId);
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setIsPinned(Boolean.TRUE.equals(isPinned));
        announcement.setStatus(StringUtils.isBlank(status) ? "published" : status);
        if (announcementMapper.insertAnnouncement(announcement) <= 0) {
            throw new BusinessException("发布公告失败");
        }
        return ApiResponse.success("发布成功", null);
    }

    @Override
    public ApiResponse<?> getAnnouncementList(Integer page, Integer pageSize, String keyword, String status) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        long total = announcementMapper.countAll(keyword, status);
        List<Announcement> items = announcementMapper.selectAll(keyword, status, offset, pageSize);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, items));
    }

    @Override
    @Transactional
    public ApiResponse<?> updateAnnouncement(Integer announcementId, String title, String content, Boolean isPinned, String status) {
        if (announcementId == null) {
            throw new BusinessException("公告ID不能为空");
        }
        Announcement announcement = new Announcement();
        announcement.setId(announcementId);
        if (StringUtils.isNotBlank(title)) {
            announcement.setTitle(title);
        }
        if (StringUtils.isNotBlank(content)) {
            announcement.setContent(content);
        }
        if (isPinned != null) {
            announcement.setIsPinned(isPinned);
        }
        if (StringUtils.isNotBlank(status)) {
            announcement.setStatus(status);
        }
        if (announcementMapper.updateAnnouncement(announcement) <= 0) {
            throw new BusinessException("更新公告失败");
        }
        return ApiResponse.success("更新成功", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> deleteAnnouncement(Integer announcementId) {
        if (announcementId == null) {
            throw new BusinessException("公告ID不能为空");
        }
        if (announcementMapper.deleteById(announcementId) <= 0) {
            throw new BusinessException("删除公告失败");
        }
        return ApiResponse.success("删除成功", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> pinAnnouncement(Integer announcementId) {
        if (announcementId == null) {
            throw new BusinessException("公告ID不能为空");
        }
        if (announcementMapper.updatePin(announcementId, true) <= 0) {
            throw new BusinessException("置顶失败");
        }
        return ApiResponse.success("置顶成功", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> unpinAnnouncement(Integer announcementId) {
        if (announcementId == null) {
            throw new BusinessException("公告ID不能为空");
        }
        if (announcementMapper.updatePin(announcementId, false) <= 0) {
            throw new BusinessException("取消置顶失败");
        }
        return ApiResponse.success("取消置顶成功", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> createCarouselItem(Integer adminId, String title, String summary, String content,
                                             String imageUrl, String category, Integer sortOrder,
                                             String status, LocalDateTime startTime, LocalDateTime endTime) {
        String normalizedImageUrl = mediaAssetService.normalizeStoredImageUrl(imageUrl);
        if (adminId == null || StringUtils.isBlank(title) || StringUtils.isBlank(content) || StringUtils.isBlank(normalizedImageUrl)) {
            throw new BusinessException("轮播图参数不完整");
        }

        CarouselItem item = CarouselItem.builder()
                .adminId(adminId)
                .title(title.trim())
                .summary(summary)
                .content(content)
                .imageUrl(normalizedImageUrl)
                .category(StringUtils.defaultString(category))
                .sortOrder(sortOrder == null ? 0 : sortOrder)
                .status(StringUtils.isBlank(status) ? "active" : status)
                .startTime(startTime)
                .endTime(endTime)
                .build();
        if (carouselItemMapper.insertCarouselItem(item) <= 0) {
            throw new BusinessException("创建轮播图失败");
        }
        return ApiResponse.success("创建成功", item);
    }

    @Override
    public ApiResponse<?> getCarouselItemList(Integer page, Integer pageSize, String keyword, String status) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        long total = carouselItemMapper.countAll(keyword, status);
        List<CarouselItem> items = carouselItemMapper.selectAll(keyword, status, offset, pageSize);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, items));
    }

    @Override
    @Transactional
    public ApiResponse<?> updateCarouselItem(Integer carouselId, String title, String summary, String content,
                                             String imageUrl, String category, Integer sortOrder,
                                             String status, LocalDateTime startTime, LocalDateTime endTime) {
        if (carouselId == null) {
            throw new BusinessException("轮播图ID不能为空");
        }
        String normalizedImageUrl = mediaAssetService.normalizeStoredImageUrl(imageUrl);
        CarouselItem item = CarouselItem.builder()
                .id(carouselId)
                .title(title)
                .summary(summary)
                .content(content)
                .imageUrl(normalizedImageUrl)
                .category(category)
                .sortOrder(sortOrder)
                .status(status)
                .startTime(startTime)
                .endTime(endTime)
                .build();
        if (carouselItemMapper.updateCarouselItem(item) <= 0) {
            throw new BusinessException("更新轮播图失败");
        }
        return ApiResponse.success("更新成功", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> deleteCarouselItem(Integer carouselId) {
        if (carouselId == null) {
            throw new BusinessException("轮播图ID不能为空");
        }
        if (carouselItemMapper.deleteById(carouselId) <= 0) {
            throw new BusinessException("删除轮播图失败");
        }
        return ApiResponse.success("删除成功", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> processComplaint(Integer adminId, Integer complaintId, String status, String reason) {
        if (complaintId == null || StringUtils.isBlank(status)) {
            throw new BusinessException("参数不完整");
        }
        if (complaintMapper.updateStatus(complaintId, status, reason) <= 0) {
            throw new BusinessException("处理投诉失败");
        }

        AuditLog log = new AuditLog();
        log.setAdminId(adminId);
        log.setTargetType("complaint");
        log.setTargetId(complaintId);
        log.setAction("process");
        log.setReason(reason);
        log.setNewStatus(status);
        auditLogMapper.insertLog(log);
        return ApiResponse.success("处理成功", null);
    }

    @Override
    public ApiResponse<?> getComplaintList(Integer page, Integer pageSize, String status, String type, String keyword) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        long total = complaintMapper.countAll(status, type, keyword);
        List<Complaint> items = complaintMapper.selectAll(status, type, keyword, offset, pageSize);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, items));
    }

    @Override
    public ApiResponse<?> getComplaintDetail(Integer complaintId) {
        if (complaintId == null) {
            throw new BusinessException("投诉ID不能为空");
        }
        Complaint complaint = complaintMapper.selectById(complaintId);
        if (complaint == null) {
            throw new BusinessException("投诉不存在");
        }
        return ApiResponse.success(complaint);
    }

    @Override
    @Transactional
    public ApiResponse<?> deleteComplaint(Integer complaintId) {
        if (complaintId == null) {
            throw new BusinessException("投诉ID不能为空");
        }
        if (complaintMapper.selectById(complaintId) == null) {
            throw new BusinessException("投诉不存在");
        }
        if (complaintMapper.deleteComplaint(complaintId) <= 0) {
            throw new BusinessException("删除投诉失败");
        }
        return ApiResponse.success("投诉已删除", null);
    }

    @Override
    public ApiResponse<?> getPlatformStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long activeUsers = userMapper.countUsers("user", "active");
        long totalLawyers = userMapper.countUsers("lawyer", "active");
        long pendingLawyers = userMapper.countUsers("lawyer", "pending_approval");
        long totalConsultations = consultationMapper.countAllConsultations(null, null, null, null, null);
        long openConsultations = consultationMapper.countAllConsultations("open", null, null, null, null);
        long resolvedConsultations = consultationMapper.countAllConsultations("resolved", null, null, null, null);
        long totalAnnouncements = announcementMapper.countAll(null, null);
        long pinnedAnnouncements = announcementMapper.countPinned();
        long pendingComplaints = complaintMapper.countAll("pending", null, null);
        long totalCarousels = carouselItemMapper.countAll(null, null);

        stats.put("totalUsers", activeUsers + totalLawyers);
        stats.put("totalLawyers", totalLawyers);
        stats.put("pendingLawyers", pendingLawyers);
        stats.put("totalConsultations", totalConsultations);
        stats.put("openConsultations", openConsultations);
        stats.put("resolvedConsultations", resolvedConsultations);
        stats.put("totalAnnouncements", totalAnnouncements);
        stats.put("pinnedAnnouncements", pinnedAnnouncements);
        stats.put("pendingComplaints", pendingComplaints);
        stats.put("totalCarousels", totalCarousels);
        return ApiResponse.success(stats);
    }

    @Override
    public ApiResponse<?> getUserGrowthData() {
        try {
            List<Map<String, Object>> growthData = userMapper.getUserGrowthData();
            return ApiResponse.success(growthData == null ? new java.util.ArrayList<>() : growthData);
        } catch (Exception exception) {
            throw new BusinessException("获取用户增长数据失败: " + exception.getMessage());
        }
    }

    @Override
    public ApiResponse<?> getLawyerGrowthData() {
        try {
            List<Map<String, Object>> growthData = userMapper.getLawyerGrowthData();
            return ApiResponse.success(growthData == null ? new java.util.ArrayList<>() : growthData);
        } catch (Exception exception) {
            throw new BusinessException("获取律师增长数据失败: " + exception.getMessage());
        }
    }

    @Override
    public ApiResponse<?> getConsultationDistribution() {
        try {
            List<Map<String, Object>> distributionData = consultationMapper.getConsultationDistribution();
            return ApiResponse.success(distributionData == null ? new java.util.ArrayList<>() : distributionData);
        } catch (Exception exception) {
            throw new BusinessException("获取咨询分类分布数据失败: " + exception.getMessage());
        }
    }

    @Override
    public ApiResponse<?> getConsultationList(Integer page, Integer pageSize, String status, String assignmentType, String priority, String category, String keyword) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        List<Consultation> consultations = consultationMapper.selectAllConsultations(status, offset, pageSize, assignmentType, priority, category, keyword);
        long total = consultationMapper.countAllConsultations(status, assignmentType, priority, category, keyword);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, consultations));
    }

    @Override
    public ApiResponse<?> getConsultationDetail(Integer consultationId) {
        if (consultationId == null) {
            throw new BusinessException("咨询ID不能为空");
        }

        Consultation consultation = consultationMapper.selectById(consultationId);
        if (consultation == null || Boolean.TRUE.equals(consultation.getDeletedByAdmin())) {
            throw new BusinessException("咨询不存在");
        }
        return ApiResponse.success(consultation);
    }

    @Override
    @Transactional
    public ApiResponse<?> updateConsultationStatus(Integer consultationId, String status) {
        if (consultationId == null || StringUtils.isBlank(status)) {
            throw new BusinessException("参数不完整");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("咨询不存在");
        }

        String currentStatus = consultation.getStatus();
        if (currentStatus.equals(status)) {
            return ApiResponse.success("状态未发生变化", null);
        }
        if (!isSupportedConsultationStatus(status)) {
            throw new BusinessException("不支持的咨询状态");
        }
        if ("settled".equals(consultation.getPayStatus()) && !"resolved".equals(status)) {
            throw new BusinessException("已结算咨询不能回退到未解决状态");
        }
        if ("refunded".equals(consultation.getPayStatus()) && !"closed".equals(status)) {
            throw new BusinessException("已退款咨询只能保持关闭状态");
        }

        if (consultationMapper.updateConsultationStatus(consultationId, status) <= 0) {
            throw new BusinessException("更新咨询状态失败");
        }

        if ("resolved".equals(status)
                && consultation.getLawyerId() != null
                && consultation.getFeeAmount() != null
                && consultation.getFeeAmount().compareTo(BigDecimal.ZERO) > 0
                && "escrowed".equals(consultation.getPayStatus())) {
            walletService.settleConsultation(consultationId, consultation.getUserId(), consultation.getLawyerId(), consultation.getFeeAmount());
            consultationMapper.markConsultationSettled(consultationId);
        } else if ("closed".equals(status)
                && consultation.getFeeAmount() != null
                && consultation.getFeeAmount().compareTo(BigDecimal.ZERO) > 0
                && "escrowed".equals(consultation.getPayStatus())) {
            walletService.refundConsultation(consultationId, consultation.getUserId(), consultation.getFeeAmount());
            consultationMapper.markConsultationRefunded(consultationId);
        }

        return ApiResponse.success("状态更新成功", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> deleteConsultation(Integer consultationId, Integer adminId) {
        if (consultationId == null) {
            throw new BusinessException("咨询ID不能为空");
        }

        Consultation consultation = consultationMapper.selectById(consultationId);
        if (consultation == null) {
            throw new BusinessException("咨询不存在");
        }

        if (consultation.getFeeAmount() != null
                && consultation.getFeeAmount().compareTo(BigDecimal.ZERO) > 0
                && "escrowed".equals(consultation.getPayStatus())) {
            walletService.refundConsultation(consultationId, consultation.getUserId(), consultation.getFeeAmount());
        }

        consultationMapper.deleteConsultationRepliesByConsultationId(consultationId);
        if (consultationMapper.deleteById(consultationId) <= 0) {
            throw new BusinessException("删除咨询失败");
        }

        AuditLog log = new AuditLog();
        log.setAdminId(adminId);
        log.setTargetType("consultation");
        log.setTargetId(consultationId);
        log.setAction("delete");
        log.setReason("管理员硬删除");
        log.setOldStatus(consultation.getStatus());
        auditLogMapper.insertLog(log);

        return ApiResponse.success("咨询已删除", null);
    }

    @Override
    public ApiResponse<?> getRecentAuditLogs(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 10;
        }
        return ApiResponse.success(auditLogMapper.selectRecentLogs(limit));
    }

    @Override
    public ApiResponse<?> getAuditLogs(Integer page, Integer pageSize) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;
        long total = auditLogMapper.countLogs();
        List<AuditLog> logs = auditLogMapper.selectLogs(offset, pageSize);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, logs));
    }

    private String getStatusLabel(String status) {
        return switch (status) {
            case "open" -> "开放中";
            case "pending_accept" -> "待接受";
            case "in_progress" -> "处理中";
            case "resolved" -> "已解决";
            case "closed" -> "已关闭";
            default -> status;
        };
    }
    private boolean isSupportedConsultationStatus(String status) {
        return "open".equals(status)
                || "pending_accept".equals(status)
                || "in_progress".equals(status)
                || "resolved".equals(status)
                || "closed".equals(status);
    }
}
