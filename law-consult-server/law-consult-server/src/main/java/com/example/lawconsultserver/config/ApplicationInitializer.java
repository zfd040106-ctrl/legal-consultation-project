package com.example.lawconsultserver.config;

import com.example.lawconsultserver.entity.User;
import com.example.lawconsultserver.mapper.UserMapper;
import com.example.lawconsultserver.util.PasswordUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 应用启动时的初始化配置
 * 确保管理员账户存在且密码正确
 */
@Component
public class ApplicationInitializer implements ApplicationRunner {

    @Autowired
    private UserMapper userMapper;

    @Override
    public void run(org.springframework.boot.ApplicationArguments args) throws Exception {
        initializeAdminAccount();
    }

    /**
     * 初始化或更新管理员账户
     * 确保账户存在且密码正确（使用公开仓库占位值）
     */
    private void initializeAdminAccount() {
        String adminAccount = "A00000001";
        String adminPassword = "your_admin_password";

        try {
            // 检查管理员账户是否存在
            User admin = userMapper.selectUserByAccount(adminAccount);

            if (admin == null) {
                // 如果不存在，创建新的管理员账户
                System.out.println("========================================");
                System.out.println("[初始化] 管理员账户不存在，正在创建...");
                System.out.println("========================================");

                User newAdmin = new User();
                newAdmin.setAccount(adminAccount);
                newAdmin.setPassword(PasswordUtil.encode(adminPassword));
                newAdmin.setPhone("00000000000");
                newAdmin.setUsername("管理员");
                newAdmin.setRole("admin");
                newAdmin.setStatus("active");

                int result = userMapper.insertUser(newAdmin);
                if (result > 0) {
                    System.out.println("[✓] 管理员账户创建成功");
                    System.out.println("[✓] 账号: " + adminAccount);
                    System.out.println("[✓] 密码: [已隐藏，请在部署环境中配置]");
                    System.out.println("[✓] 用户名: 管理员");
                } else {
                    System.out.println("[✗] 管理员账户创建失败");
                }
            } else {
                // 如果存在，验证密码是否正确
                boolean isPasswordCorrect = PasswordUtil.matches(adminPassword, admin.getPassword());

                if (!isPasswordCorrect) {
                    // 密码不正确，重新生成正确的密码哈希
                    System.out.println("========================================");
                    System.out.println("[初始化] 管理员密码不正确，正在重置...");
                    System.out.println("========================================");

                    String correctPasswordHash = PasswordUtil.encode(adminPassword);
                    User updatedAdmin = new User();
                    updatedAdmin.setId(admin.getId());
                    updatedAdmin.setPassword(correctPasswordHash);
                    updatedAdmin.setAccount(admin.getAccount());
                    updatedAdmin.setUsername(admin.getUsername());
                    updatedAdmin.setRole(admin.getRole());
                    updatedAdmin.setStatus(admin.getStatus());
                    updatedAdmin.setPhone(admin.getPhone());
                    updatedAdmin.setAvatar(admin.getAvatar());

                    int result = userMapper.updateUser(updatedAdmin);

                    if (result > 0) {
                        System.out.println("[✓] 管理员密码已重置");
                        System.out.println("[✓] 账号: " + adminAccount);
                        System.out.println("[✓] 密码: [已隐藏，请在部署环境中配置]");
                        System.out.println("[✓] 新密码哈希: [已隐藏]");
                    } else {
                        System.out.println("[✗] 管理员密码重置失败");
                    }
                } else {
                    System.out.println("========================================");
                    System.out.println("[✓] 管理员账户已就绪");
                    System.out.println("[✓] 账号: " + adminAccount);
                    System.out.println("[✓] 密码: [已隐藏，请在部署环境中配置]");
                    System.out.println("========================================");
                }
            }
        } catch (Exception e) {
            System.out.println("[✗] 初始化管理员账户失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
