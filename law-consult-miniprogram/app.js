const { getUserInfo, isLoggedIn, setUserInfo, clearUserInfo } = require('./utils/storage');
const { API_BASE_URL, APP_CONSTANTS } = require('./utils/config');

App({
  // 全局数据
  globalData: {
    userId: null,
    userRole: null,
    userInfo: {},
    apiBaseUrl: API_BASE_URL,
    isLoggedIn: false
  },

  /**
   * 应用启动
   */
  onLaunch() {
    this.initUser();
  },

  /**
   * 应用显示
   */
  onShow() {
    // 检查用户是否需要重新登录
    if (this.globalData.isLoggedIn) {
      this.checkUserStatus();
    }
  },

  /**
   * 应用隐藏
   */
  onHide() {
    // 可在此处进行清理工作
  },

  /**
   * 初始化用户信息
   */
  initUser() {
    const userInfo = getUserInfo();

    if (isLoggedIn() && userInfo.userId) {
      // 用户已登录，从存储中恢复用户信息
      this.globalData.userId = userInfo.userId;
      this.globalData.userRole = userInfo.userRole;
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      // 不自动跳转，由splash页面点击触发
    }
    // 未登录时也不自动跳转，由splash页面点击触发
  },

  /**
   * 检查用户状态
   */
  checkUserStatus() {
    const userInfo = getUserInfo();
    if (!userInfo.userId) {
      // 用户信息丢失，重新登录
      this.logout();
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
    }
  },

  /**
   * 设置登录信息
   * @param {object} loginInfo - 登录返回的用户信息
   */
  setLoginInfo(loginInfo) {
    if (loginInfo && loginInfo.userId) {
      // 保存用户信息到存储
      setUserInfo(loginInfo);

      // 更新全局数据
      this.globalData.userId = loginInfo.userId;
      this.globalData.userRole = loginInfo.role;
      this.globalData.userInfo = {
        userId: loginInfo.userId,
        account: loginInfo.account,
        userRole: loginInfo.role,
        username: loginInfo.username,
        userStatus: loginInfo.status,
        avatar: loginInfo.avatar
      };
      this.globalData.isLoggedIn = true;
    }
  },

  /**
   * 更新用户信息
   * @param {object} userInfo - 用户信息对象
   */
  updateUserInfo(userInfo) {
    if (userInfo) {
      setUserInfo(userInfo);
      this.globalData.userInfo = userInfo;
    }
  },

  /**
   * 登出
   */
  logout() {
    clearUserInfo();

    // 清空全局数据
    this.globalData.userId = null;
    this.globalData.userRole = null;
    this.globalData.userInfo = {};
    this.globalData.isLoggedIn = false;
  },

  /**
   * 根据用户角色获取首页路由
   * @param {string} role - 用户角色
   * @returns {string} 首页路由
   */
  getHomePageByRole(role) {
    switch (role) {
      case APP_CONSTANTS.ROLE_LAWYER:
        return '/pages/lawyer/index/index';
      case APP_CONSTANTS.ROLE_USER:
        return '/pages/user/index/index';
      default:
        return '/pages/user/index/index';
    }
  },

  /**
   * 检查是否已登录
   * @returns {boolean} 是否已登录
   */
  isUserLoggedIn() {
    return this.globalData.isLoggedIn && !!this.globalData.userId;
  },

  /**
   * 获取用户ID
   * @returns {string} 用户ID
   */
  getUserId() {
    return this.globalData.userId;
  },

  /**
   * 获取用户角色
   * @returns {string} 用户角色
   */
  getUserRole() {
    return this.globalData.userRole;
  }
});
