package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 律师详细信息实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LawyerInfo {
    private Integer id;
    private Integer userId;
    private String licenseNumber;
    private String firmName;
    private String specialization;
    private Integer experienceYears;
    private Integer totalConsultations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
