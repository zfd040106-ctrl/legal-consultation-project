Component({
  properties: {
    activeTab: {
      type: String,
      value: 'index'
    },
    unreadCount: {
      type: Number,
      value: 0
    }
  },

  methods: {
    handleTabClick(e) {
      const tab = e.currentTarget.dataset.tab;
      this.triggerEvent('tabchange', { tab });

      const urls = {
        'index': '/pages/user/index/index',
        'message': '/pages/user/message/message',
        'profile': '/pages/user/profile/profile'
      };

      const url = urls[tab];
      if (url) {
        // 删除了tabBar后，所有导航都用reLaunch
        wx.reLaunch({ url });
      }
    }
  }
});
