const { post, uploadFile } = require('../../../utils/api');
const { validateUserRegisterForm, validateLawyerRegisterForm } = require('../../../utils/validator');
const { APP_CONSTANTS } = require('../../../utils/config');
const { getStorage, removeStorage } = require('../../../utils/storage');

const REAPPLY_STORAGE_KEY = 'lawyerReapplyData';

Page({
  data: {
    form: {
      userRole: 'user',
      phone: '',
      accountSuffix: '',
      username: '',
      password: '',
      confirmPassword: '',
      licenseNumber: '',
      firmName: '',
      specialization: '',
      documents: []
    },
    errors: {},
    loading: false,
    reapplyMode: false,
    reapplyAccount: '',
    specializations: [
      '房产法',
      '民法',
      '刑法',
      '婚姻法',
      '劳动法',
      '税法',
      '知识产权',
      '合同法',
      '商法',
      '其他'
    ]
  },

  onLoad(options) {
    if (options.mode === 'reapply') {
      this.loadReapplyData();
    }
  },

  loadReapplyData() {
    const reapplyData = getStorage(REAPPLY_STORAGE_KEY);
    if (!reapplyData || !reapplyData.account) {
      return;
    }

    this.setData({
      reapplyMode: true,
      reapplyAccount: reapplyData.account,
      form: {
        ...this.data.form,
        userRole: 'lawyer',
        phone: reapplyData.phone || '',
        accountSuffix: reapplyData.account.slice(1),
        username: reapplyData.username || '',
        password: reapplyData.password || '',
        confirmPassword: reapplyData.password || '',
        licenseNumber: reapplyData.licenseNumber || '',
        firmName: reapplyData.firmName || '',
        specialization: reapplyData.specialization || '',
        documents: []
      }
    });
  },

  handleRoleChange(e) {
    if (this.data.reapplyMode) return;

    const role = e.detail.value;
    this.setData({
      'form.userRole': role,
      errors: {}
    });
  },

  handlePhoneInput(e) {
    this.setData({
      'form.phone': e.detail.value
    });
    if (this.data.errors.phone) {
      this.setData({ 'errors.phone': '' });
    }
  },

  handleAccountInput(e) {
    if (this.data.reapplyMode) return;

    this.setData({
      'form.accountSuffix': e.detail.value
    });
    if (this.data.errors.account) {
      this.setData({ 'errors.account': '' });
    }
  },

  handleUsernameInput(e) {
    this.setData({
      'form.username': e.detail.value
    });
    if (this.data.errors.username) {
      this.setData({ 'errors.username': '' });
    }
  },

  handlePasswordInput(e) {
    this.setData({
      'form.password': e.detail.value
    });
    if (this.data.errors.password) {
      this.setData({ 'errors.password': '' });
    }
  },

  handleConfirmPasswordInput(e) {
    this.setData({
      'form.confirmPassword': e.detail.value
    });
    if (this.data.errors.confirmPassword) {
      this.setData({ 'errors.confirmPassword': '' });
    }
  },

  handleLicenseInput(e) {
    this.setData({
      'form.licenseNumber': e.detail.value
    });
    if (this.data.errors.licenseNumber) {
      this.setData({ 'errors.licenseNumber': '' });
    }
  },

  handleFirmNameInput(e) {
    this.setData({
      'form.firmName': e.detail.value
    });
    if (this.data.errors.firmName) {
      this.setData({ 'errors.firmName': '' });
    }
  },

  selectSpecialization(e) {
    const specialization = e.currentTarget.dataset.specialization;
    this.setData({
      'form.specialization': specialization
    });
    if (this.data.errors.specialization) {
      this.setData({ 'errors.specialization': '' });
    }
  },

  handleUploadFile() {
    wx.chooseMessageFile({
      count: 3,
      type: 'all',
      success: (res) => {
        this.setData({
          'form.documents': res.tempFiles
        });
        if (this.data.errors.documents) {
          this.setData({ 'errors.documents': '' });
        }
      }
    });
  },

  validateReapplyForm(account) {
    const { phone, username, password, confirmPassword, licenseNumber, firmName, specialization } = this.data.form;
    const errors = {};

    const validation = validateUserRegisterForm({
      phone,
      account,
      username,
      password,
      confirmPassword
    });
    Object.assign(errors, validation.errors);

    if (!licenseNumber) {
      errors.licenseNumber = '请填写律师证号';
    }
    if (!firmName) {
      errors.firmName = '请填写律所名称';
    }
    if (!specialization) {
      errors.specialization = '请选择专业领域';
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  async handleRegister() {
    const { userRole, phone, accountSuffix, username, password, confirmPassword, licenseNumber, firmName, specialization, documents } = this.data.form;

    this.setData({ errors: {} });

    const account = this.data.reapplyMode
      ? this.data.reapplyAccount
      : `${userRole === 'lawyer' ? 'L' : 'U'}${accountSuffix}`;

    let validation;
    if (this.data.reapplyMode) {
      validation = { valid: this.validateReapplyForm(account), errors: this.data.errors };
    } else if (userRole === 'lawyer') {
      validation = validateLawyerRegisterForm({
        phone,
        account,
        username,
        password,
        confirmPassword,
        licenseNumber,
        firmName,
        specialization,
        documents
      });
      this.setData({ errors: validation.errors });
    } else {
      validation = validateUserRegisterForm({
        phone,
        account,
        username,
        password,
        confirmPassword
      });
      this.setData({ errors: validation.errors });
    }

    if (!validation.valid) {
      wx.showToast({
        title: '请检查输入',
        icon: 'error',
        duration: 1500
      });
      return;
    }

    this.setData({ loading: true });

    try {
      let uploadedFiles = [];
      if ((userRole === 'lawyer' || this.data.reapplyMode) && documents && documents.length > 0) {
        uploadedFiles = await this.uploadDocuments(documents);
      }

      if (this.data.reapplyMode) {
        await post('/auth/reapply', {
          phone,
          account,
          username,
          password,
          confirmPassword,
          licenseNumber,
          firmName,
          specialization,
          documentUrls: uploadedFiles
        });
        removeStorage(REAPPLY_STORAGE_KEY);
        wx.showToast({
          title: '已重新提交审核',
          icon: 'success',
          duration: 1500
        });
      } else {
        const registerData = {
          phone,
          account,
          username,
          password,
          confirmPassword,
          role: userRole === 'lawyer' ? APP_CONSTANTS.ROLE_LAWYER : APP_CONSTANTS.ROLE_USER
        };

        if (userRole === 'lawyer') {
          registerData.licenseNumber = licenseNumber;
          registerData.firmName = firmName;
          registerData.specialization = specialization;
          registerData.documentUrls = uploadedFiles;
        }

        await post('/auth/register', registerData);
        wx.showToast({
          title: '注册成功',
          icon: 'success',
          duration: 1500
        });
      }

      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/auth/login/login'
        });
      }, 1500);
    } catch (error) {
      wx.showToast({
        title: error.message || (this.data.reapplyMode ? '重新提交失败' : '注册失败'),
        icon: 'error',
        duration: 2000
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async uploadDocuments(documents) {
    const uploadPromises = documents.map((doc) => uploadFile(
      '/file/upload',
      doc.path,
      'file',
      { type: 'lawyer_registration' }
    ));

    try {
      const results = await Promise.all(uploadPromises);
      return results.map((result) => result.url || result.path);
    } catch (error) {
      throw new Error('文件上传失败，请重试');
    }
  },

  handleBack() {
    wx.navigateBack();
  },

  navigateToLogin() {
    wx.redirectTo({
      url: '/pages/auth/login/login'
    });
  }
});
