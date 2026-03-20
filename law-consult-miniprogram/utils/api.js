/**
 * 统一API请求封装
 * 集中管理所有HTTP请求，统一处理错误和响应
 */

const { API_BASE_URL } = require('./config');
const { getStorage } = require('./storage');

/**
 * 统一请求函数
 * @param {object} options - 请求配置
 * @returns {Promise}
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const {
      method = 'GET',
      url,
      data = {},
      header = {},
      timeout = 30000
    } = options;

    // 获取用户ID
    const userId = getStorage('userId');

    // 构建完整URL
    let fullUrl = `${API_BASE_URL}${url}`;

    // GET请求：在URL中添加query参数
    if (method === 'GET') {
      const params = { userId, ...data };
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    // 默认请求头
    const defaultHeader = {
      'Content-Type': 'application/json'
    };

    const requestConfig = {
      url: fullUrl,
      method,
      header: { ...defaultHeader, ...header },
      timeout,
      success: (response) => {
        handleSuccess(response, resolve, reject);
      },
      fail: (error) => {
        handleError(error, reject);
      }
    };

    // POST/PUT/DELETE请求：在body中添加userId
    if (method !== 'GET') {
      const bodyData = { userId, ...data };
      requestConfig.data = bodyData;
    }

    wx.request(requestConfig);
  });
}

/**
 * 处理成功响应
 */
function handleSuccess(response, resolve, reject) {
  const { statusCode, data } = response;

  // HTTP状态码检查
  if (statusCode === 401) {
    // 认证失败，清除登录信息并跳转登录页
    wx.removeStorageSync('userId');
    wx.removeStorageSync('userRole');
    wx.navigateTo({
      url: '/pages/auth/login/login'
    });
    reject(new Error('认证失败，请重新登录'));
    return;
  }

  if (statusCode >= 500) {
    reject(new Error('服务器错误，请稍后重试'));
    return;
  }

  if (statusCode >= 400) {
    reject(new Error(`请求失败: ${data.message || '未知错误'}`));
    return;
  }

  // 业务状态码检查
  if (data.code === 200) {
    resolve(data.data);
  } else if (data.code === 401) {
    // 业务层认证失败
    wx.removeStorageSync('userId');
    wx.removeStorageSync('userRole');
    wx.navigateTo({
      url: '/pages/auth/login/login'
    });
    reject(new Error(data.message || '认证失败'));
  } else {
    reject(new Error(data.message || '请求失败'));
  }
}

/**
 * 处理请求错误
 */
function handleError(error, reject) {
  console.error('请求错误:', error);

  if (error.errMsg.includes('request:fail')) {
    reject(new Error('网络连接失败，请检查网络设置'));
  } else if (error.errMsg.includes('timeout')) {
    reject(new Error('请求超时，请稍后重试'));
  } else {
    reject(new Error('请求失败，请稍后重试'));
  }
}

/**
 * GET请求
 * @param {string} url - 请求地址
 * @param {object} data - 查询参数
 * @returns {Promise}
 */
function get(url, data = {}) {
  return request({
    method: 'GET',
    url,
    data
  });
}

/**
 * POST请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求体
 * @returns {Promise}
 */
function post(url, data = {}) {
  return request({
    method: 'POST',
    url,
    data
  });
}

/**
 * PUT请求
 * @param {string} url - 请求地址
 * @param {object} data - 请求体
 * @returns {Promise}
 */
function put(url, data = {}) {
  return request({
    method: 'PUT',
    url,
    data
  });
}

/**
 * DELETE请求
 * @param {string} url - 请求地址
 * @param {object} data - 查询参数
 * @returns {Promise}
 */
function del(url, data = {}) {
  return request({
    method: 'DELETE',
    url,
    data
  });
}

/**
 * 上传文件
 * @param {string} url - 上传地址
 * @param {string} filePath - 文件路径
 * @param {string} name - 文件字段名
 * @param {object} formData - 额外的表单数据
 * @returns {Promise}
 */
function uploadFile(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const userId = getStorage('userId');
    const uploadUrl = `${API_BASE_URL}${url}`;

    // 只有当 userId 存在时才添加到表单数据
    const uploadFormData = {
      ...formData
    };
    if (userId) {
      uploadFormData.userId = userId;
    }

    wx.uploadFile({
      url: uploadUrl,
      filePath,
      name,
      formData: uploadFormData,
      timeout: 30000,
      success: (response) => {
        try {
          const data = JSON.parse(response.data);
          if (data.code === 200) {
            resolve(data.data);
          } else {
            reject(new Error(data.message || '上传失败'));
          }
        } catch (error) {
          reject(new Error('响应解析失败'));
        }
      },
      fail: (error) => {
        console.error('上传错误:', error);
        reject(new Error('文件上传失败，请稍后重试'));
      }
    });
  });
}

/**
 * 下载文件
 * @param {string} url - 下载地址
 * @returns {Promise}
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const downloadUrl = `${API_BASE_URL}${url}`;

    wx.downloadFile({
      url: downloadUrl,
      timeout: 30000,
      success: (response) => {
        if (response.statusCode === 200) {
          resolve(response.tempFilePath);
        } else {
          reject(new Error('下载失败'));
        }
      },
      fail: (error) => {
        console.error('下载错误:', error);
        reject(new Error('文件下载失败'));
      }
    });
  });
}

/**
 * 显示加载提示
 * @param {string} title - 提示文本
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示提示信息
 * @param {string} title - 提示文本
 * @param {string} icon - 图标类型 (success/error/loading等)
 * @param {number} duration - 显示时长 (毫秒)
 */
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title,
    icon,
    duration,
    mask: false
  });
}

/**
 * 显示模态对话框
 * @param {object} options - 对话框配置
 * @returns {Promise}
 */
function showModal(options) {
  return new Promise((resolve, reject) => {
    const {
      title = '提示',
      content = '',
      showCancel = true,
      confirmText = '确定',
      cancelText = '取消'
    } = options;

    wx.showModal({
      title,
      content,
      showCancel,
      confirmText,
      cancelText,
      success: (result) => {
        resolve(result.confirm);
      },
      fail: reject
    });
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile,
  downloadFile,
  showLoading,
  hideLoading,
  showToast,
  showModal
};
