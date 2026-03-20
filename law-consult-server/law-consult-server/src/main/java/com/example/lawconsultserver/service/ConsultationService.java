package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.ApiResponse;

import java.math.BigDecimal;
import java.util.List;

/**
 * 鍜ㄨ鏈嶅姟鎺ュ彛
 */
public interface ConsultationService {
    ApiResponse<?> createConsultation(Integer userId, Integer lawyerId, String assignmentType,
                                      String title, String description, String category,
                                      String priority, BigDecimal feeAmount, List<String> attachments);

    ApiResponse<?> getUserConsultations(Integer userId, String status, String keyword, Integer page, Integer pageSize);

    ApiResponse<?> getConsultationDetail(Integer consultationId, Integer userId);

    ApiResponse<?> replyConsultation(Integer consultationId, Integer lawyerId,
                                     String content, Boolean isSolution);

    ApiResponse<?> userReplyConsultation(Integer consultationId, Integer userId, String content);

    ApiResponse<?> getLawyerConsultations(Integer lawyerId, String status, String keyword, Integer page, Integer pageSize);

    ApiResponse<?> getAllConsultations(String status, Integer page, Integer pageSize);

    ApiResponse<?> acceptConsultation(Integer consultationId, Integer lawyerId);

    ApiResponse<?> rejectConsultation(Integer consultationId, Integer lawyerId);

    ApiResponse<?> payConsultation(Integer consultationId, Integer userId);

    ApiResponse<?> deleteConsultation(Integer consultationId, Integer operatorId);

    ApiResponse<?> softDeleteConsultation(Integer consultationId, String role, Integer operatorId);

    ApiResponse<?> requestResolveConsultation(Integer consultationId, String role, Integer operatorId);

    ApiResponse<?> confirmResolveConsultation(Integer consultationId, String role, Integer operatorId);
}
