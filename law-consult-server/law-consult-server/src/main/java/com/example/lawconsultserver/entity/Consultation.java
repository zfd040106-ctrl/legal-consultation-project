package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 鍜ㄨ璁板綍瀹炰綋
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultation {
    private Integer id;
    private Integer userId;
    private Integer lawyerId;
    private String assignmentType;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private BigDecimal feeAmount;
    private String payStatus;
    private LocalDateTime payAt;
    private LocalDateTime settledAt;
    private String attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private Boolean userConfirmedResolved;
    private Boolean lawyerConfirmedResolved;
    private Boolean deletedByUser;
    private Boolean deletedByLawyer;
    private Boolean deletedByAdmin;

    private String userName;
    private String userAvatar;
    private String lawyerName;
    private String lawyerAvatar;
}
