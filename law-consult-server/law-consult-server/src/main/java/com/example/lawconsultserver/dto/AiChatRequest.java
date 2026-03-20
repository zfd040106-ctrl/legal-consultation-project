package com.example.lawconsultserver.dto;

/**
 * AI聊天请求DTO
 */
public class AiChatRequest {
    private Integer userId;
    private String message;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
