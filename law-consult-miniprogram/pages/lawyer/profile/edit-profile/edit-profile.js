const { get, post, uploadFile } = require('../../../../utils/api');
const { getStorage, setUserInfo, getUserInfo } = require('../../../../utils/storage');

Page({
  data: {
    form: {
      avatar: '',
      account: '',
      username: '',
      phone: '',
      licenseNumber: '',
      firmName: '',
      specialization: '',
      experienceYears: ''
    },
    avatarPreview: '',
    avatarUploadFailed: false,
    loading: false,
    userId: ''
  },

  onLoad() {
    this.loadLawyerInfo();
  },

  async loadLawyerInfo() {
    try {
      const app = getApp();
      const lawyerInfo = app.globalData.userInfo || {};
      const userId = getStorage('userId') || '';
      const avatar = lawyerInfo.avatar || '';

      this.setData({
        form: {
          avatar,
          account: lawyerInfo.account || getStorage('account') || '',
          username: lawyerInfo.username || '',
          phone: lawyerInfo.phone || getStorage('phone') || '',
          licenseNumber: lawyerInfo.licenseNumber || '',
          firmName: lawyerInfo.firmName || '',
          specialization: lawyerInfo.specialization || '',
          experienceYears: lawyerInfo.experienceYears ? String(lawyerInfo.experienceYears) : ''
        },
        avatarPreview: avatar,
        avatarUploadFailed: false,
        userId
      });

      if (userId) {
        const response = await get('/lawyers/profile', { userId });
        if (response) {
          const lawyerData = response.lawyerInfo ? { ...response.user, ...response.lawyerInfo } : response;

          if (response.user) {
            const currentUserInfo = getUserInfo() || {};
            if (response.user.phone) currentUserInfo.phone = response.user.phone;
            if (response.user.avatar) currentUserInfo.avatar = response.user.avatar;
            if (response.user.username) currentUserInfo.username = response.user.username;
            setUserInfo(currentUserInfo);
          }

          const nextAvatar = lawyerData.avatar || '';
          this.setData({
            form: {
              avatar: nextAvatar,
              account: lawyerData.account || '',
              username: lawyerData.username || '',
              phone: lawyerData.phone || '',
              licenseNumber: lawyerData.licenseNumber || '',
              firmName: lawyerData.firmName || '',
              specialization: lawyerData.specialization || '',
              experienceYears: lawyerData.experienceYears ? String(lawyerData.experienceYears) : ''
            },
            avatarPreview: nextAvatar,
            avatarUploadFailed: false
          });
        }
      }
    } catch (error) {
      console.error('加载律师信息失败:', error);
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

  handleLicenseNumberChange(e) {
    this.setData({
      'form.licenseNumber': e.detail.value
    });
  },

  handleFirmNameChange(e) {
    this.setData({
      'form.firmName': e.detail.value
    });
  },

  handleSpecializationChange(e) {
    this.setData({
      'form.specialization': e.detail.value
    });
  },

  handleExperienceYearsChange(e) {
    this.setData({
      'form.experienceYears': e.detail.value
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
        title: '请输入姓名',
        icon: 'none'
      });
      return;
    }

    if (!this.data.form.firmName.trim()) {
      wx.showToast({
        title: '请输入律师事务所',
        icon: 'none'
      });
      return;
    }

    if (!this.data.form.specialization.trim()) {
      wx.showToast({
        title: '请输入专业领域',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const userId = getStorage('userId');
      const response = await post('/lawyers/profile', {
        userId,
        username: this.data.form.username,
        licenseNumber: this.data.form.licenseNumber,
        firmName: this.data.form.firmName,
        specialization: this.data.form.specialization,
        experienceYears: this.data.form.experienceYears ? parseInt(this.data.form.experienceYears, 10) : null,
        avatar: this.data.form.avatar
      });

      if (response && (response.user || response.lawyerInfo)) {
        const app = getApp();
        const lawyerData = { ...response.user, ...response.lawyerInfo };
        app.globalData.userInfo = {
          username: this.data.form.username,
          licenseNumber: this.data.form.licenseNumber,
          firmName: this.data.form.firmName,
          specialization: this.data.form.specialization,
          experienceYears: this.data.form.experienceYears ? parseInt(this.data.form.experienceYears, 10) : null,
          avatar: this.data.form.avatar,
          ...lawyerData
        };

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
      console.error('保存律师信息失败:', error);

      const app = getApp();
      app.globalData.userInfo = {
        username: this.data.form.username,
        licenseNumber: this.data.form.licenseNumber,
        firmName: this.data.form.firmName,
        specialization: this.data.form.specialization,
        experienceYears: this.data.form.experienceYears ? parseInt(this.data.form.experienceYears, 10) : null,
        avatar: this.data.form.avatar,
        ...app.globalData.userInfo
      };

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
