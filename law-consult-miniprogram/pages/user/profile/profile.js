const app = getApp();
const { get } = require('../../../utils/api');
const { clearUserInfo, getStorage, setStorage } = require('../../../utils/storage');

Page({
  data: {
    userInfo: {},
    stats: {
      totalConsultations: 0,
      pendingConsultations: 0,
      completedConsultations: 0
    },
    unreadCount: 0,
    showLogoutDialog: false
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStats();
  },

  onShow() {
    this.loadUserInfo();
    this.loadStats();
  },

  async loadUserInfo() {
    try {
      const cachedAccount = getStorage('account') || '';
      const userInfo = {
        nickname: getStorage('username') || '用户',
        account: cachedAccount,
        accountText: this.formatAccountText(cachedAccount),
        avatar: getStorage('avatar') || ''
      };
      this.setData({ userInfo });

      const userId = getStorage('userId');
      if (!userId) return;

      const res = await get('/users/profile', { userId });
      if (res) {
        const account = res.account || userInfo.account;
        this.setData({
          userInfo: {
            nickname: res.username || userInfo.nickname,
            account,
            accountText: this.formatAccountText(account),
            avatar: res.avatar || userInfo.avatar
          }
        });
        if (res.avatar) {
          setStorage('avatar', res.avatar);
        }
        if (res.username) {
          setStorage('username', res.username);
        }
        if (res.account) {
          setStorage('account', res.account);
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  },

  async loadStats() {
    try {
      const userId = getStorage('userId');
      if (!userId) return;

      const response = await get(`/consultations/user/${userId}`, {
        page: 1,
        pageSize: 100
      });

      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (response && Array.isArray(response.items)) {
        list = response.items;
      } else if (response && Array.isArray(response.list)) {
        list = response.list;
      }

      this.setData({
        stats: {
          totalConsultations: list.length,
          pendingConsultations: list.filter(item => ['open', 'pending_accept', 'in_progress'].includes(item.status)).length,
          completedConsultations: list.filter(item => item.status === 'resolved').length
        }
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  },

  formatAccountText(account) {
    const text = String(account || '').trim();
    if (!text) {
      return '';
    }

    return /^u/i.test(text) ? text : `U${text}`;
  },

  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/user/profile/edit-profile/edit-profile'
    });
  },

  goToConsultationList(e = {}) {
    const status = e.currentTarget && e.currentTarget.dataset
      ? e.currentTarget.dataset.status || 'all'
      : 'all';
    wx.navigateTo({
      url: `/pages/user/consultationList/consultationList?status=${status}`
    });
  },

  goToMessage() {
    wx.navigateTo({
      url: '/pages/user/message/message'
    });
  },

  goToAiChat() {
    wx.navigateTo({
      url: '/pages/user/aiChat/aiChat'
    });
  },

  goToWallet() {
    wx.navigateTo({
      url: '/pages/user/wallet/wallet'
    });
  },

  goToSecurity() {
    wx.navigateTo({
      url: '/pages/user/settings/change-password/change-password'
    });
  },

  goToComplaint() {
    wx.navigateTo({
      url: '/pages/user/complaint/complaint'
    });
  },

  goToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1500
    });
  },

  handleLogout() {
    this.setData({ showLogoutDialog: true });
  },

  cancelLogout() {
    this.setData({ showLogoutDialog: false });
  },

  confirmLogout() {
    this.setData({ showLogoutDialog: false });
    clearUserInfo();
    app.logout();

    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/auth/login/login'
      });
    }, 1500);
  },

  handleTabChange() {}
});
