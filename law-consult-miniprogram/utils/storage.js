/**
 * 本地存储工具函数
 * 统一管理所有的本地存储操作
 */

const { API_BASE_URL, STORAGE_KEYS } = require('./config');

const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

function normalizeMediaUrl(value) {
  if (typeof value !== 'string' || !value) {
    return value;
  }

  const normalizedValue = value.replace(/\\/g, '/');
  const localhostPrefix = 'http://localhost:8080/uploads/';
  const localhostSecurePrefix = 'https://localhost:8080/uploads/';

  if (normalizedValue.startsWith(localhostPrefix)) {
    return `${MEDIA_BASE_URL}/uploads/${normalizedValue.slice(localhostPrefix.length)}`;
  }
  if (normalizedValue.startsWith(localhostSecurePrefix)) {
    return `${MEDIA_BASE_URL}/uploads/${normalizedValue.slice(localhostSecurePrefix.length)}`;
  }
  if (normalizedValue.startsWith('/uploads/')) {
    return `${MEDIA_BASE_URL}${normalizedValue}`;
  }
  if (/^(avatar|carousel|consultation|lawyer_registration)\//.test(normalizedValue)) {
    return `${MEDIA_BASE_URL}/uploads/${normalizedValue}`;
  }

  return value;
}

/**
 * 设置存储值
 * @param {string} key - 存储键
 * @param {*} value - 存储值
 */
function setStorage(key, value) {
  try {
    if (value === null || value === undefined) {
      wx.removeStorageSync(key);
    } else {
      wx.setStorageSync(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`设置存储失败: ${key}`, error);
  }
}

/**
 * 获取存储值
 * @param {string} key - 存储键
 * @param {*} defaultValue - 默认值
 * @returns {*} 存储的值或默认值
 */
function getStorage(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key);
    if (!value) return defaultValue;
    return JSON.parse(value);
  } catch (error) {
    console.error(`获取存储失败: ${key}`, error);
    return defaultValue;
  }
}

/**
 * 移除存储值
 * @param {string} key - 存储键
 */
function removeStorage(key) {
  try {
    wx.removeStorageSync(key);
  } catch (error) {
    console.error(`移除存储失败: ${key}`, error);
  }
}

/**
 * 清空所有存储
 */
function clearStorage() {
  try {
    wx.clearStorageSync();
  } catch (error) {
    console.error('清空存储失败', error);
  }
}

/**
 * 保存用户信息到本地存储
 * @param {object} userInfo - 用户信息对象
 */
function setUserInfo(userInfo) {
  if (!userInfo) return;

  setStorage(STORAGE_KEYS.USER_ID, userInfo.userId);
  setStorage(STORAGE_KEYS.ACCOUNT, userInfo.account);
  setStorage(STORAGE_KEYS.USER_ROLE, userInfo.role);
  setStorage(STORAGE_KEYS.USERNAME, userInfo.username);
  setStorage(STORAGE_KEYS.USER_STATUS, userInfo.status);
  setStorage(STORAGE_KEYS.AVATAR, normalizeMediaUrl(userInfo.avatar));
  setStorage('phone', userInfo.phone);
  setStorage(STORAGE_KEYS.TIMESTAMP, Date.now());
}

/**
 * 获取用户信息
 * @returns {object} 用户信息对象
 */
function getUserInfo() {
  return {
    userId: getStorage(STORAGE_KEYS.USER_ID),
    account: getStorage(STORAGE_KEYS.ACCOUNT),
    userRole: getStorage(STORAGE_KEYS.USER_ROLE),
    username: getStorage(STORAGE_KEYS.USERNAME),
    userStatus: getStorage(STORAGE_KEYS.USER_STATUS),
    avatar: normalizeMediaUrl(getStorage(STORAGE_KEYS.AVATAR)),
    phone: getStorage('phone')
  };
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
  return !!getStorage(STORAGE_KEYS.USER_ID);
}

/**
 * 清除用户信息（登出）
 */
function clearUserInfo() {
  removeStorage(STORAGE_KEYS.USER_ID);
  removeStorage(STORAGE_KEYS.ACCOUNT);
  removeStorage(STORAGE_KEYS.USER_ROLE);
  removeStorage(STORAGE_KEYS.USERNAME);
  removeStorage(STORAGE_KEYS.USER_STATUS);
  removeStorage(STORAGE_KEYS.AVATAR);
}

module.exports = {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  setUserInfo,
  getUserInfo,
  isLoggedIn,
  clearUserInfo
};
