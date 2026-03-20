Component({
  properties: {
    // 当前激活的tab
    activeTab: {
      type: String,
      value: 'index'
    },
    // 未读消息数
    unreadCount: {
      type: Number,
      value: 0
    }
  },

  methods: {
    /**
     * 处理tab点击
     */
    handleTabClick(e) {
      const tab = e.currentTarget.dataset.tab;

      // 触发事件告知父页面
      this.triggerEvent('tabchange', { tab });

      // 页面跳转
      const urls = {
        'index': '/pages/lawyer/index/index',
        'consultationList': '/pages/lawyer/consultationList/consultationList',
        'message': '/pages/lawyer/message/message',
        'profile': '/pages/lawyer/profile/profile'
      };

      const url = urls[tab];
      if (url) {
        // 删除了tabBar后，所有导航都用reLaunch
        wx.reLaunch({ url });
      }
    }
  }
});
