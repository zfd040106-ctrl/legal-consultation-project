package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 律师文件实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LawyerDocument {
    private Integer id;
    private Integer lawyerId;
    private String documentUrl;
    private String documentType;
    private LocalDateTime uploadAt;
    private LocalDateTime verifiedAt;
    private Integer verifiedBy;
    private String status;  // pending, approved, rejected
}
