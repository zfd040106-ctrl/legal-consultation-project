package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.ApiResponse;

public interface UserService {
    /**
     * 获取用户个人信息
     */
    ApiResponse<?> getUserProfile(Integer userId);

    /**
     * 修改用户信息
     */
    ApiResponse<?> updateUserProfile(Integer userId, String username, String avatar);

    /**
     * 提交投诉
     */
    ApiResponse<?> submitComplaint(Integer userId, String content, String reason,
                                   String type, String contact, Integer consultationId);
}
