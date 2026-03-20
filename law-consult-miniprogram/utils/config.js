/**
 * 应用配置文件
 * 包含 API 地址、常量、环境变量等
 */

// API 基础地址（本地开发环境）
const API_BASE_URL = 'http://localhost:8080/api';

// 应用常量
const APP_CONSTANTS = {
  // 用户角色
  ROLE_USER: 'user',
  ROLE_LAWYER: 'lawyer',
  ROLE_ADMIN: 'admin',

  // 用户状态
  STATUS_ACTIVE: 'active',
  STATUS_BLOCKED: 'blocked',
  STATUS_PENDING: 'pending_approval',

  // 咨询状态
  CONSULTATION_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed'
  },

  // 咨询优先级
  CONSULTATION_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },

  // 问题分类
  CONSULTATION_CATEGORIES: [
    '房产法',
    '民法',
    '刑法',
    '婚姻法',
    '劳动法',
    '合同法',
    '公司法',
    '知识产权',
    '其他'
  ],

  // 投诉原因
  COMPLAINT_REASONS: [
    '不文明语言',
    '虚假信息',
    '骚扰用户',
    '违规内容',
    '其他'
  ],

  // 投诉处理状态
  COMPLAINT_STATUS: {
    PENDING: 'pending',
    INVESTIGATING: 'investigating',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed'
  },

  // 消息类型
  MESSAGE_TYPES: {
    // 用户消息
    REPLY: 'reply',                    // 律师回复通知
    COMPLAINT: 'complaint',            // 投诉处理进展
    ANNOUNCEMENT: 'announcement',      // 平台公告

    // 律师消息
    NEW_CONSULTATION: 'new_consultation', // 新咨询分配
    COMPLAINT_USER: 'complaint_user',     // 用户投诉
    LAWYER_ANNOUNCEMENT: 'lawyer_announcement', // 平台公告
    VERIFY: 'verify'                   // 审核通知
  },

  // 本地存储键名
  STORAGE_KEYS: {
    USER_ID: 'userId',
    ACCOUNT: 'account',
    USER_ROLE: 'userRole',
    USERNAME: 'username',
    USER_STATUS: 'userStatus',
    AVATAR: 'avatar',
    TIMESTAMP: 'timestamp'
  },

  // 请求超时时间（毫秒）
  REQUEST_TIMEOUT: 30000,

  // 分页大小
  PAGE_SIZE: 10,

  // 图片大小限制
  MAX_IMAGE_SIZE: 5242880, // 5MB

  // 文件类型
  ALLOWED_FILE_TYPES: ['jpg', 'png', 'pdf'],

  // 密码规则
  PASSWORD_RULES: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 20
  },

  // 账号规则
  ACCOUNT_RULES: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 20,
    PREFIX: {
      USER: 'U',
      LAWYER: 'L',
      ADMIN: 'A'
    }
  }
};

// 消息提示文案
const MESSAGES = {
  // 成功消息
  SUCCESS: {
    LOGIN: '登录成功',
    LOGOUT: '登出成功',
    REGISTER: '注册成功',
    UPDATE: '更新成功',
    CREATE: '创建成功',
    DELETE: '删除成功',
    UPLOAD: '上传成功'
  },

  // 错误消息
  ERROR: {
    NETWORK: '网络连接失败，请稍后重试',
    TIMEOUT: '请求超时，请稍后重试',
    SERVER: '服务器错误，请稍后重试',
    INVALID_PARAMS: '参数错误',
    UNAUTHORIZED: '未授权，请重新登录',
    NOT_FOUND: '请求的资源不存在',
    VALIDATION_FAILED: '验证失败'
  },

  // 表单验证提示
  VALIDATION: {
    REQUIRED: '此项为必填项',
    INVALID_PHONE: '手机号格式不正确',
    INVALID_EMAIL: '邮箱格式不正确',
    PASSWORD_MISMATCH: '两次输入的密码不一致',
    INVALID_ACCOUNT: '账号必须以 U 或 L 开头',
    INVALID_LICENSE: '律师证号格式不正确',
    FILE_REQUIRED: '必须上传至少一个文件',
    FILE_SIZE_EXCEEDED: '文件大小超过限制',
    FILE_TYPE_INVALID: '不支持的文件类型'
  }
};

module.exports = {
  API_BASE_URL,
  APP_CONSTANTS,
  MESSAGES,
  STORAGE_KEYS: APP_CONSTANTS.STORAGE_KEYS
};
