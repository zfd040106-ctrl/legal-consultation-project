package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.ApiResponse;

import java.time.LocalDateTime;

public interface AdminService {
    ApiResponse<?> getAdminProfile(Integer adminId);

    ApiResponse<?> getUserList(Integer page, Integer pageSize, String role, String status, String keyword);

    ApiResponse<?> updateUserStatus(Integer userId, String status);

    ApiResponse<?> getUserDetail(Integer userId);

    ApiResponse<?> deleteUser(Integer userId);

    ApiResponse<?> getLawyerApprovalList(Integer page, Integer pageSize);

    ApiResponse<?> getLawyerDetail(Integer lawyerId);

    ApiResponse<?> approveLawyer(Integer adminId, Integer lawyerId, Boolean approved, String reason);

    ApiResponse<?> publishAnnouncement(Integer adminId, String title, String content, Boolean isPinned, String status);

    ApiResponse<?> getAnnouncementList(Integer page, Integer pageSize, String keyword, String status);

    ApiResponse<?> updateAnnouncement(Integer announcementId, String title, String content, Boolean isPinned, String status);

    ApiResponse<?> deleteAnnouncement(Integer announcementId);

    ApiResponse<?> pinAnnouncement(Integer announcementId);

    ApiResponse<?> unpinAnnouncement(Integer announcementId);

    ApiResponse<?> createCarouselItem(Integer adminId, String title, String summary, String content,
                                      String imageUrl, String category, Integer sortOrder,
                                      String status, LocalDateTime startTime, LocalDateTime endTime);

    ApiResponse<?> getCarouselItemList(Integer page, Integer pageSize, String keyword, String status);

    ApiResponse<?> updateCarouselItem(Integer carouselId, String title, String summary, String content,
                                      String imageUrl, String category, Integer sortOrder,
                                      String status, LocalDateTime startTime, LocalDateTime endTime);

    ApiResponse<?> deleteCarouselItem(Integer carouselId);

    ApiResponse<?> processComplaint(Integer adminId, Integer complaintId, String status, String reason);

    ApiResponse<?> getComplaintList(Integer page, Integer pageSize, String status, String type, String keyword);

    ApiResponse<?> getComplaintDetail(Integer complaintId);

    ApiResponse<?> deleteComplaint(Integer complaintId);

    ApiResponse<?> getPlatformStatistics();

    ApiResponse<?> getUserGrowthData();

    ApiResponse<?> getLawyerGrowthData();

    ApiResponse<?> getConsultationDistribution();

    ApiResponse<?> getConsultationList(Integer page, Integer pageSize, String status, String assignmentType, String priority, String category, String keyword);

    ApiResponse<?> getConsultationDetail(Integer consultationId);

    ApiResponse<?> updateConsultationStatus(Integer consultationId, String status);

    ApiResponse<?> deleteConsultation(Integer consultationId, Integer adminId);

    ApiResponse<?> getRecentAuditLogs(Integer limit);

    ApiResponse<?> getAuditLogs(Integer page, Integer pageSize);
}
