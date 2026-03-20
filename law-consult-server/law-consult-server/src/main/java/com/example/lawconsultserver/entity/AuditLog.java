package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 审核日志实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    private Integer id;
    private Integer adminId;
    private String targetType;  // lawyer, consultation, complaint
    private Integer targetId;
    private String action;  // approve, reject, delete
    private String reason;
    private String oldStatus;
    private String newStatus;
    private LocalDateTime createdAt;
}
