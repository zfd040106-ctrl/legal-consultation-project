package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 咨询回复实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationReply {
    private Integer id;
    private Integer consultationId;
    private Integer userId;      // 用户追问时使用
    private Integer lawyerId;    // 律师回复时使用
    private String content;
    private Boolean isSolution;
    private Boolean isLawyer;    // 标识是律师回复还是用户追问
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
