package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.dto.ConsultationRequest;
import com.example.lawconsultserver.dto.ReplyRequest;
import com.example.lawconsultserver.dto.UserReplyRequest;
import com.example.lawconsultserver.service.ConsultationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 鍜ㄨ鎺у埗鍣?
 */
@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    @Autowired
    private ConsultationService consultationService;

    @PostMapping("")
    public ApiResponse<?> createConsultation(@RequestBody ConsultationRequest request) {
        return consultationService.createConsultation(
                request.getUserId(),
                request.getLawyerId(),
                request.getAssignmentType(),
                request.getTitle(),
                request.getContent(),
                request.getCategory(),
                request.getPriority(),
                request.getFeeAmount(),
                request.getAttachments()
        );
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<?> getUserConsultations(@PathVariable Integer userId,
                                               @RequestParam(required = false) String status,
                                               @RequestParam(required = false) String keyword,
                                               @RequestParam(defaultValue = "1") Integer page,
                                               @RequestParam(defaultValue = "10") Integer pageSize) {
        return consultationService.getUserConsultations(userId, status, keyword, page, pageSize);
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getConsultationDetail(@PathVariable Integer id,
                                                @RequestParam(required = false) Integer userId) {
        return consultationService.getConsultationDetail(id, userId);
    }

    @PostMapping("/{id}/reply")
    public ApiResponse<?> replyConsultation(@PathVariable Integer id, @RequestBody ReplyRequest request) {
        return consultationService.replyConsultation(id, request.getLawyerId(), request.getContent(), request.getIsSolution());
    }

    @PostMapping("/{id}/user-reply")
    public ApiResponse<?> userReplyConsultation(@PathVariable Integer id, @RequestBody UserReplyRequest request) {
        return consultationService.userReplyConsultation(id, request.getUserId(), request.getContent());
    }

    @GetMapping("/lawyer/{lawyerId}")
    public ApiResponse<?> getLawyerConsultations(@PathVariable Integer lawyerId,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(required = false) String keyword,
                                                 @RequestParam(defaultValue = "1") Integer page,
                                                 @RequestParam(defaultValue = "10") Integer pageSize) {
        return consultationService.getLawyerConsultations(lawyerId, status, keyword, page, pageSize);
    }

    @GetMapping("/admin/all")
    public ApiResponse<?> getAllConsultations(@RequestParam(required = false) String status,
                                              @RequestParam(defaultValue = "1") Integer page,
                                              @RequestParam(defaultValue = "10") Integer pageSize) {
        return consultationService.getAllConsultations(status, page, pageSize);
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<?> acceptConsultation(@PathVariable Integer id,
                                             @RequestBody java.util.Map<String, Integer> body) {
        return consultationService.acceptConsultation(id, body.get("lawyerId"));
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<?> rejectConsultation(@PathVariable Integer id,
                                             @RequestBody java.util.Map<String, Integer> body) {
        return consultationService.rejectConsultation(id, body.get("lawyerId"));
    }

    @PostMapping("/{id}/pay")
    public ApiResponse<?> payConsultation(@PathVariable Integer id,
                                          @RequestBody java.util.Map<String, Integer> body) {
        return consultationService.payConsultation(id, body.get("userId"));
    }

    @PostMapping("/{id}/delete")
    public ApiResponse<?> deleteConsultation(@PathVariable Integer id,
                                             @RequestBody(required = false) java.util.Map<String, Integer> body) {
        Integer userId = body == null ? null : body.get("userId");
        return consultationService.deleteConsultation(id, userId);
    }

    @PostMapping("/{id}/soft-delete")
    public ApiResponse<?> softDeleteConsultation(@PathVariable Integer id,
                                                 @RequestBody(required = false) java.util.Map<String, Object> body) {
        if (body == null) {
            return consultationService.softDeleteConsultation(id, null, null);
        }
        String role = body.get("role") == null ? null : String.valueOf(body.get("role"));
        Integer userId = body.get("userId") instanceof Number ? ((Number) body.get("userId")).intValue() : null;
        return consultationService.softDeleteConsultation(id, role, userId);
    }

    @PostMapping("/{id}/request-resolve")
    public ApiResponse<?> requestResolveConsultation(@PathVariable Integer id,
                                                     @RequestBody(required = false) java.util.Map<String, Object> body) {
        if (body == null) {
            return consultationService.requestResolveConsultation(id, null, null);
        }
        String role = body.get("role") == null ? null : String.valueOf(body.get("role"));
        Integer userId = body.get("userId") instanceof Number ? ((Number) body.get("userId")).intValue() : null;
        return consultationService.requestResolveConsultation(id, role, userId);
    }

    @PostMapping("/{id}/confirm-resolve")
    public ApiResponse<?> confirmResolveConsultation(@PathVariable Integer id,
                                                     @RequestBody(required = false) java.util.Map<String, Object> body) {
        if (body == null) {
            return consultationService.confirmResolveConsultation(id, null, null);
        }
        String role = body.get("role") == null ? null : String.valueOf(body.get("role"));
        Integer userId = body.get("userId") instanceof Number ? ((Number) body.get("userId")).intValue() : null;
        return consultationService.confirmResolveConsultation(id, role, userId);
    }
}
