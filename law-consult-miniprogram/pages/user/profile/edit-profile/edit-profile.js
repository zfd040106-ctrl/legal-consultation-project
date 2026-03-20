const { get, post, uploadFile } = require('../../../../utils/api');
const { getStorage, setStorage, setUserInfo, getUserInfo } = require('../../../../utils/storage');

Page({
  data: {
    form: {
      avatar: '',
      account: '',
      username: '',
      phone: ''
    },
    avatarPreview: '',
    avatarUploadFailed: false,
    loading: false,
    userId: ''
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    const userInfo = getUserInfo() || {};
    const userId = getStorage('userId') || '';
    const avatar = getStorage('avatar') || userInfo.avatar || '';

    this.setData({
      form: {
        avatar,
        account: userInfo.account || getStorage('account') || '',
        username: userInfo.username || getStorage('username') || '',
        phone: userInfo.phone || getStorage('phone') || ''
      },
      avatarPreview: avatar,
      avatarUploadFailed: false,
      userId
    });

    if (userId && !this.data.form.phone) {
      try {
        const res = await get('/users/profile', { userId });
        if (res && res.phone) {
          this.setData({
            'form.phone': res.phone
          });
          userInfo.phone = res.phone;
          setUserInfo(userInfo);
        }
      } catch (error) {
        console.error('加载用户信息失败', error);
      }
    }
  },

  async handleChooseAvatar() {
    const that = this;

    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success(res) {
        if (res.tapIndex === 0) {
          that.takePhoto();
        } else if (res.tapIndex === 1) {
          that.chooseFromAlbum();
        }
      }
    });
  },

  takePhoto() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.uploadAvatar(tempFilePath);
      }
    });
  },

  chooseFromAlbum() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        that.uploadAvatar(tempFilePath);
      }
    });
  },

  async uploadAvatar(tempFilePath) {
    wx.showLoading({
      title: '上传中...'
    });

    try {
      const result = await uploadFile('/file/upload', tempFilePath, 'file', { type: 'avatar' });
      const avatarUrl = result.url || result.path || tempFilePath;

      wx.hideLoading();
      this.setData({
        'form.avatar': avatarUrl,
        avatarPreview: avatarUrl,
        avatarUploadFailed: false
      });
      wx.showToast({
        title: '头像上传成功',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      console.error('头像上传失败:', error);
      this.setData({
        avatarPreview: tempFilePath,
        avatarUploadFailed: true
      });
      wx.showToast({
        title: '头像上传失败，请重试',
        icon: 'none'
      });
    }
  },

  handleUsernameChange(e) {
    this.setData({
      'form.username': e.detail.value
    });
  },

  async handleSave() {
    if (this.data.avatarUploadFailed) {
      wx.showToast({
        title: '请先重新上传头像',
        icon: 'none'
      });
      return;
    }

    if (!this.data.form.username.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const userId = getStorage('userId');
      const response = await post('/users/profile', {
        userId,
        username: this.data.form.username,
        avatar: this.data.form.avatar
      });

      if (response) {
        setStorage('username', this.data.form.username);
        setStorage('avatar', this.data.form.avatar);

        const userInfo = getUserInfo() || {};
        userInfo.username = this.data.form.username;
        userInfo.avatar = this.data.form.avatar;
        setUserInfo(userInfo);

        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack({
            delta: 1
          });
        }, 1500);
      } else {
        wx.showToast({
          title: response.message || '保存失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存用户信息失败:', error);

      setStorage('username', this.data.form.username);
      setStorage('avatar', this.data.form.avatar);

      const userInfo = getUserInfo() || {};
      userInfo.username = this.data.form.username;
      userInfo.avatar = this.data.form.avatar;
      setUserInfo(userInfo);

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 1500);
    } finally {
      this.setData({ loading: false });
    }
  },

  handleBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});
