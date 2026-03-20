package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.ApiResponse;

import java.util.List;

public interface AuthService {
    ApiResponse<?> register(String phone, String account, String username,
                            String password, String confirmPassword, String role,
                            String licenseNumber, String firmName, String specialization,
                            List<String> documentUrls);

    ApiResponse<?> login(String account, String password);

    ApiResponse<?> getLawyerReapplyInfo(String account, String password);

    ApiResponse<?> reapplyLawyer(String phone, String account, String username,
                                 String password, String confirmPassword,
                                 String licenseNumber, String firmName, String specialization,
                                 List<String> documentUrls);

    ApiResponse<?> adminLogin(String account, String password);

    ApiResponse<?> logout(Integer userId);

    boolean accountExists(String account);

    boolean phoneExists(String phone);
}
