package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.dto.LawyerReapplyInfoRequest;
import com.example.lawconsultserver.dto.LawyerReapplyRequest;
import com.example.lawconsultserver.dto.LoginRequest;
import com.example.lawconsultserver.dto.RegisterRequest;
import com.example.lawconsultserver.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ApiResponse<?> register(@RequestBody RegisterRequest request) {
        return authService.register(
                request.getPhone(),
                request.getAccount(),
                request.getUsername(),
                request.getPassword(),
                request.getConfirmPassword(),
                request.getRole() != null ? request.getRole() : "user",
                request.getLicenseNumber(),
                request.getFirmName(),
                request.getSpecialization(),
                request.getDocumentUrls()
        );
    }

    @PostMapping("/login")
    public ApiResponse<?> login(@RequestBody LoginRequest request) {
        return authService.login(request.getAccount(), request.getPassword());
    }

    @PostMapping("/reapply-info")
    public ApiResponse<?> getLawyerReapplyInfo(@RequestBody LawyerReapplyInfoRequest request) {
        return authService.getLawyerReapplyInfo(request.getAccount(), request.getPassword());
    }

    @PostMapping("/reapply")
    public ApiResponse<?> reapplyLawyer(@RequestBody LawyerReapplyRequest request) {
        return authService.reapplyLawyer(
                request.getPhone(),
                request.getAccount(),
                request.getUsername(),
                request.getPassword(),
                request.getConfirmPassword(),
                request.getLicenseNumber(),
                request.getFirmName(),
                request.getSpecialization(),
                request.getDocumentUrls()
        );
    }

    @PostMapping("/admin/login")
    public ApiResponse<?> adminLogin(@RequestBody LoginRequest request) {
        return authService.adminLogin(request.getAccount(), request.getPassword());
    }

    @PostMapping("/logout")
    public ApiResponse<?> logout(@RequestParam(required = false) Integer userId) {
        return authService.logout(userId);
    }
}
