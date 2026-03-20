package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 文件上传控制器
 */
@RestController
@RequestMapping("/api/file")
public class FileController {

    @Autowired
    private FileService fileService;

    /**
     * 上传文件
     * @param file 文件
     * @param type 文件类型（avatar/consultation/lawyer_registration）
     * @param userId 用户ID（可选）
     * @return 文件访问URL
     */
    @PostMapping("/upload")
    public ApiResponse<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false, defaultValue = "general") String type,
            @RequestParam(required = false) Integer userId) {

        if (file.isEmpty()) {
            return ApiResponse.error("请选择要上传的文件");
        }

        // 验证文件大小（10MB）
        if (file.getSize() > 10 * 1024 * 1024) {
            return ApiResponse.error("文件大小不能超过10MB");
        }

        // 验证文件类型
        String contentType = file.getContentType();
        if (!isValidFileType(contentType, type)) {
            return ApiResponse.error("不支持的文件类型");
        }

        try {
            Map<String, String> result = fileService.uploadFile(file, type, userId);
            return ApiResponse.success("上传成功", result);
        } catch (Exception e) {
            return ApiResponse.error("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传头像
     */
    @PostMapping("/avatar")
    public ApiResponse<?> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer userId) {
        return upload(file, "avatar", userId);
    }

    /**
     * 上传咨询附件
     */
    @PostMapping("/consultation")
    public ApiResponse<?> uploadConsultation(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Integer userId) {
        return upload(file, "consultation", userId);
    }

    /**
     * 验证文件类型
     */
    private boolean isValidFileType(String contentType, String type) {
        if (contentType == null) {
            return false;
        }

        // 头像只允许图片
        if ("avatar".equals(type)) {
            return contentType.startsWith("image/");
        }

        // 其他类型允许图片和文档
        return contentType.startsWith("image/") ||
               contentType.equals("application/pdf") ||
               contentType.equals("application/msword") ||
               contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
               contentType.equals("application/vnd.ms-excel") ||
               contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
               contentType.equals("text/plain");
    }
}
