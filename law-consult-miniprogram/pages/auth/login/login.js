const app = getApp();
const { post } = require('../../../utils/api');
const { validateAccount, validatePassword } = require('../../../utils/validator');
const { getStorage, setStorage } = require('../../../utils/storage');

const REAPPLY_STORAGE_KEY = 'lawyerReapplyData';

Page({
  data: {
    form: {
      account: '',
      password: '',
      rememberAccount: false
    },
    errors: {},
    loading: false
  },

  onLoad() {
    this.loadRememberedAccount();
  },

  loadRememberedAccount() {
    const rememberedAccount = getStorage('rememberedAccount');
    if (rememberedAccount) {
      this.setData({
        'form.account': rememberedAccount,
        'form.rememberAccount': true
      });
    }
  },

  handleAccountInput(e) {
    this.setData({
      'form.account': e.detail.value
    });
    if (this.data.errors.account) {
      this.setData({
        'errors.account': ''
      });
    }
  },

  handlePasswordInput(e) {
    this.setData({
      'form.password': e.detail.value
    });
    if (this.data.errors.password) {
      this.setData({
        'errors.password': ''
      });
    }
  },

  handleRememberChange(e) {
    this.setData({
      'form.rememberAccount': e.detail.value.includes('remember')
    });
  },

  async handleLogin() {
    const { account, password, rememberAccount } = this.data.form;

    this.setData({ errors: {} });

    const accountValidation = validateAccount(account, null);
    if (!accountValidation.valid) {
      this.setData({ 'errors.account': accountValidation.message });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      this.setData({ 'errors.password': passwordValidation.message });
      return;
    }

    if (rememberAccount) {
      setStorage('rememberedAccount', account);
    } else {
      setStorage('rememberedAccount', null);
    }

    this.setData({ loading: true });
    try {
      const response = await post('/auth/login', {
        account,
        password
      });

      app.setLoginInfo(response);
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        const homeUrl = app.getHomePageByRole(response.role);
        wx.reLaunch({
          url: homeUrl
        });
      }, 1500);
    } catch (error) {
      if (account.startsWith('L') && this.shouldGuideReapply(error.message)) {
        await this.handleLawyerReapply(account, password, error.message);
      } else {
        wx.showToast({
          title: error.message || '登录失败',
          icon: 'error',
          duration: 2000
        });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  shouldGuideReapply(message = '') {
    const content = String(message || '').toLowerCase();
    return content.includes('rejected') || content.includes('resubmit');
  },

  async handleLawyerReapply(account, password, fallbackMessage) {
    const confirmed = await new Promise((resolve) => {
      wx.showModal({
        title: '审核未通过',
        content: '当前律师账号已被驳回，是否进入资料重提流程？',
        confirmText: '去重提',
        cancelText: '取消',
        success: (res) => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });

    if (!confirmed) {
      return;
    }

    try {
      const reapplyData = await post('/auth/reapply-info', { account, password });
      setStorage(REAPPLY_STORAGE_KEY, {
        ...reapplyData,
        password
      });
      wx.navigateTo({
        url: '/pages/auth/register/register?mode=reapply'
      });
    } catch (reapplyError) {
      wx.showToast({
        title: reapplyError.message || fallbackMessage || '无法进入重提流程',
        icon: 'none',
        duration: 2000
      });
    }
  },

  navigateToRegister() {
    wx.navigateTo({
      url: '/pages/auth/register/register'
    });
  }
});
