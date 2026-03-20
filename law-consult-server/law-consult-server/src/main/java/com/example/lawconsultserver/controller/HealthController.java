package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * 服务健康检查
     */
    @GetMapping("/health")
    public ApiResponse<?> health() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("timestamp", LocalDateTime.now());
        data.put("message", "法律咨询后端服务正常运行");
        return ApiResponse.success(data);
    }

    /**
     * 测试接口
     */
    @GetMapping("/test")
    public ApiResponse<?> test() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "后端服务可用");
        data.put("version", "1.0.0");
        return ApiResponse.success("测试成功", data);
    }
}
