const { get, post, uploadFile } = require('../../../utils/api');
const { APP_CONSTANTS } = require('../../../utils/config');
const { getStorage } = require('../../../utils/storage');

const MIN_FEE = 9.9;

Page({
  data: {
    form: {
      title: '',
      category: '',
      priority: 'low',
      content: '',
      files: [],
      lawyerId: null,
      assignmentType: 'public',
      feeAmount: ''
    },
    selectedLawyer: null,
    walletSummary: {
      availableBalance: '0.00'
    },
    errors: {},
    loading: false,
    categories: APP_CONSTANTS.CONSULTATION_CATEGORIES
  },

  onLoad(options) {
    if (options.lawyerId) {
      this.loadSelectedLawyer(options.lawyerId);
    }
    this.loadWalletSummary();
  },

  onShow() {
    this.loadWalletSummary();
  },

  handleBack() {
    wx.navigateBack();
  },

  async loadSelectedLawyer(lawyerId) {
    try {
      const lawyer = await get('/lawyers/public-profile', { lawyerId });
      this.setData({
        selectedLawyer: lawyer,
        'form.lawyerId': lawyer.userId,
        'form.assignmentType': 'directed'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '律师信息加载失败',
        icon: 'none'
      });
    }
  },

  async loadWalletSummary() {
    const ownerId = getStorage('userId');
    if (!ownerId) return;

    try {
      const response = await get(`/wallet/user/${ownerId}`);

      this.setData({
        walletSummary: {
          availableBalance: this.formatMoney(response.availableBalance),
          frozenBalance: this.formatMoney(response.frozenBalance),
          totalIncome: this.formatMoney(response.totalIncome),
          totalExpense: this.formatMoney(response.totalExpense)
        }
      });
    } catch (error) {
      console.error('加载钱包失败:', error);
    }
  },

  formatMoney(value) {
    return Number(value || 0).toFixed(2);
  },

  handleTitleInput(e) {
    this.setData({
      'form.title': e.detail.value,
      'errors.title': ''
    });
  },

  handleFeeInput(e) {
    this.setData({
      'form.feeAmount': e.detail.value,
      'errors.feeAmount': ''
    });
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      'form.category': category,
      'errors.category': ''
    });
  },

  selectPriority(e) {
    const priority = e.currentTarget.dataset.priority;
    this.setData({
      'form.priority': priority
    });
  },

  handleContentInput(e) {
    this.setData({
      'form.content': e.detail.value,
      'errors.content': ''
    });
  },

  goToFindLawyer() {
    wx.navigateTo({
      url: '/pages/user/findLawyer/findLawyer?selectMode=consultation'
    });
  },

  clearSelectedLawyer() {
    this.setData({
      selectedLawyer: null,
      'form.lawyerId': null,
      'form.assignmentType': 'public'
    });
  },

  goToWallet() {
    wx.navigateTo({
      url: '/pages/user/wallet/wallet'
    });
  },

  chooseFile() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择', '选择文件'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.takePhoto();
        } else if (res.tapIndex === 1) {
          this.chooseImage();
        } else {
          this.chooseDocument();
        }
      }
    });
  },

  takePhoto() {
    wx.chooseMedia({
      count: 9 - this.data.form.files.length,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const newFiles = res.tempFiles.map((file) => ({
          path: file.tempFilePath,
          type: 'image',
          name: '照片'
        }));
        this.setData({
          'form.files': [...this.data.form.files, ...newFiles]
        });
      }
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.form.files.length,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const newFiles = res.tempFiles.map((file) => ({
          path: file.tempFilePath,
          type: 'image',
          name: '图片'
        }));
        this.setData({
          'form.files': [...this.data.form.files, ...newFiles]
        });
      }
    });
  },

  chooseDocument() {
    wx.chooseMessageFile({
      count: 9 - this.data.form.files.length,
      type: 'file',
      success: (res) => {
        const newFiles = res.tempFiles.map((file) => ({
          path: file.path,
          type: 'file',
          name: file.name
        }));
        this.setData({
          'form.files': [...this.data.form.files, ...newFiles]
        });
      }
    });
  },

  previewImage(e) {
    const currentPath = e.currentTarget.dataset.path;
    const images = this.data.form.files
      .filter((file) => file.type === 'image')
      .map((file) => file.path);

    if (images.length > 0) {
      wx.previewImage({
        current: currentPath,
        urls: images
      });
    }
  },

  removeFile(e) {
    const index = e.currentTarget.dataset.index;
    const files = [...this.data.form.files];
    files.splice(index, 1);
    this.setData({
      'form.files': files
    });
  },

  validateForm() {
    const { title, category, content, feeAmount } = this.data.form;
    const errors = {};

    if (!title || title.trim().length === 0) {
      errors.title = '请输入咨询标题';
    } else if (title.trim().length < 5) {
      errors.title = '标题至少需要 5 个字';
    }

    if (!category) {
      errors.category = '请选择问题分类';
    }

    if (!content || content.trim().length === 0) {
      errors.content = '请输入问题描述';
    } else if (content.trim().length < 20) {
      errors.content = '问题描述至少需要 20 个字';
    }

    if (feeAmount !== '') {
      const parsedFee = Number(feeAmount);
      const balance = Number(this.data.walletSummary.availableBalance || 0);

      if (Number.isNaN(parsedFee) || parsedFee < 0) {
        errors.feeAmount = '请输入有效的服务费金额';
      } else if (parsedFee > 0 && parsedFee < MIN_FEE) {
        errors.feeAmount = `有偿咨询最低服务费为 ¥${MIN_FEE.toFixed(1)}`;
      } else if (parsedFee > balance) {
        errors.feeAmount = '钱包余额不足，请先充值';
      }
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  async handleSubmit() {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请检查输入内容',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      let fileUrls = [];
      if (this.data.form.files.length > 0) {
        fileUrls = await this.uploadFiles();
      }

      const userId = getStorage('userId');
      const feeAmount = this.data.form.feeAmount === ''
        ? 0
        : Number(this.data.form.feeAmount).toFixed(2);

      const consultationData = {
        userId,
        lawyerId: this.data.form.lawyerId,
        assignmentType: this.data.form.lawyerId ? 'directed' : 'public',
        title: this.data.form.title.trim(),
        category: this.data.form.category,
        priority: this.data.form.priority,
        content: this.data.form.content.trim(),
        feeAmount,
        attachments: fileUrls
      };

      const response = await post('/consultations', consultationData);
      const consultationId = response && response.id;

      let toastTitle = '咨询提交成功';
      if (Number(feeAmount) > 0 && consultationId) {
        try {
          await post(`/consultations/${consultationId}/pay`, { userId });
          toastTitle = '咨询已创建并完成支付';
        } catch (payError) {
          toastTitle = '咨询已创建，请尽快完成支付';
        }
      }

      wx.showToast({
        title: toastTitle,
        icon: 'success'
      });

      setTimeout(() => {
        if (consultationId) {
          wx.redirectTo({
            url: `/pages/user/consultationDetail/consultationDetail?id=${consultationId}`
          });
        } else {
          wx.navigateBack();
        }
      }, 1200);
    } catch (error) {
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async uploadFiles() {
    const uploadPromises = this.data.form.files.map((file) => uploadFile(
      '/file/upload',
      file.path,
      'file',
      { type: 'consultation' }
    ));

    try {
      const results = await Promise.all(uploadPromises);
      return results.map((result) => result.url || result.path);
    } catch (error) {
      throw new Error('文件上传失败');
    }
  }
});
