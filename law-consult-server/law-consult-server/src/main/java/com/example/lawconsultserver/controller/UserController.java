package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.dto.UserProfileRequest;
import com.example.lawconsultserver.service.UserService;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.dto.ComplaintRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 获取个人信息
     */
    @GetMapping("/profile")
    public ApiResponse<?> getProfile(@RequestParam Integer userId) {
        return userService.getUserProfile(userId);
    }

    /**
     * 修改个人信息（支持PUT和POST，接收JSON body）
     */
    @RequestMapping(value = "/profile", method = {RequestMethod.PUT, RequestMethod.POST})
    public ApiResponse<?> updateProfile(@RequestBody UserProfileRequest request) {
        return userService.updateUserProfile(
            request.getUserId(),
            request.getUsername(),
            request.getAvatar()
        );
    }

    /**
     * 提交投诉
     */
    @PostMapping("/complaints")
    public ApiResponse<?> submitComplaint(@RequestBody ComplaintRequest request) {
        return userService.submitComplaint(
            request.getUserId(),
            request.getContent(),
            request.getReason(),
            request.getType(),
            request.getContact(),
            request.getConsultationId()
        );
    }
}
