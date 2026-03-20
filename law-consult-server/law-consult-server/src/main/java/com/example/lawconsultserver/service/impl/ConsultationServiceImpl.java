package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.common.exception.BusinessException;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.common.response.PageResponse;
import com.example.lawconsultserver.entity.Consultation;
import com.example.lawconsultserver.entity.ConsultationReply;
import com.example.lawconsultserver.entity.User;
import com.example.lawconsultserver.mapper.ConsultationMapper;
import com.example.lawconsultserver.mapper.ConsultationReplyMapper;
import com.example.lawconsultserver.mapper.LawyerInfoMapper;
import com.example.lawconsultserver.mapper.UserMapper;
import com.example.lawconsultserver.service.ConsultationService;
import com.example.lawconsultserver.service.MediaAssetService;
import com.example.lawconsultserver.service.WalletService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 闂傚倸鍊搁崐鎼佸磹妞嬪海鐭嗗〒姘ｅ亾妤犵偛顦甸弫鎾绘偐閹绘帗鍎梺鐟板悑閻ｎ亪宕濆畝鈧划鍫熷緞閹邦喖褰勯梺鎼炲劘閸斿娆㈤柆宥嗙厸濞达絽澹婇崕鎰庨崶褝韬┑鈥崇埣瀹曘劑顢欓崗纰变哗闂備浇顕х€涒晠鎳濇ィ鍏洭鏌嗗鍛姦濡炪倖宸婚崑鎾剁磼閻樿尙效鐎规洘娲熼弻鍡楊吋閸涱垳鏋冮梺鐟板悑閹矂鎮℃径宀€绀婇柡宥庡幗閻撳繘鏌涢锝囩婵℃彃缍婇弻娑欑節閸曨剚姣堥梺鍝勬湰閻╊垶寮崒婊勫珰闁圭粯甯為鎰攽閻愬樊鍤熷┑顔肩Ч瀹曠喖宕归顐㈡櫖? */
@Service
public class ConsultationServiceImpl implements ConsultationService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final BigDecimal MIN_PAID_FEE = new BigDecimal("9.90");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ConsultationMapper consultationMapper;

    @Autowired
    private ConsultationReplyMapper replyMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private LawyerInfoMapper lawyerInfoMapper;

    @Autowired
    private WalletService walletService;

    @Autowired
    private MediaAssetService mediaAssetService;

    @Override
    @Transactional
    public ApiResponse<?> createConsultation(Integer userId, Integer lawyerId, String assignmentType, String title,
                                             String description, String category, String priority,
                                             BigDecimal feeAmount, List<String> attachments) {
        if (userId == null || StringUtils.isBlank(title) || StringUtils.isBlank(description)) {
            throw new BusinessException("Invalid parameters");
        }

        String normalizedAssignmentType = normalizeAssignmentType(assignmentType, lawyerId);
        String normalizedCategory = StringUtils.defaultIfBlank(StringUtils.trimToNull(category), "general");
        if ("directed".equals(normalizedAssignmentType)) {
            validateDirectedLawyer(lawyerId);
        }

        BigDecimal normalizedFee = normalizeFeeAmount(feeAmount);
        Consultation consultation = Consultation.builder()
                .userId(userId)
                .lawyerId("directed".equals(normalizedAssignmentType) ? lawyerId : null)
                .assignmentType(normalizedAssignmentType)
                .title(title.trim())
                .description(description.trim())
                .category(normalizedCategory)
                .priority(StringUtils.isBlank(priority) ? "medium" : priority)
                .status("directed".equals(normalizedAssignmentType) ? "pending_accept" : "open")
                .feeAmount(normalizedFee)
                .payStatus("unpaid")
                .payAt(null)
                .attachments(serializeAttachments(attachments))
                .build();

        int result = consultationMapper.insertConsultation(consultation);
        if (result <= 0) {
            throw new BusinessException("Create consultation failed");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", consultation.getId());
        data.put("title", consultation.getTitle());
        data.put("status", consultation.getStatus());
        data.put("assignmentType", consultation.getAssignmentType());
        data.put("feeAmount", consultation.getFeeAmount());
        data.put("payStatus", consultation.getPayStatus());
        return ApiResponse.success("Create consultation success", data);
    }

    @Override
    public ApiResponse<?> getUserConsultations(Integer userId, String status, String keyword, Integer page, Integer pageSize) {
        if (userId == null) {
            throw new BusinessException("User ID cannot be null");
        }

        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;
        long queryLimit = StringUtils.isNotBlank(keyword) ? 1000 : pageSize;

        List<Consultation> consultations = consultationMapper.selectConsultationsByUserId(userId, status, offset, (int) queryLimit);
        if (StringUtils.isNotBlank(keyword)) {
            final String searchKeyword = keyword.toLowerCase();
            consultations = consultations.stream()
                    .filter(item -> safeLower(item.getTitle()).contains(searchKeyword)
                            || safeLower(item.getDescription()).contains(searchKeyword))
                    .collect(Collectors.toList());
        }

        long total = consultationMapper.countUserConsultations(userId, status);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, consultations));
    }

    @Override
    public ApiResponse<?> getConsultationDetail(Integer consultationId, Integer userId) {
        if (consultationId == null) {
            throw new BusinessException("Consultation ID cannot be null");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }

        if (userId != null) {
            boolean isOwner = consultation.getUserId().equals(userId);
            boolean isAssignedLawyer = consultation.getLawyerId() != null && consultation.getLawyerId().equals(userId);
            boolean isPublicUnassigned = consultation.getLawyerId() == null && "public".equals(consultation.getAssignmentType());
            if (!isOwner && !isAssignedLawyer && !isPublicUnassigned) {
                throw new BusinessException("No permission to view this consultation");
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("consultation", consultation);
        data.put("replies", replyMapper.selectRepliesByConsultationId(consultationId));
        return ApiResponse.success(data);
    }

    @Override
    @Transactional
    public ApiResponse<?> replyConsultation(Integer consultationId, Integer lawyerId, String content, Boolean isSolution) {
        if (consultationId == null || lawyerId == null || StringUtils.isBlank(content)) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        if (consultation.getLawyerId() != null && !lawyerId.equals(consultation.getLawyerId())) {
            throw new BusinessException("Only assigned lawyer can reply");
        }

        ConsultationReply reply = new ConsultationReply();
        reply.setConsultationId(consultationId);
        reply.setLawyerId(lawyerId);
        reply.setContent(content);
        reply.setIsSolution(Boolean.TRUE.equals(isSolution));

        int result = replyMapper.insertReply(reply);
        if (result <= 0) {
            throw new BusinessException("Reply failed");
        }

        consultationMapper.updateConsultationStatus(consultationId, "in_progress");

        Map<String, Object> data = new HashMap<>();
        data.put("id", reply.getId());
        return ApiResponse.success("Reply success", data);
    }

    @Override
    @Transactional
    public ApiResponse<?> userReplyConsultation(Integer consultationId, Integer userId, String content) {
        if (consultationId == null || userId == null || StringUtils.isBlank(content)) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        if (!consultation.getUserId().equals(userId)) {
            throw new BusinessException("Only owner can follow up");
        }

        ConsultationReply reply = new ConsultationReply();
        reply.setConsultationId(consultationId);
        reply.setUserId(userId);
        reply.setContent(content);
        reply.setIsLawyer(false);

        int result = replyMapper.insertUserReply(reply);
        if (result <= 0) {
            throw new BusinessException("Follow-up failed");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", reply.getId());
        return ApiResponse.success("Follow-up success", data);
    }

    @Override
    public ApiResponse<?> getLawyerConsultations(Integer lawyerId, String status, String keyword, Integer page, Integer pageSize) {
        if (lawyerId == null) {
            throw new BusinessException("Lawyer ID cannot be null");
        }

        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;
        long queryLimit = StringUtils.isNotBlank(keyword) ? 1000 : pageSize;

        List<Consultation> consultations = consultationMapper.selectConsultationsByLawyerId(lawyerId, status, offset, (int) queryLimit);
        if (StringUtils.isNotBlank(keyword)) {
            final String searchKeyword = keyword.toLowerCase();
            consultations = consultations.stream()
                    .filter(item -> safeLower(item.getTitle()).contains(searchKeyword)
                            || safeLower(item.getDescription()).contains(searchKeyword)
                            || safeLower(item.getUserName()).contains(searchKeyword))
                    .collect(Collectors.toList());
        }

        long total = consultationMapper.countLawyerConsultations(lawyerId, status);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, consultations));
    }

    @Override
    public ApiResponse<?> getAllConsultations(String status, Integer page, Integer pageSize) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        long total = consultationMapper.countAllConsultations(status, null, null, null, null);
        List<Consultation> consultations = consultationMapper.selectAllConsultations(status, offset, pageSize, null, null, null, null);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, consultations));
    }

    @Override
    @Transactional
    public ApiResponse<?> acceptConsultation(Integer consultationId, Integer lawyerId) {
        if (consultationId == null || lawyerId == null) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        if (!"open".equals(consultation.getStatus()) && !"pending_accept".equals(consultation.getStatus())) {
            throw new BusinessException("Current status cannot accept order");
        }
        if ("directed".equals(consultation.getAssignmentType())) {
            if (consultation.getLawyerId() == null || !lawyerId.equals(consultation.getLawyerId())) {
                throw new BusinessException("Directed consultation can only be accepted by assigned lawyer");
            }
        } else if (consultation.getLawyerId() != null && !lawyerId.equals(consultation.getLawyerId())) {
            throw new BusinessException("Consultation already accepted by another lawyer");
        }
        if (consultation.getFeeAmount() != null
                && consultation.getFeeAmount().compareTo(BigDecimal.ZERO) > 0
                && !"escrowed".equals(consultation.getPayStatus())) {
            throw new BusinessException("Paid consultation must be escrowed before acceptance");
        }

        int result = consultationMapper.assignLawyer(consultationId, lawyerId);
        if (result <= 0) {
            throw new BusinessException("Accept consultation failed");
        }
        lawyerInfoMapper.incrementTotalConsultations(lawyerId);
        return ApiResponse.success("Accept consultation success", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> rejectConsultation(Integer consultationId, Integer lawyerId) {
        if (consultationId == null || lawyerId == null) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        if (!"directed".equals(consultation.getAssignmentType())) {
            throw new BusinessException("Only directed consultation can be rejected");
        }
        if (!"pending_accept".equals(consultation.getStatus())) {
            throw new BusinessException("Current consultation cannot be rejected");
        }
        if (consultation.getLawyerId() == null || !lawyerId.equals(consultation.getLawyerId())) {
            throw new BusinessException("Only assigned lawyer can reject this consultation");
        }

        if ("escrowed".equals(consultation.getPayStatus())
                && consultation.getFeeAmount() != null
                && consultation.getFeeAmount().compareTo(BigDecimal.ZERO) > 0) {
            walletService.refundConsultation(consultation.getId(), consultation.getUserId(), consultation.getFeeAmount());
            consultationMapper.markConsultationRefunded(consultationId);
        }

        consultationMapper.resetResolvedConfirmations(consultationId);
        if (consultationMapper.updateConsultationStatus(consultationId, "closed") <= 0) {
            throw new BusinessException("Reject consultation failed");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("consultation", consultationMapper.selectConsultationById(consultationId));
        return ApiResponse.success("Consultation rejected", data);
    }

    @Override
    @Transactional
    public ApiResponse<?> payConsultation(Integer consultationId, Integer userId) {
        if (consultationId == null || userId == null) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        if (!userId.equals(consultation.getUserId())) {
            throw new BusinessException("Only owner can pay for this consultation");
        }
        if (!"open".equals(consultation.getStatus()) && !"pending_accept".equals(consultation.getStatus())) {
            throw new BusinessException("Current consultation cannot be paid");
        }
        if (consultation.getFeeAmount() == null || consultation.getFeeAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Current consultation does not require payment");
        }
        if (!"unpaid".equals(consultation.getPayStatus())) {
            throw new BusinessException("Consultation already paid");
        }

        walletService.escrowConsultation(consultationId, userId, consultation.getFeeAmount());
        if (consultationMapper.updatePaymentInfo(consultationId, "escrowed", LocalDateTime.now()) <= 0) {
            throw new BusinessException("Pay consultation failed");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("consultation", consultationMapper.selectConsultationById(consultationId));
        return ApiResponse.success("Consultation paid", data);
    }

    @Override
    @Transactional
    public ApiResponse<?> deleteConsultation(Integer consultationId, Integer operatorId) {
        if (consultationId == null || operatorId == null) {
            throw new BusinessException("Consultation ID cannot be null");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }

        if (!operatorId.equals(consultation.getUserId())) {
            throw new BusinessException("No permission to delete this consultation");
        }

        String status = consultation.getStatus();

        int result;
        if ("open".equals(status) || "pending_accept".equals(status)) {
            refundIfNeeded(consultation);
            replyMapper.deleteRepliesByConsultationId(consultationId);
            result = consultationMapper.deleteConsultation(consultationId);
        } else if ("resolved".equals(status)) {
            result = consultationMapper.softDeleteByUser(consultationId);
        } else if ("closed".equals(status)) {
            result = consultationMapper.softDeleteByUser(consultationId);
        } else if ("in_progress".equals(status)) {
            throw new BusinessException("In-progress consultation cannot be deleted");
        } else {
            throw new BusinessException("Invalid consultation status");
        }

        if (result <= 0) {
            throw new BusinessException("Delete consultation failed");
        }
        return ApiResponse.success("Delete consultation success", null);
    }

    @Override
    @Transactional
    public ApiResponse<?> softDeleteConsultation(Integer consultationId, String role, Integer operatorId) {
        if (consultationId == null || StringUtils.isBlank(role) || operatorId == null) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        validateOperatorRole(consultation, role, operatorId);

        int result;
        if ("user".equals(role)) {
            result = consultationMapper.softDeleteByUser(consultationId);
        } else if ("lawyer".equals(role)) {
            result = consultationMapper.softDeleteByLawyer(consultationId);
        } else {
            throw new BusinessException("Invalid role");
        }

        if (result <= 0) {
            throw new BusinessException("Delete consultation failed");
        }
        return ApiResponse.success("Delete consultation success", null);
    }
    @Override
    @Transactional
    public ApiResponse<?> requestResolveConsultation(Integer consultationId, String role, Integer operatorId) {
        if (consultationId == null || StringUtils.isBlank(role) || operatorId == null) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        validateOperatorRole(consultation, role, operatorId);
        if (!"in_progress".equals(consultation.getStatus())) {
            throw new BusinessException("Only in-progress consultation can request resolve");
        }

        boolean currentConfirmed = isResolvedConfirmedByRole(consultation, role);
        boolean oppositeConfirmed = isResolvedConfirmedByOppositeRole(consultation, role);
        if (currentConfirmed) {
            throw new BusinessException("Resolve request already submitted; wait for confirmation");
        }
        if (oppositeConfirmed) {
            throw new BusinessException("Other party already requested resolve; please confirm instead");
        }

        int result = updateResolvedConfirmationByRole(consultationId, role, true);
        if (result <= 0) {
            throw new BusinessException("Resolve request failed");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("consultation", consultationMapper.selectConsultationById(consultationId));
        return ApiResponse.success("Resolve requested", data);
    }

    @Override
    @Transactional
    public ApiResponse<?> confirmResolveConsultation(Integer consultationId, String role, Integer operatorId) {
        if (consultationId == null || StringUtils.isBlank(role) || operatorId == null) {
            throw new BusinessException("Invalid parameters");
        }

        Consultation consultation = consultationMapper.selectConsultationById(consultationId);
        if (consultation == null) {
            throw new BusinessException("Consultation not found");
        }
        validateOperatorRole(consultation, role, operatorId);
        if (!"in_progress".equals(consultation.getStatus())) {
            throw new BusinessException("Only in-progress consultation can confirm resolve");
        }

        boolean currentConfirmed = isResolvedConfirmedByRole(consultation, role);
        boolean oppositeConfirmed = isResolvedConfirmedByOppositeRole(consultation, role);
        if (currentConfirmed && !oppositeConfirmed) {
            throw new BusinessException("Cannot confirm your own resolve request");
        }
        if (!oppositeConfirmed) {
            throw new BusinessException("Other party has not requested resolve yet");
        }
        if (currentConfirmed) {
            throw new BusinessException("Already confirmed");
        }

        int result = updateResolvedConfirmationByRole(consultationId, role, true);
        if (result <= 0) {
            throw new BusinessException("Resolve confirmation failed");
        }

        Consultation updated = consultationMapper.selectConsultationById(consultationId);
        if (Boolean.TRUE.equals(updated.getUserConfirmedResolved()) && Boolean.TRUE.equals(updated.getLawyerConfirmedResolved())) {
            consultationMapper.updateConsultationStatus(consultationId, "resolved");
            settleConsultationIfNeeded(consultationId);
            updated = consultationMapper.selectConsultationById(consultationId);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("consultation", updated);
        return ApiResponse.success("Resolve confirmed", data);
    }

    private int updateResolvedConfirmationByRole(Integer consultationId, String role, boolean confirmed) {
        if ("user".equals(role)) {
            return consultationMapper.updateUserConfirmedResolved(consultationId, confirmed);
        }
        if ("lawyer".equals(role)) {
            return consultationMapper.updateLawyerConfirmedResolved(consultationId, confirmed);
        }
        throw new BusinessException("Invalid role");
    }

    private boolean isResolvedConfirmedByRole(Consultation consultation, String role) {
        if ("user".equals(role)) {
            return Boolean.TRUE.equals(consultation.getUserConfirmedResolved());
        }
        if ("lawyer".equals(role)) {
            return Boolean.TRUE.equals(consultation.getLawyerConfirmedResolved());
        }
        throw new BusinessException("Invalid role");
    }

    private boolean isResolvedConfirmedByOppositeRole(Consultation consultation, String role) {
        if ("user".equals(role)) {
            return Boolean.TRUE.equals(consultation.getLawyerConfirmedResolved());
        }
        if ("lawyer".equals(role)) {
            return Boolean.TRUE.equals(consultation.getUserConfirmedResolved());
        }
        throw new BusinessException("Invalid role");
    }

    private void validateOperatorRole(Consultation consultation, String role, Integer operatorId) {
        if ("user".equals(role)) {
            if (!operatorId.equals(consultation.getUserId())) {
                throw new BusinessException("No permission");
            }
            return;
        }
        if ("lawyer".equals(role)) {
            if (consultation.getLawyerId() == null || !operatorId.equals(consultation.getLawyerId())) {
                throw new BusinessException("No permission");
            }
            return;
        }
        throw new BusinessException("Invalid role");
    }

    private void validateDirectedLawyer(Integer lawyerId) {
        if (lawyerId == null) {
            throw new BusinessException("Directed consultation requires lawyer selection");
        }
        User lawyer = userMapper.selectUserById(lawyerId);
        if (lawyer == null || !"lawyer".equals(lawyer.getRole()) || !"active".equals(lawyer.getStatus())) {
            throw new BusinessException("Assigned lawyer is unavailable");
        }
        if (lawyerInfoMapper.selectByUserId(lawyerId) == null) {
            throw new BusinessException("Lawyer profile not found");
        }
    }

    private String normalizeAssignmentType(String assignmentType, Integer lawyerId) {
        if (lawyerId != null) {
            return "directed";
        }
        return "directed".equals(assignmentType) ? "directed" : "public";
    }

    private BigDecimal normalizeFeeAmount(BigDecimal feeAmount) {
        BigDecimal normalized = feeAmount == null ? BigDecimal.ZERO : feeAmount.setScale(2, RoundingMode.HALF_UP);
        if (normalized.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("闂備礁鎼悧鍡欑矓鐎涙ɑ鍙忛柣鏃傚劋鐎氬姊洪锝囥€掗柣鐔哥箞閺屻倗鈧湱濮甸ˉ澶愭煟椤垵澧紒?");
        }
        if (normalized.compareTo(BigDecimal.ZERO) > 0 && normalized.compareTo(MIN_PAID_FEE) < 0) {
            throw new BusinessException("Minimum paid fee is 9.90");
        }
        return normalized;
    }

    private String serializeAttachments(List<String> attachments) {
        List<String> normalizedAttachments = mediaAssetService.sanitizeStoredPaths(attachments);
        if (normalizedAttachments == null || normalizedAttachments.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(normalizedAttachments);
        } catch (Exception exception) {
            return String.join(",", normalizedAttachments);
        }
    }

    private void settleConsultationIfNeeded(Integer consultationId) {
        Consultation latest = consultationMapper.selectConsultationById(consultationId);
        if (latest == null) {
            return;
        }
        if (!"resolved".equals(latest.getStatus())) {
            return;
        }
        if (latest.getLawyerId() == null) {
            return;
        }
        if (latest.getFeeAmount() == null || latest.getFeeAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (!"escrowed".equals(latest.getPayStatus())) {
            return;
        }

        walletService.settleConsultation(latest.getId(), latest.getUserId(), latest.getLawyerId(), latest.getFeeAmount());
        consultationMapper.markConsultationSettled(latest.getId());
    }

    private void refundIfNeeded(Consultation consultation) {
        if (consultation.getFeeAmount() == null || consultation.getFeeAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        if (!"escrowed".equals(consultation.getPayStatus())) {
            return;
        }

        walletService.refundConsultation(consultation.getId(), consultation.getUserId(), consultation.getFeeAmount());
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase();
    }
}

