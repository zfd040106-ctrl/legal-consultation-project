package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.dto.LawyerProfileRequest;
import com.example.lawconsultserver.service.LawyerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 寰嬪笀鎺у埗鍣?
 */
@RestController
@RequestMapping("/api/lawyers")
public class LawyerController {

    @Autowired
    private LawyerService lawyerService;

    @GetMapping("/profile")
    public ApiResponse<?> getProfile(@RequestParam Integer userId) {
        return lawyerService.getLawyerProfile(userId);
    }

    @RequestMapping(value = "/profile", method = {RequestMethod.PUT, RequestMethod.POST})
    public ApiResponse<?> updateProfile(@RequestBody LawyerProfileRequest request) {
        return lawyerService.updateLawyerProfile(
                request.getUserId(),
                request.getUsername(),
                request.getAvatar(),
                request.getFirmName(),
                request.getSpecialization(),
                request.getExperienceYears()
        );
    }

    @PostMapping("/documents")
    public ApiResponse<?> uploadDocument(@RequestParam Integer userId,
                                         @RequestParam String documentUrl,
                                         @RequestParam String documentType) {
        return lawyerService.uploadDocument(userId, documentUrl, documentType);
    }

    @GetMapping("/documents")
    public ApiResponse<?> getDocuments(@RequestParam Integer userId) {
        return lawyerService.getDocuments(userId);
    }

    @GetMapping("/statistics")
    public ApiResponse<?> getStatistics(@RequestParam Integer lawyerId,
                                        @RequestParam(required = false, defaultValue = "week") String timeRange) {
        return lawyerService.getLawyerStatistics(lawyerId, timeRange);
    }

    @GetMapping("/index-stats")
    public ApiResponse<?> getIndexStats(@RequestParam Integer lawyerId) {
        return lawyerService.getLawyerIndexStats(lawyerId);
    }

    @GetMapping("/search")
    public ApiResponse<?> searchLawyers(@RequestParam(required = false) String keyword,
                                        @RequestParam(defaultValue = "1") Integer page,
                                        @RequestParam(defaultValue = "10") Integer pageSize) {
        return lawyerService.searchLawyers(keyword, page, pageSize);
    }

    @GetMapping("/public-profile")
    public ApiResponse<?> getPublicProfile(@RequestParam Integer lawyerId) {
        return lawyerService.getLawyerPublicProfile(lawyerId);
    }
}
