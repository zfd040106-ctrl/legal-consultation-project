const { get, post } = require('../../../utils/api');
const { getStorage, setStorage } = require('../../../utils/storage');

Page({
  data: {
    messages: [],
    inputValue: '',
    isTyping: false,
    loading: false,
    scrollToView: '',
    messageId: 0,
    showDrawer: false,
    historyList: [],
    currentSessionId: null,
    statusBarHeight: 20,
    navBarHeight: 44,
    inputAreaHeight: 50,
    bottomSafeHeight: 0,
    quickQuestions: [
      '租房合同需要注意什么？',
      '劳动合同纠纷如何处理？',
      '借钱不还怎么起诉？',
      '离婚财产如何分割？',
      '交通事故责任认定标准是什么？'
    ]
  },

  getCurrentUserId() {
    return getStorage('userId');
  },

  // Scope chat storage by user to avoid cross-account history leakage on same device.
  getScopedStorageKey(baseKey) {
    const userId = this.getCurrentUserId();
    return userId ? `${baseKey}_${userId}` : `${baseKey}_guest`;
  },

  onLoad() {
    // 获取系统信息，计算各区域高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;
    const navBarHeight = 44; // 导航栏内容高度

    // 输入区域高度: padding(8px) + input(36px) + padding(8px) = 52px
    const inputAreaHeight = 52;
    const bottomSafeHeight = systemInfo.safeArea ?
      (systemInfo.screenHeight - systemInfo.safeArea.bottom) : 0;

    this.setData({
      statusBarHeight,
      navBarHeight,
      inputAreaHeight,
      bottomSafeHeight
    });

    this.loadHistoryFromServer();
    // 检查是否有当前会话
    const currentSessionId = getStorage(this.getScopedStorageKey('currentAiSessionId'));
    if (currentSessionId) {
      this.setData({ currentSessionId });
      this.loadSessionMessages(currentSessionId);
    }
  },

  onHide() {
    // 离开页面时保存当前会话
    this.saveCurrentSession();
  },

  onUnload() {
    // 页面卸载时保存当前会话
    this.saveCurrentSession();
  },

  /**
   * 保存当前会话到本地
   */
  saveCurrentSession() {
    if (this.data.messages.length === 0) return;

    const sessionId = this.data.currentSessionId || Date.now().toString();
    const firstQuestion = this.data.messages.find(m => m.role === 'user');
    const title = firstQuestion ? firstQuestion.content.substring(0, 20) : '新会话';

    // 获取现有历史
    let historyList = getStorage(this.getScopedStorageKey('aiChatHistory')) || [];

    // 查找是否已存在该会话
    const existingIndex = historyList.findIndex(h => h.id === sessionId);

    const sessionData = {
      id: sessionId,
      title: title + (title.length >= 20 ? '...' : ''),
      messages: this.data.messages,
      timeText: this.formatDate(new Date()),
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      historyList[existingIndex] = sessionData;
    } else {
      historyList.unshift(sessionData);
    }

    // 最多保存20条历史
    if (historyList.length > 20) {
      historyList = historyList.slice(0, 20);
    }

    setStorage(this.getScopedStorageKey('aiChatHistory'), historyList);
    setStorage(this.getScopedStorageKey('currentAiSessionId'), sessionId);

    this.setData({
      currentSessionId: sessionId,
      historyList
    });
  },

  /**
   * 从服务器加载历史记录
   */
  async loadHistoryFromServer() {
    this.setData({ loading: true });

    const userId = this.getCurrentUserId();
    if (!userId) {
      console.log('用户未登录，无法加载历史记录');
      this.loadHistoryList();
      this.setData({ loading: false });
      return;
    }

    try {
      const response = await get('/ai/history', {
        userId: userId,
        page: 1,
        pageSize: 50
      });

      // 处理不同的返回数据结构
      let serverHistory = [];
      if (Array.isArray(response)) {
        serverHistory = response;
      } else if (response && Array.isArray(response.items)) {
        serverHistory = response.items;
      } else if (response && Array.isArray(response.list)) {
        serverHistory = response.list;
      }

      // 将服务器历史转换为会话列表（按日期分组）
      const historyList = this.convertServerHistoryToSessions(serverHistory);

      // 合并本地存储的会话
      const localHistory = getStorage(this.getScopedStorageKey('aiChatHistory')) || [];

      // 合并去重（以本地为主，服务器作为补充）
      const mergedHistory = this.mergeHistoryLists(localHistory, historyList);

      setStorage(this.getScopedStorageKey('aiChatHistory'), mergedHistory);
      this.setData({
        historyList: mergedHistory,
        loading: false
      });
    } catch (error) {
      console.error('加载服务器历史记录失败:', error);
      // 失败时从本地加载
      this.loadHistoryList();
      this.setData({ loading: false });
    }
  },

  /**
   * 将服务器历史记录转换为会话格式
   */
  convertServerHistoryToSessions(serverHistory) {
    if (!serverHistory || serverHistory.length === 0) return [];

    const sessions = [];
    let currentDate = null;
    let currentSession = null;
    let messageId = 0;

    // 按时间正序处理
    const sortedHistory = [...serverHistory].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.created_at).getTime();
      const timeB = new Date(b.createdAt || b.created_at).getTime();
      return timeA - timeB;
    });

    sortedHistory.forEach(item => {
      const itemTime = new Date(item.createdAt || item.created_at);
      const itemDate = itemTime.toDateString();

      // 如果日期变化或者是第一条，创建新会话
      if (currentDate !== itemDate) {
        if (currentSession && currentSession.messages.length > 0) {
          sessions.push(currentSession);
        }

        currentDate = itemDate;
        currentSession = {
          id: 'server_' + itemTime.getTime(),
          title: item.question ? item.question.substring(0, 20) : '历史会话',
          messages: [],
          recordIds: [],
          timeText: this.formatDate(itemTime),
          timestamp: itemTime.getTime(),
          fromServer: true
        };
        messageId = 0;
      }

      // 添加问答对到当前会话
      if (currentSession) {
        if (item.id) {
          currentSession.recordIds.push(item.id);
        }
        currentSession.messages.push({
          id: ++messageId,
          role: 'user',
          content: item.question,
          timeText: this.formatTimeFromDate(itemTime),
          aiRecordId: item.id || null
        });
        currentSession.messages.push({
          id: ++messageId,
          role: 'assistant',
          content: item.answer,
          timeText: this.formatTimeFromDate(itemTime),
          aiRecordId: item.id || null
        });

        // 更新会话标题为第一条问题
        if (currentSession.messages.length === 2) {
          currentSession.title = item.question.substring(0, 20) + (item.question.length > 20 ? '...' : '');
        }
      }
    });

    // 添加最后一个会话
    if (currentSession && currentSession.messages.length > 0) {
      sessions.push(currentSession);
    }

    // 返回倒序（最新的在前）
    return sessions.reverse();
  },

  /**
   * 合并历史记录列表
   */
  mergeHistoryLists(localList, serverList) {
    const merged = [...localList];
    const localIds = new Set(localList.map(h => h.id));

    serverList.forEach(serverSession => {
      if (!localIds.has(serverSession.id)) {
        merged.push(serverSession);
      }
    });

    // 按时间戳排序，最新的在前
    merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    // 最多保留30条
    return merged.slice(0, 30);
  },

  /**
   * 从Date对象格式化时间
   */
  formatTimeFromDate(date) {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
  },

  /**
   * 加载历史会话列表（本地）
   */
  loadHistoryList() {
    const historyList = getStorage(this.getScopedStorageKey('aiChatHistory')) || [];
    this.setData({ historyList });
  },

  /**
   * 加载指定会话的消息
   */
  loadSessionMessages(sessionId) {
    const historyList = getStorage(this.getScopedStorageKey('aiChatHistory')) || [];
    const session = historyList.find(h => h.id === sessionId);

    if (session && session.messages) {
      let maxId = 0;
      session.messages.forEach(m => {
        if (m.id > maxId) maxId = m.id;
      });

      this.setData({
        messages: session.messages,
        messageId: maxId,
        currentSessionId: sessionId
      });

      setTimeout(() => this.scrollToBottom(), 100);
    }
  },

  /**
   * 切换侧边栏
   */
  toggleDrawer() {
    this.setData({
      showDrawer: !this.data.showDrawer
    });
  },

  /**
   * 新建会话
   */
  createNewChat() {
    // 保存当前会话
    if (this.data.messages.length > 0) {
      this.saveCurrentSession();
    }

    // 重置状态
    this.setData({
      messages: [],
      messageId: 0,
      currentSessionId: null,
      inputValue: '',
      showDrawer: false
    });

    setStorage(this.getScopedStorageKey('currentAiSessionId'), null);
  },

  /**
   * 选择历史会话
   */
  selectSession(e) {
    const session = e.currentTarget.dataset.session;

    // 保存当前会话
    if (this.data.messages.length > 0 && this.data.currentSessionId !== session.id) {
      this.saveCurrentSession();
    }

    this.loadSessionMessages(session.id);
    setStorage(this.getScopedStorageKey('currentAiSessionId'), session.id);

    this.setData({
      showDrawer: false
    });
  },

  /**
   * 删除会话
   */
  deleteSession(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个会话吗？',
      success: async (res) => {
        if (res.confirm) {
          let historyList = getStorage(this.getScopedStorageKey('aiChatHistory')) || [];
          const session = historyList.find(h => h.id === id);
          const recordIds = this.getSessionRecordIds(session);
          const userId = this.getCurrentUserId();
          if (recordIds.length > 0 && userId) {
            try {
              await post('/ai/history/delete', {
                userId,
                ids: recordIds
              });
            } catch (error) {
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
              return;
            }
          }

          historyList = historyList.filter(h => h.id !== id);
          setStorage(this.getScopedStorageKey('aiChatHistory'), historyList);

          // 如果删除的是当前会话，清空消息
          if (this.data.currentSessionId === id) {
            this.setData({
              messages: [],
              messageId: 0,
              currentSessionId: null
            });
            setStorage(this.getScopedStorageKey('currentAiSessionId'), null);
          }

          this.setData({ historyList });

          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  getSessionRecordIds(session) {
    if (!session) return [];
    if (Array.isArray(session.recordIds)) {
      return session.recordIds.filter(id => Number.isInteger(id) && id > 0);
    }
    if (!Array.isArray(session.messages)) {
      return [];
    }
    const ids = session.messages
      .map(message => message.aiRecordId)
      .filter(id => Number.isInteger(id) && id > 0);
    return [...new Set(ids)];
  },

  /**
   * 返回上一页
   */
  handleBack() {
    this.saveCurrentSession();
    wx.navigateBack();
  },

  /**
   * 输入处理
   */
  handleInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  /**
   * 发送快捷问题
   */
  sendQuickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ inputValue: question });
    this.sendMessage();
  },

  /**
   * 发送消息
   */
  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || this.data.isTyping) return;
    const userId = this.getCurrentUserId();
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 如果是新会话，生成会话ID
    if (!this.data.currentSessionId) {
      this.setData({
        currentSessionId: Date.now().toString()
      });
    }

    // 添加用户消息
    const userMessage = {
      id: ++this.data.messageId,
      role: 'user',
      content: content,
      timeText: this.formatTime(new Date())
    };

    this.setData({
      messages: [...this.data.messages, userMessage],
      inputValue: '',
      isTyping: true
    });

    // 滚动到底部
    this.scrollToBottom();

    try {
      // 调用AI接口
      const response = await post('/ai/chat', {
        userId: userId,
        message: content
      });
      const recordId = Number.isInteger(response.id) ? response.id : null;

      // 添加AI回复
      const aiMessage = {
        id: ++this.data.messageId,
        role: 'assistant',
        content: response.answer || response.reply || response.content || '抱歉，我暂时无法回答这个问题。',
        timeText: this.formatTime(new Date()),
        aiRecordId: recordId
      };

      this.setData({
        messages: this.data.messages.map(message =>
          message.id === userMessage.id ? { ...message, aiRecordId: recordId } : message
        ).concat(aiMessage),
        isTyping: false
      });

      // 滚动到底部
      this.scrollToBottom();

      // 保存会话
      this.saveCurrentSession();
    } catch (error) {
      console.error('AI回复失败:', error);

      // 添加错误消息
      const errorMessage = {
        id: ++this.data.messageId,
        role: 'assistant',
        content: '网络异常，请稍后重试。',
        timeText: this.formatTime(new Date())
      };

      this.setData({
        messages: [...this.data.messages, errorMessage],
        isTyping: false
      });

      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
    }
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollToView: 'chat-bottom'
      });
    }, 100);
  },

  /**
   * 格式化时间（当天显示时分）
   */
  formatTime(date) {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
  },

  /**
   * 格式化日期（用于历史列表）
   */
  formatDate(date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return '今天';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: 'AI法律助手 - 在线法律咨询',
      path: '/pages/user/aiChat/aiChat'
    };
  }
});
