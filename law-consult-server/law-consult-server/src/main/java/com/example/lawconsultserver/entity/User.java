package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    private Integer id;
    private String account;
    private String password;
    private String phone;
    private String username;
    private String role;  // user, lawyer, admin
    private String status;  // active, blocked, pending_approval
    private LocalDateTime createdAt;
    private String avatar;
}
