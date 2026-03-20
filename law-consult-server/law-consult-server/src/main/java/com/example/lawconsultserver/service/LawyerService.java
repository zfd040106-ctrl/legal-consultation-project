package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.ApiResponse;

public interface LawyerService {
    ApiResponse<?> getLawyerProfile(Integer userId);

    ApiResponse<?> updateLawyerProfile(Integer userId, String username, String avatar, String firmName, String specialization, Integer experienceYears);

    ApiResponse<?> uploadDocument(Integer userId, String documentUrl, String documentType);

    ApiResponse<?> getDocuments(Integer userId);

    ApiResponse<?> getLawyerStatistics(Integer lawyerId, String timeRange);

    ApiResponse<?> getLawyerIndexStats(Integer lawyerId);

    ApiResponse<?> searchLawyers(String keyword, Integer page, Integer pageSize);

    ApiResponse<?> getLawyerPublicProfile(Integer lawyerId);
}
