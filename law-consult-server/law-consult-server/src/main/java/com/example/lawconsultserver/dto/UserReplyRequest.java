package com.example.lawconsultserver.dto;

/**
 * 用户追问请求DTO
 */
public class UserReplyRequest {
    private Integer userId;
    private String content;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
