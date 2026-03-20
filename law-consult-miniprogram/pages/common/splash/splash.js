const app = getApp();

Page({
  data: {},

  onLoad() {
    // 3秒后自动跳转
    setTimeout(() => {
      this.navigateToNextPage();
    }, 3000);
  },

  /**
   * 导航到下一个页面
   */
  navigateToNextPage() {
    // 检查用户是否已登录
    if (app.isUserLoggedIn()) {
      // 用户已登录，根据角色跳转到首页
      const role = app.getUserRole();
      const homeUrl = app.getHomePageByRole(role);

      // 用户端和律师端都使用reLaunch（因为删除了tabBar）
      wx.reLaunch({
        url: homeUrl
      });
    } else {
      // 用户未登录，跳转到登录页
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
    }
  }
});
