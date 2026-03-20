package com.example.lawconsultserver.dto;

/**
 * 咨询回复请求DTO
 */
public class ReplyRequest {
    private Integer lawyerId;
    private String content;
    private Boolean isSolution;

    public Integer getLawyerId() {
        return lawyerId;
    }

    public void setLawyerId(Integer lawyerId) {
        this.lawyerId = lawyerId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getIsSolution() {
        return isSolution;
    }

    public void setIsSolution(Boolean isSolution) {
        this.isSolution = isSolution;
    }
}
