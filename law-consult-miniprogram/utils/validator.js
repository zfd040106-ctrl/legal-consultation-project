/**
 * 数据验证工具函数
 * 用于表单验证和数据检查
 */

const { APP_CONSTANTS, MESSAGES } = require('./config');

/**
 * 验证手机号
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱
 * @param {string} email - 邮箱
 * @returns {boolean} 是否有效
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证账号格式
 * @param {string} account - 账号
 * @param {string} role - 用户角色 (user/lawyer)
 * @returns {object} { valid: boolean, message: string }
 */
function validateAccount(account, role) {
  if (!account || account.length === 0) {
    return { valid: false, message: MESSAGES.VALIDATION.REQUIRED };
  }

  const minLength = APP_CONSTANTS.ACCOUNT_RULES.MIN_LENGTH;
  const maxLength = APP_CONSTANTS.ACCOUNT_RULES.MAX_LENGTH;

  if (account.length < minLength || account.length > maxLength) {
    return {
      valid: false,
      message: `账号长度应为 ${minLength}-${maxLength} 个字符`
    };
  }

  // 检查前缀
  let expectedPrefix = '';
  if (role === APP_CONSTANTS.ROLE_USER) {
    expectedPrefix = APP_CONSTANTS.ACCOUNT_RULES.PREFIX.USER;
  } else if (role === APP_CONSTANTS.ROLE_LAWYER) {
    expectedPrefix = APP_CONSTANTS.ACCOUNT_RULES.PREFIX.LAWYER;
  }

  if (expectedPrefix && !account.startsWith(expectedPrefix)) {
    return {
      valid: false,
      message: `${role === APP_CONSTANTS.ROLE_USER ? '用户' : '律师'}账号必须以 ${expectedPrefix} 开头`
    };
  }

  return { valid: true, message: '' };
}

/**
 * 验证密码
 * @param {string} password - 密码
 * @returns {object} { valid: boolean, message: string }
 */
function validatePassword(password) {
  if (!password || password.length === 0) {
    return { valid: false, message: MESSAGES.VALIDATION.REQUIRED };
  }

  const minLength = APP_CONSTANTS.PASSWORD_RULES.MIN_LENGTH;
  const maxLength = APP_CONSTANTS.PASSWORD_RULES.MAX_LENGTH;

  if (password.length < minLength || password.length > maxLength) {
    return {
      valid: false,
      message: `密码长度应为 ${minLength}-${maxLength} 个字符`
    };
  }

  return { valid: true, message: '' };
}

/**
 * 验证密码一致性
 * @param {string} password - 密码
 * @param {string} confirmPassword - 确认密码
 * @returns {object} { valid: boolean, message: string }
 */
function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, message: MESSAGES.VALIDATION.PASSWORD_MISMATCH };
  }
  return { valid: true, message: '' };
}

/**
 * 验证用户名
 * @param {string} username - 用户名
 * @returns {object} { valid: boolean, message: string }
 */
function validateUsername(username) {
  if (!username || username.length === 0) {
    return { valid: false, message: MESSAGES.VALIDATION.REQUIRED };
  }

  if (username.length < 2 || username.length > 20) {
    return { valid: false, message: '用户名长度应为 2-20 个字符' };
  }

  return { valid: true, message: '' };
}

/**
 * 验证律师证号
 * @param {string} licenseNumber - 律师证号
 * @returns {object} { valid: boolean, message: string }
 */
function validateLicenseNumber(licenseNumber) {
  if (!licenseNumber || licenseNumber.length === 0) {
    return { valid: false, message: MESSAGES.VALIDATION.REQUIRED };
  }

  if (licenseNumber.length < 5 || licenseNumber.length > 50) {
    return { valid: false, message: '律师证号格式不正确' };
  }

  return { valid: true, message: '' };
}

/**
 * 验证文件大小
 * @param {number} fileSize - 文件大小（字节）
 * @returns {object} { valid: boolean, message: string }
 */
function validateFileSize(fileSize) {
  const maxSize = APP_CONSTANTS.MAX_IMAGE_SIZE;
  if (fileSize > maxSize) {
    return { valid: false, message: MESSAGES.VALIDATION.FILE_SIZE_EXCEEDED };
  }
  return { valid: true, message: '' };
}

/**
 * 验证文件类型
 * @param {string} filename - 文件名
 * @returns {object} { valid: boolean, message: string }
 */
function validateFileType(filename) {
  const allowedTypes = APP_CONSTANTS.ALLOWED_FILE_TYPES;
  const ext = filename.split('.').pop().toLowerCase();

  if (!allowedTypes.includes(ext)) {
    return { valid: false, message: MESSAGES.VALIDATION.FILE_TYPE_INVALID };
  }
  return { valid: true, message: '' };
}

/**
 * 验证文件列表
 * @param {array} files - 文件数组
 * @returns {object} { valid: boolean, message: string }
 */
function validateFiles(files) {
  if (!files || files.length === 0) {
    return { valid: false, message: MESSAGES.VALIDATION.FILE_REQUIRED };
  }

  for (let file of files) {
    const typeValid = validateFileType(file.name);
    if (!typeValid.valid) {
      return typeValid;
    }

    const sizeValid = validateFileSize(file.size);
    if (!sizeValid.valid) {
      return sizeValid;
    }
  }

  return { valid: true, message: '' };
}

/**
 * 验证文本长度
 * @param {string} text - 文本
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @returns {object} { valid: boolean, message: string }
 */
function validateTextLength(text, minLength = 0, maxLength = 5000) {
  if (!text || text.length === 0) {
    return { valid: false, message: MESSAGES.VALIDATION.REQUIRED };
  }

  if (text.length < minLength || text.length > maxLength) {
    return {
      valid: false,
      message: `长度应为 ${minLength}-${maxLength} 个字符`
    };
  }

  return { valid: true, message: '' };
}

/**
 * 批量验证注册表单（用户）
 * @param {object} formData - 表单数据
 * @returns {object} { valid: boolean, errors: {} }
 */
function validateUserRegisterForm(formData) {
  const errors = {};

  // 验证手机号
  if (!formData.phone || !isValidPhone(formData.phone)) {
    errors.phone = MESSAGES.VALIDATION.INVALID_PHONE;
  }

  // 验证账号
  const accountValid = validateAccount(formData.account, APP_CONSTANTS.ROLE_USER);
  if (!accountValid.valid) {
    errors.account = accountValid.message;
  }

  // 验证用户名
  const usernameValid = validateUsername(formData.username);
  if (!usernameValid.valid) {
    errors.username = usernameValid.message;
  }

  // 验证密码
  const passwordValid = validatePassword(formData.password);
  if (!passwordValid.valid) {
    errors.password = passwordValid.message;
  }

  // 验证确认密码
  const passwordMatchValid = validatePasswordMatch(formData.password, formData.confirmPassword);
  if (!passwordMatchValid.valid) {
    errors.confirmPassword = passwordMatchValid.message;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 批量验证注册表单（律师）
 * @param {object} formData - 表单数据
 * @returns {object} { valid: boolean, errors: {} }
 */
function validateLawyerRegisterForm(formData) {
  const userErrors = validateUserRegisterForm({
    ...formData,
    account: formData.account.replace(/^L/, 'U') // 临时替换为 U 来验证长度等
  });

  const errors = userErrors.errors;

  // 重新验证账号（使用 L 前缀）
  const accountValid = validateAccount(formData.account, APP_CONSTANTS.ROLE_LAWYER);
  if (!accountValid.valid) {
    errors.account = accountValid.message;
  } else {
    delete errors.account; // 移除之前的错误
  }

  // 验证律师证号
  const licenseValid = validateLicenseNumber(formData.licenseNumber);
  if (!licenseValid.valid) {
    errors.licenseNumber = licenseValid.message;
  }

  // 验证律所名称
  if (!formData.firmName || formData.firmName.length === 0) {
    errors.firmName = MESSAGES.VALIDATION.REQUIRED;
  } else if (formData.firmName.length < 2 || formData.firmName.length > 50) {
    errors.firmName = '律所名称长度应为 2-50 个字符';
  }

  // 验证专业领域
  if (!formData.specialization || formData.specialization.length === 0) {
    errors.specialization = MESSAGES.VALIDATION.REQUIRED;
  }

  // 验证上传文件
  if (!formData.documents || formData.documents.length === 0) {
    errors.documents = MESSAGES.VALIDATION.FILE_REQUIRED;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  isValidPhone,
  isValidEmail,
  validateAccount,
  validatePassword,
  validatePasswordMatch,
  validateUsername,
  validateLicenseNumber,
  validateFileSize,
  validateFileType,
  validateFiles,
  validateTextLength,
  validateUserRegisterForm,
  validateLawyerRegisterForm
};
