const { get, post } = require('../../../utils/api');
const { clearUserInfo, getStorage } = require('../../../utils/storage');

Page({
  data: {
    lawyerInfo: {},
    stats: {
      resolvedCount: 0
    },
    walletSummary: {
      availableBalance: '0.00',
      totalIncome: '0.00'
    },
    unreadCount: 0,
    showLogoutDialog: false,
    showAboutDialog: false
  },

  onLoad() {
    this.loadLawyerInfo();
    this.loadStats();
  },

  onShow() {
    this.loadLawyerInfo();
    this.loadStats();
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2);
  },

  async loadLawyerInfo() {
    try {
      const app = getApp();
      const userInfo = app.globalData.userInfo;

      if (userInfo) {
        this.setData({ lawyerInfo: userInfo });
      }

      const userId = getStorage('userId');
      if (!userId) return;

      const res = await get('/lawyers/profile', { userId });
      if (res) {
        const userData = res.user || {};
        const lawyerData = res.lawyerInfo || res;
        const mergedData = { ...userData, ...lawyerData, avatar: userData.avatar || lawyerData.avatar };
        this.setData({ lawyerInfo: mergedData });
        app.globalData.userInfo = mergedData;
      }
    } catch (error) {
      console.error('获取律师信息失败:', error);
    }
  },

  async loadStats() {
    try {
      const lawyerId = getStorage('userId');
      if (!lawyerId) return;

      const res = await get('/lawyers/statistics', { lawyerId });
      if (res) {
        this.setData({
          stats: {
            resolvedCount: (res.overview && res.overview.resolvedCount) || res.resolvedCount || 0
          },
          walletSummary: {
            availableBalance: this.formatMoney(res.wallet && res.wallet.availableBalance),
            totalIncome: this.formatMoney(res.wallet && res.wallet.totalIncome)
          }
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  },

  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/lawyer/profile/edit-profile/edit-profile'
    });
  },

  goToConsultationList() {
    wx.navigateTo({
      url: '/pages/lawyer/consultationList/consultationList'
    });
  },

  goToStatistics() {
    wx.navigateTo({
      url: '/pages/lawyer/statistics/statistics'
    });
  },

  goToWallet() {
    wx.navigateTo({
      url: '/pages/lawyer/wallet/wallet'
    });
  },

  goToMessage() {
    wx.navigateTo({
      url: '/pages/lawyer/message/message'
    });
  },

  goToSecurity() {
    wx.navigateTo({
      url: '/pages/user/settings/change-password/change-password'
    });
  },

  goToAbout() {
    this.setData({ showAboutDialog: true });
  },

  handleLogout() {
    this.setData({ showLogoutDialog: true });
  },

  cancelLogout() {
    this.setData({ showLogoutDialog: false });
  },

  closeAboutDialog() {
    this.setData({ showAboutDialog: false });
  },

  async confirmLogout() {
    this.setData({ showLogoutDialog: false });

    try {
      await post('/auth/logout');
    } catch (error) {
      console.error('退出登录接口调用失败', error);
    }

    clearUserInfo();
    const app = getApp();
    app.logout();

    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });

    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/auth/login/login'
      });
    }, 1500);
  },

  handleTabChange() {},

  onPullDownRefresh() {
    Promise.all([
      this.loadLawyerInfo(),
      this.loadStats()
    ]).finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
