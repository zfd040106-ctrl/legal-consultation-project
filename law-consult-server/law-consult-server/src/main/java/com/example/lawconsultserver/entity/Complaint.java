package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 投诉举报实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {
    private Integer id;
    private Integer userId;
    private String content;
    private String reason;
    private String type;        // complaint, suggestion, bug
    private String contact;     // 联系方式
    private Integer consultationId;  // 关联的咨询ID
    private String status;  // pending, investigating, resolved, dismissed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private String handleReason;       // 处理说明
}
