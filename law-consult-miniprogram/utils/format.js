/**
 * 数据格式化工具函数
 * 用于日期、时间、数字等的格式化
 */

/**
 * 格式化日期
 * @param {Date|number|string} date - 日期对象或时间戳
 * @param {string} format - 格式字符串 (默认 'YYYY-MM-DD')
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';

  // 处理时间戳或字符串
  if (typeof date === 'number' || typeof date === 'string') {
    date = new Date(date);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const formatMap = {
    'YYYY': year,
    'MM': month,
    'DD': day,
    'HH': hours,
    'mm': minutes,
    'ss': seconds
  };

  let result = format;
  Object.keys(formatMap).forEach(key => {
    result = result.replace(new RegExp(key, 'g'), formatMap[key]);
  });

  return result;
}

/**
 * 格式化时间（相对时间）
 * @param {Date|number|string} date - 日期对象或时间戳
 * @returns {string} 相对时间字符串 (如 "5分钟前")
 */
function formatRelativeTime(date) {
  if (!date) return '';

  if (typeof date === 'number' || typeof date === 'string') {
    date = new Date(date);
  }

  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // 秒数

  if (diff < 60) {
    return '刚刚';
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes}分钟前`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours}小时前`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days}天前`;
  } else {
    return formatDate(date, 'YYYY-MM-DD');
  }
}

/**
 * 格式化日期时间
 * @param {Date|number|string} date - 日期对象或时间戳
 * @returns {string} 格式化后的日期时间字符串 (如 "2024-12-11 14:30:45")
 */
function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
}

/**
 * 格式化手机号
 * @param {string} phone - 手机号
 * @returns {string} 格式化后的手机号 (如 "138****1234")
 */
function formatPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @param {number} decimals - 小数位数 (默认 2)
 * @returns {string} 格式化后的金额字符串
 */
function formatMoney(amount, decimals = 2) {
  if (amount === null || amount === undefined) return '¥0.00';
  return '¥' + Number(amount).toFixed(decimals);
}

/**
 * 格式化百分比
 * @param {number} value - 数值 (0-1 或 0-100)
 * @param {number} decimals - 小数位数 (默认 0)
 * @returns {string} 格式化后的百分比字符串
 */
function formatPercentage(value, decimals = 0) {
  if (value === null || value === undefined) return '0%';
  if (value > 1) {
    return Number(value).toFixed(decimals) + '%';
  }
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小字符串
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} length - 最大长度
 * @param {string} suffix - 后缀 (默认 '...')
 * @returns {string} 截断后的文本
 */
function truncateText(text, length = 50, suffix = '...') {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + suffix;
}

/**
 * 将文本转换为驼峰命名法
 * @param {string} str - 字符串 (如 "hello_world" 或 "hello-world")
 * @returns {string} 驼峰命名格式 (如 "helloWorld")
 */
function toCamelCase(str) {
  if (!str) return '';
  return str.replace(/[-_]([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * 将文本转换为帕斯卡命名法
 * @param {string} str - 字符串
 * @returns {string} 帕斯卡命名格式
 */
function toPascalCase(str) {
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * 格式化用户名（显示）
 * @param {string} username - 用户名
 * @returns {string} 格式化后的用户名
 */
function formatUsername(username) {
  if (!username) return '匿名用户';
  return truncateText(username, 20);
}

/**
 * 格式化咨询标题
 * @param {string} title - 标题
 * @returns {string} 格式化后的标题
 */
function formatConsultationTitle(title) {
  if (!title) return '';
  return truncateText(title, 50);
}

/**
 * 格式化评分显示
 * @param {number} rating - 评分 (0-5)
 * @returns {string} 格式化后的评分字符串
 */
function formatRating(rating) {
  if (!rating || rating === 0) return '暂无评分';
  return rating.toFixed(1) + '分';
}

/**
 * 格式化消息摘要
 * @param {string} message - 消息内容
 * @returns {string} 消息摘要
 */
function formatMessagePreview(message) {
  if (!message) return '';
  return truncateText(message, 50, '...');
}

/**
 * 获取状态标签文本
 * @param {string} status - 状态值
 * @param {string} type - 状态类型 (consultation/complaint等)
 * @returns {string} 状态文本
 */
function getStatusLabel(status, type = 'consultation') {
  const statusLabels = {
    consultation: {
      open: '待回复',
      in_progress: '回复中',
      resolved: '已解决',
      closed: '已关闭'
    },
    complaint: {
      pending: '待处理',
      investigating: '调查中',
      resolved: '已处理',
      dismissed: '已驳回'
    },
    user: {
      active: '正常',
      blocked: '已禁用',
      pending_approval: '待审核'
    }
  };

  return statusLabels[type] && statusLabels[type][status] ? statusLabels[type][status] : status;
}

module.exports = {
  formatDate,
  formatRelativeTime,
  formatDateTime,
  formatPhone,
  formatMoney,
  formatPercentage,
  formatFileSize,
  truncateText,
  toCamelCase,
  toPascalCase,
  formatUsername,
  formatConsultationTitle,
  formatRating,
  formatMessagePreview,
  getStatusLabel
};
