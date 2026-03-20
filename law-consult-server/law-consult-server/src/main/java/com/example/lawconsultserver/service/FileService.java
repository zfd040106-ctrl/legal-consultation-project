package com.example.lawconsultserver.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 文件上传服务接口
 */
public interface FileService {

    /**
     * 上传文件
     * @param file 文件
     * @param type 文件类型
     * @param userId 用户ID
     * @return 包含文件URL的Map
     */
    Map<String, String> uploadFile(MultipartFile file, String type, Integer userId) throws Exception;

    /**
     * 删除文件
     * @param filePath 文件路径
     * @return 是否删除成功
     */
    boolean deleteFile(String filePath);

    /**
     * 获取文件访问URL
     * @param relativePath 相对路径
     * @return 完整访问URL
     */
    String getFileUrl(String relativePath);
}
