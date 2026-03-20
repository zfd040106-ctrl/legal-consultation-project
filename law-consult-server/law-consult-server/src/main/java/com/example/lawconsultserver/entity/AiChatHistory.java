package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * AI对话历史实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatHistory {
    private Integer id;
    private Integer userId;
    private String question;
    private String answer;
    private LocalDateTime createdAt;
}
