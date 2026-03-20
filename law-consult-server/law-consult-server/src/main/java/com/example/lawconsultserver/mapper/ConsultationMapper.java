package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.Consultation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 鍜ㄨ Mapper 鎺ュ彛
 */
@Mapper
public interface ConsultationMapper {
    int insertConsultation(Consultation consultation);

    Consultation selectConsultationById(@Param("id") Integer id);

    List<Consultation> selectConsultationsByUserId(@Param("userId") Integer userId,
                                                   @Param("status") String status,
                                                   @Param("offset") Long offset,
                                                   @Param("limit") Integer limit);

    Long countUserConsultations(@Param("userId") Integer userId, @Param("status") String status);

    List<Consultation> selectConsultationsByLawyerId(@Param("lawyerId") Integer lawyerId,
                                                     @Param("status") String status,
                                                     @Param("offset") Long offset,
                                                     @Param("limit") Integer limit);

    Long countLawyerConsultations(@Param("lawyerId") Integer lawyerId, @Param("status") String status);

    List<Consultation> selectAllConsultations(@Param("status") String status,
                                              @Param("offset") Long offset,
                                              @Param("limit") Integer limit,
                                              @Param("assignmentType") String assignmentType,
                                              @Param("priority") String priority,
                                              @Param("category") String category,
                                              @Param("keyword") String keyword);

    Long countAllConsultations(@Param("status") String status,
                               @Param("assignmentType") String assignmentType,
                               @Param("priority") String priority,
                               @Param("category") String category,
                               @Param("keyword") String keyword);

    int updateConsultation(Consultation consultation);

    int updateConsultationStatus(@Param("id") Integer id, @Param("status") String status);

    int assignLawyer(@Param("id") Integer id, @Param("lawyerId") Integer lawyerId);

    int updatePaymentInfo(@Param("id") Integer id,
                          @Param("payStatus") String payStatus,
                          @Param("payAt") LocalDateTime payAt);

    int markConsultationSettled(@Param("id") Integer id);

    int markConsultationRefunded(@Param("id") Integer id);

    int deleteConsultation(@Param("id") Integer id);

    int updateUserConfirmedResolved(@Param("id") Integer id, @Param("confirmed") Boolean confirmed);

    int updateLawyerConfirmedResolved(@Param("id") Integer id, @Param("confirmed") Boolean confirmed);

    int resetResolvedConfirmations(@Param("id") Integer id);

    int softDeleteByUser(@Param("id") Integer id);

    int softDeleteByLawyer(@Param("id") Integer id);

    int softDeleteByAdmin(@Param("id") Integer id);

    List<Map<String, Object>> getConsultationDistribution();

    Consultation selectById(@Param("id") Integer id);

    int deleteById(@Param("id") Integer id);

    int deleteConsultationRepliesByConsultationId(@Param("consultationId") Integer consultationId);

    List<Map<String, Object>> getResolvedConsultationDistributionByLawyerId(@Param("lawyerId") Integer lawyerId);
}
