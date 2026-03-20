package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper {
    /**
     * 新增用户
     */
    int insertUser(User user);

    /**
     * 根据ID查询用户
     */
    User selectUserById(@Param("id") Integer id);

    /**
     * 根据账号查询用户
     */
    User selectUserByAccount(@Param("account") String account);

    /**
     * 根据手机号查询用户
     */
    User selectUserByPhone(@Param("phone") String phone);

    /**
     * 查询所有用户（分页）
     */
    List<User> selectUsers(@Param("role") String role,
                           @Param("status") String status,
                           @Param("offset") Long offset,
                           @Param("limit") Integer limit);

    /**
     * 统计用户总数
     */
    Long countUsers(@Param("role") String role, @Param("status") String status);

    /**
     * 更新用户
     */
    int updateUser(User user);

    /**
     * 更新用户状态
     */
    int updateUserStatus(@Param("id") Integer id, @Param("status") String status);

    /**
     * 删除用户
     */
    int deleteUser(@Param("id") Integer id);

    /**
     * 获取用户增长数据（查询user_growth视图）
     */
    List<Map<String, Object>> getUserGrowthData();

    /**
     * 获取律师增长数据（按日期统计律师注册数量）
     */
    List<Map<String, Object>> getLawyerGrowthData();

    /**
     * 查询所有用户（排除待审核律师）- 用户管理页面使用
     */
    List<User> selectUsersExcludePending(@Param("role") String role,
                                         @Param("status") String status,
                                         @Param("keyword") String keyword,
                                         @Param("offset") Long offset,
                                         @Param("limit") Integer limit);

    /**
     * 统计用户总数（排除待审核律师）- 用户管理页面使用
     */
    Long countUsersExcludePending(@Param("role") String role,
                                  @Param("status") String status,
                                  @Param("keyword") String keyword);
}
