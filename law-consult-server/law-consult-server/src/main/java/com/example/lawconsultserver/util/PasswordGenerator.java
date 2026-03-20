package com.example.lawconsultserver.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 密码生成工具 - 用于生成和验证BCrypt密码哈希
 * 使用此工具生成的密码哈希可以确保与应用中密码验证的一致性
 */
public class PasswordGenerator {

    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * 生成BCrypt密码哈希
     * @param rawPassword 原始密码
     * @return 加密后的密码哈希
     */
    public static String encode(String rawPassword) {
        return encoder.encode(rawPassword);
    }

    /**
     * 验证密码是否正确
     * @param rawPassword 原始密码
     * @param encodedPassword 加密后的密码
     * @return 是否匹配
     */
    public static boolean matches(String rawPassword, String encodedPassword) {
        return encoder.matches(rawPassword, encodedPassword);
    }

    /**
     * 主方法 - 生成指定密码的BCrypt哈希
     * 用法: java PasswordGenerator 123456
     */
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("用法: java PasswordGenerator <password>");
            System.out.println("示例: java PasswordGenerator 123456");
            System.exit(1);
        }

        String rawPassword = args[0];
        String encodedPassword = encode(rawPassword);

        System.out.println("原始密码: " + rawPassword);
        System.out.println("加密密码: " + encodedPassword);
        System.out.println("密码长度: " + encodedPassword.length());

        // 验证
        boolean matches = matches(rawPassword, encodedPassword);
        System.out.println("验证结果: " + (matches ? "✓ 密码匹配正确" : "✗ 密码匹配失败"));

        // 输出用于SQL的格式
        System.out.println("\nSQL语句:");
        System.out.println("UPDATE users SET password = '" + encodedPassword + "' WHERE account = 'A00000001';");
    }
}
