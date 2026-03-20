const app = getApp();
const { post } = require('../../../../utils/api');
const { validatePassword, validatePasswordMatch } = require('../../../../utils/validator');

Page({
  data: {
    form: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    errors: {},
    loading: false,
    strengthLevel: '', // 'weak', 'medium', 'strong'
    strengthText: '',
    passwordValidation: {
      hasLength: false,
      hasLower: false,
      hasUpper: false,
      hasNumber: false
    }
  },

  onLoad() {
    // 检查用户是否已登录
    if (!app.isUserLoggedIn()) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
    }
  },

  /**
   * 当前密码输入
   */
  handleCurrentPasswordInput(e) {
    this.setData({
      'form.currentPassword': e.detail.value
    });
    if (this.data.errors.currentPassword) {
      this.setData({ 'errors.currentPassword': '' });
    }
  },

  /**
   * 新密码输入
   */
  handleNewPasswordInput(e) {
    const newPassword = e.detail.value;
    this.setData({
      'form.newPassword': newPassword
    });

    // 计算密码强度
    this.calculatePasswordStrength(newPassword);

    // 更新密码验证状态
    this.updatePasswordValidation(newPassword);

    if (this.data.errors.newPassword) {
      this.setData({ 'errors.newPassword': '' });
    }

    // 如果确认密码已有内容，检查匹配
    if (this.data.form.confirmPassword) {
      if (newPassword !== this.data.form.confirmPassword && this.data.errors.confirmPassword) {
        this.setData({ 'errors.confirmPassword': '两次输入的密码不一致' });
      }
    }
  },

  /**
   * 更新密码验证状态
   */
  updatePasswordValidation(password) {
    const hasLength = password && password.length >= 6;
    const hasLower = password && /[a-z]/.test(password);
    const hasUpper = password && /[A-Z]/.test(password);
    const hasNumber = password && /[0-9]/.test(password);

    this.setData({
      passwordValidation: {
        hasLength,
        hasLower,
        hasUpper,
        hasNumber
      }
    });
  },

  /**
   * 确认密码输入
   */
  handleConfirmPasswordInput(e) {
    this.setData({
      'form.confirmPassword': e.detail.value
    });
    if (this.data.errors.confirmPassword) {
      this.setData({ 'errors.confirmPassword': '' });
    }
  },

  /**
   * 计算密码强度
   */
  calculatePasswordStrength(password) {
    if (!password) {
      this.setData({
        strengthLevel: '',
        strengthText: ''
      });
      return;
    }

    let strength = 0;
    let strengthText = '';

    // 检查长度
    if (password.length >= 6) strength++;
    if (password.length >= 12) strength++;

    // 检查是否包含大写字母
    if (/[A-Z]/.test(password)) strength++;

    // 检查是否包含小写字母
    if (/[a-z]/.test(password)) strength++;

    // 检查是否包含数字
    if (/[0-9]/.test(password)) strength++;

    // 检查是否包含特殊字符
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    // 根据强度等级设置显示
    if (strength <= 2) {
      strengthText = '弱';
      this.setData({ strengthLevel: 'weak' });
    } else if (strength <= 4) {
      strengthText = '中等';
      this.setData({ strengthLevel: 'medium' });
    } else {
      strengthText = '强';
      this.setData({ strengthLevel: 'strong' });
    }

    this.setData({ strengthText });
  },

  /**
   * 确认修改密码
   */
  async handleConfirm() {
    const { currentPassword, newPassword, confirmPassword } = this.data.form;

    // 清除之前的错误
    this.setData({ errors: {} });

    // 验证当前密码
    if (!currentPassword) {
      this.setData({ 'errors.currentPassword': '请输入当前密码' });
      return;
    }

    // 验证新密码
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      this.setData({ 'errors.newPassword': passwordValidation.message });
      return;
    }

    // 验证新密码一致性
    const passwordMatchValidation = validatePasswordMatch(newPassword, confirmPassword);
    if (!passwordMatchValidation.valid) {
      this.setData({ 'errors.confirmPassword': passwordMatchValidation.message });
      return;
    }

    // 检查新密码和当前密码是否相同
    if (currentPassword === newPassword) {
      this.setData({ 'errors.newPassword': '新密码不能与当前密码相同' });
      return;
    }

    this.setData({ loading: true });

    try {
      await post('/user/change-password', {
        currentPassword,
        newPassword
      });

      // 显示成功提示
      wx.showToast({
        title: '密码修改成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      // 处理特定的错误信息
      if (error.message.includes('当前密码')) {
        this.setData({ 'errors.currentPassword': '当前密码错误' });
      } else {
        wx.showToast({
          title: error.message || '密码修改失败',
          icon: 'error',
          duration: 2000
        });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 返回上一页
   */
  handleBack() {
    wx.navigateBack();
  }
});
