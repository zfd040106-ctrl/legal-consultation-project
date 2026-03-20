package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.dto.CarouselItemRequest;
import com.example.lawconsultserver.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 绠＄悊鍛樻帶鍒跺櫒
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/profile")
    public ApiResponse<?> getAdminProfile(@RequestParam Integer adminId) {
        return adminService.getAdminProfile(adminId);
    }

    @GetMapping("/users")
    public ApiResponse<?> getUserList(@RequestParam(defaultValue = "1") Integer page,
                                      @RequestParam(defaultValue = "10") Integer pageSize,
                                      @RequestParam(required = false) String role,
                                      @RequestParam(required = false) String status,
                                      @RequestParam(required = false) String keyword) {
        return adminService.getUserList(page, pageSize, role, status, keyword);
    }

    @PutMapping("/users/{userId}/status")
    public ApiResponse<?> updateUserStatus(@PathVariable Integer userId, @RequestParam String status) {
        return adminService.updateUserStatus(userId, status);
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<?> getUserDetail(@PathVariable Integer userId) {
        return adminService.getUserDetail(userId);
    }

    @DeleteMapping("/users/{userId}")
    public ApiResponse<?> deleteUser(@PathVariable Integer userId) {
        return adminService.deleteUser(userId);
    }

    @GetMapping("/lawyers/pending")
    public ApiResponse<?> getLawyerApprovalList(@RequestParam(defaultValue = "1") Integer page,
                                                @RequestParam(defaultValue = "10") Integer pageSize) {
        return adminService.getLawyerApprovalList(page, pageSize);
    }

    @GetMapping("/lawyers/{lawyerId}")
    public ApiResponse<?> getLawyerDetail(@PathVariable Integer lawyerId) {
        return adminService.getLawyerDetail(lawyerId);
    }

    @PutMapping("/lawyers/{lawyerId}/approve")
    public ApiResponse<?> approveLawyer(@PathVariable Integer lawyerId,
                                        @RequestParam Integer adminId,
                                        @RequestParam Boolean approved,
                                        @RequestParam(required = false) String reason) {
        return adminService.approveLawyer(adminId, lawyerId, approved, reason);
    }

    @PostMapping("/announcements")
    public ApiResponse<?> publishAnnouncement(@RequestParam Integer adminId,
                                              @RequestParam String title,
                                              @RequestParam String content,
                                              @RequestParam(required = false) Boolean isPinned,
                                              @RequestParam(required = false) String status) {
        return adminService.publishAnnouncement(adminId, title, content, isPinned, status);
    }

    @GetMapping("/announcements")
    public ApiResponse<?> getAnnouncementList(@RequestParam(defaultValue = "1") Integer page,
                                              @RequestParam(defaultValue = "10") Integer pageSize,
                                              @RequestParam(required = false) String keyword,
                                              @RequestParam(required = false) String status) {
        return adminService.getAnnouncementList(page, pageSize, keyword, status);
    }

    @PutMapping("/announcements/{announcementId}")
    public ApiResponse<?> updateAnnouncement(@PathVariable Integer announcementId,
                                             @RequestParam(required = false) String title,
                                             @RequestParam(required = false) String content,
                                             @RequestParam(required = false) Boolean isPinned,
                                             @RequestParam(required = false) String status) {
        return adminService.updateAnnouncement(announcementId, title, content, isPinned, status);
    }

    @DeleteMapping("/announcements/{announcementId}")
    public ApiResponse<?> deleteAnnouncement(@PathVariable Integer announcementId) {
        return adminService.deleteAnnouncement(announcementId);
    }

    @PostMapping("/announcements/{announcementId}/pin")
    public ApiResponse<?> pinAnnouncement(@PathVariable Integer announcementId) {
        return adminService.pinAnnouncement(announcementId);
    }

    @PostMapping("/announcements/{announcementId}/unpin")
    public ApiResponse<?> unpinAnnouncement(@PathVariable Integer announcementId) {
        return adminService.unpinAnnouncement(announcementId);
    }

    @PostMapping("/carousels")
    public ApiResponse<?> createCarouselItem(@RequestBody CarouselItemRequest request) {
        return adminService.createCarouselItem(
                request.getAdminId(),
                request.getTitle(),
                request.getSummary(),
                request.getContent(),
                request.getImageUrl(),
                request.getCategory(),
                request.getSortOrder(),
                request.getStatus(),
                request.getStartTime(),
                request.getEndTime()
        );
    }

    @GetMapping("/carousels")
    public ApiResponse<?> getCarouselItemList(@RequestParam(defaultValue = "1") Integer page,
                                              @RequestParam(defaultValue = "10") Integer pageSize,
                                              @RequestParam(required = false) String keyword,
                                              @RequestParam(required = false) String status) {
        return adminService.getCarouselItemList(page, pageSize, keyword, status);
    }

    @PutMapping("/carousels/{carouselId}")
    public ApiResponse<?> updateCarouselItem(@PathVariable Integer carouselId,
                                             @RequestBody CarouselItemRequest request) {
        return adminService.updateCarouselItem(
                carouselId,
                request.getTitle(),
                request.getSummary(),
                request.getContent(),
                request.getImageUrl(),
                request.getCategory(),
                request.getSortOrder(),
                request.getStatus(),
                request.getStartTime(),
                request.getEndTime()
        );
    }

    @DeleteMapping("/carousels/{carouselId}")
    public ApiResponse<?> deleteCarouselItem(@PathVariable Integer carouselId) {
        return adminService.deleteCarouselItem(carouselId);
    }

    @DeleteMapping("/complaints/{complaintId}")
    public ApiResponse<?> deleteComplaint(@PathVariable Integer complaintId) {
        return adminService.deleteComplaint(complaintId);
    }

    @PutMapping("/complaints/{complaintId}")
    public ApiResponse<?> processComplaint(@PathVariable Integer complaintId,
                                           @RequestBody Map<String, String> body) {
        Integer adminId = Integer.parseInt(body.get("adminId"));
        return adminService.processComplaint(adminId, complaintId, body.get("status"), body.get("reason"));
    }

    @GetMapping("/complaints")
    public ApiResponse<?> getComplaintList(@RequestParam(defaultValue = "1") Integer page,
                                           @RequestParam(defaultValue = "10") Integer pageSize,
                                           @RequestParam(required = false) String status,
                                           @RequestParam(required = false) String type,
                                           @RequestParam(required = false) String keyword) {
        return adminService.getComplaintList(page, pageSize, status, type, keyword);
    }

    @GetMapping("/complaints/{complaintId}")
    public ApiResponse<?> getComplaintDetail(@PathVariable Integer complaintId) {
        return adminService.getComplaintDetail(complaintId);
    }

    @GetMapping("/statistics")
    public ApiResponse<?> getPlatformStatistics() {
        return adminService.getPlatformStatistics();
    }

    @GetMapping("/statistics/user-growth")
    public ApiResponse<?> getUserGrowthData() {
        return adminService.getUserGrowthData();
    }

    @GetMapping("/statistics/lawyer-growth")
    public ApiResponse<?> getLawyerGrowthData() {
        return adminService.getLawyerGrowthData();
    }

    @GetMapping("/statistics/consultation-distribution")
    public ApiResponse<?> getConsultationDistribution() {
        return adminService.getConsultationDistribution();
    }

    @GetMapping("/consultations")
    public ApiResponse<?> getConsultationList(@RequestParam(defaultValue = "1") Integer page,
                                              @RequestParam(defaultValue = "10") Integer pageSize,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false, name = "type") String assignmentType,
                                              @RequestParam(required = false) String priority,
                                              @RequestParam(required = false) String category,
                                              @RequestParam(required = false) String keyword) {
        return adminService.getConsultationList(page, pageSize, status, assignmentType, priority, category, keyword);
    }

    @GetMapping("/consultations/{consultationId}")
    public ApiResponse<?> getConsultationDetail(@PathVariable Integer consultationId) {
        return adminService.getConsultationDetail(consultationId);
    }

    @PutMapping("/consultations/{consultationId}/status")
    public ApiResponse<?> updateConsultationStatus(@PathVariable Integer consultationId,
                                                   @RequestBody Map<String, String> requestBody) {
        return adminService.updateConsultationStatus(consultationId, requestBody.get("status"));
    }

    @DeleteMapping("/consultations/{consultationId}")
    public ApiResponse<?> deleteConsultation(@PathVariable Integer consultationId,
                                             @RequestParam Integer adminId) {
        return adminService.deleteConsultation(consultationId, adminId);
    }

    @GetMapping("/audit-logs")
    public ApiResponse<?> getRecentAuditLogs(@RequestParam(defaultValue = "10") Integer limit) {
        return adminService.getRecentAuditLogs(limit);
    }

    @GetMapping("/audit-logs/list")
    public ApiResponse<?> getAuditLogs(@RequestParam(defaultValue = "1") Integer page,
                                       @RequestParam(defaultValue = "10") Integer pageSize) {
        return adminService.getAuditLogs(page, pageSize);
    }
}
