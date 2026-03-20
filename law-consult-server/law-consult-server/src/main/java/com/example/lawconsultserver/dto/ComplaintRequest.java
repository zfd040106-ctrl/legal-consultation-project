package com.example.lawconsultserver.dto;

/**
 * 投诉/建议/反馈请求DTO
 */
public class ComplaintRequest {
    private Integer userId;     // 用户ID（由前端自动添加）
    private String type;        // complaint, suggestion, bug
    private String reason;      // 投诉原因（投诉类型必需）
    private String content;     // 详细描述（必需）
    private String contact;     // 联系方式（可选）
    private Integer consultationId;  // 关联的咨询ID（可选）

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public Integer getConsultationId() {
        return consultationId;
    }

    public void setConsultationId(Integer consultationId) {
        this.consultationId = consultationId;
    }
}
