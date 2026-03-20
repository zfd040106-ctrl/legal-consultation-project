package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.service.FileService;
import com.example.lawconsultserver.service.MediaAssetService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 文件上传服务实现
 */
@Service
public class FileServiceImpl implements FileService {

    @Autowired
    private MediaAssetService mediaAssetService;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        rootLocation = mediaAssetService.getRootLocation();
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("无法创建上传目录", e);
        }
    }

    @Override
    public Map<String, String> uploadFile(MultipartFile file, String type, Integer userId) throws Exception {
        // 生成子目录（按类型和日期）
        String subDir = type + "/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        Path targetDir = rootLocation.resolve(subDir);

        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            throw new RuntimeException("无法创建上传子目录", e);
        }

        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFilename = generateFilename(userId, extension);

        // 保存文件
        Path targetPath = targetDir.resolve(newFilename);
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("文件保存失败", e);
        }

        // 生成相对路径和URL
        String relativePath = subDir + "/" + newFilename;
        String fileUrl = mediaAssetService.buildPublicUploadUrl(relativePath);

        Map<String, String> result = new HashMap<>();
        result.put("url", fileUrl);
        result.put("path", relativePath);
        result.put("filename", newFilename);
        result.put("originalFilename", originalFilename);
        result.put("size", String.valueOf(file.getSize()));
        result.put("type", file.getContentType());

        return result;
    }

    @Override
    public boolean deleteFile(String filePath) {
        try {
            Path path = rootLocation.resolve(filePath).normalize();
            return Files.deleteIfExists(path);
        } catch (IOException e) {
            return false;
        }
    }

    @Override
    public String getFileUrl(String relativePath) {
        return mediaAssetService.buildPublicUploadUrl(relativePath);
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    /**
     * 生成唯一文件名
     */
    private String generateFilename(Integer userId, String extension) {
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String userPart = userId != null ? "_u" + userId : "";
        long timestamp = System.currentTimeMillis();
        return timestamp + userPart + "_" + uuid + extension;
    }
}
