package com.example.lawconsultserver.util;

/**
 * 文件工具类
 */
public class FileUtil {
    private static final String UPLOAD_DIR = "uploads/";

    /**
     * 生成上传文件的相对路径
     */
    public static String generateUploadPath(String fileName) {
        return UPLOAD_DIR + System.currentTimeMillis() + "_" + fileName;
    }

    /**
     * 获取上传目录
     */
    public static String getUploadDir() {
        return UPLOAD_DIR;
    }
}
