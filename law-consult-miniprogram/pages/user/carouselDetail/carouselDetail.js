const { get } = require('../../../utils/api');
const { API_BASE_URL } = require('../../../utils/config');
const { getStorage } = require('../../../utils/storage');

const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const LOCAL_CAROUSEL_FALLBACK = '/assets/images/splash-bg.png';
const CAROUSEL_READER_STORAGE_KEY = 'userCarouselReaderItem';
const MAX_READER_PAGE_WEIGHT = 300;
const MAX_SEGMENT_LENGTH = 96;

Page({
  data: {
    loading: true,
    carouselId: '',
    detail: null,
    currentReaderPage: 0
  },

  onLoad(options) {
    this.setData({
      carouselId: options && options.id ? options.id : ''
    });
    this.loadDetail();
  },

  handleBack() {
    wx.navigateBack();
  },

  async loadDetail() {
    this.setData({
      loading: true
    });

    try {
      const cachedItem = this.getCachedItem();
      if (cachedItem) {
        this.setData({
          detail: this.normalizeDetail(cachedItem),
          loading: false,
          currentReaderPage: 0
        });
        return;
      }

      const response = await get('/public/carousels');
      const item = (Array.isArray(response) ? response : []).find(
        (current) => String(current.id) === String(this.data.carouselId)
      );

      if (!item) {
        throw new Error('Carousel detail not found.');
      }

      this.setData({
        detail: this.normalizeDetail(item),
        loading: false,
        currentReaderPage: 0
      });
    } catch (error) {
      console.error('Failed to load carousel detail:', error);
      this.setData({
        detail: null,
        loading: false,
        currentReaderPage: 0
      });
    }
  },

  getCachedItem() {
    const cachedItem = getStorage(CAROUSEL_READER_STORAGE_KEY);
    if (!cachedItem) {
      return null;
    }

    if (this.data.carouselId && String(cachedItem.id) !== String(this.data.carouselId)) {
      return null;
    }

    return cachedItem;
  },

  normalizeDetail(item) {
    const normalizedItem = item || {};
    const rawContent = normalizedItem.content || normalizedItem.summary || '暂无正文内容';
    const contentParagraphs = rawContent
      .split(/\n+/)
      .map((text) => (text || '').trim())
      .filter(Boolean);
    const normalizedParagraphs = contentParagraphs.length > 0 ? contentParagraphs : [rawContent];
    const readerPages = this.buildReaderPages(normalizedParagraphs);

    return {
      ...normalizedItem,
      displayImageUrl: this.normalizeCarouselImageUrl(normalizedItem.imageUrl),
      title: normalizedItem.title || '法律专题',
      categoryText: normalizedItem.category || '法律专题',
      summaryText: (normalizedItem.summary || '').trim(),
      contentText: rawContent,
      timeText: this.formatTime(
        normalizedItem.updatedAt ||
        normalizedItem.updateTime ||
        normalizedItem.createdAt ||
        normalizedItem.createTime ||
        normalizedItem.updated_at ||
        normalizedItem.created_at
      ),
      readerPages
    };
  },

  buildReaderPages(paragraphs) {
    const segments = (Array.isArray(paragraphs) ? paragraphs : [])
      .reduce((result, paragraph) => result.concat(this.splitParagraph(paragraph)), [])
      .filter(Boolean);

    if (segments.length === 0) {
      return [{
        index: 0,
        pageNumber: 1,
        paragraphs: ['暂无正文内容']
      }];
    }

    const pages = [];
    let currentPage = [];
    let currentWeight = 0;

    segments.forEach((segment) => {
      const normalizedSegment = (segment || '').trim();
      if (!normalizedSegment) {
        return;
      }

      const segmentWeight = this.getSegmentWeight(normalizedSegment);
      if (currentPage.length > 0 && currentWeight + segmentWeight > MAX_READER_PAGE_WEIGHT) {
        pages.push(currentPage);
        currentPage = [normalizedSegment];
        currentWeight = segmentWeight;
        return;
      }

      currentPage.push(normalizedSegment);
      currentWeight += segmentWeight;
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.map((pageParagraphs, index) => ({
      index,
      pageNumber: index + 1,
      paragraphs: pageParagraphs
    }));
  },

  splitParagraph(paragraph) {
    const normalizedParagraph = (paragraph || '').replace(/\r/g, '').trim();
    if (!normalizedParagraph) {
      return [];
    }

    const sentenceList = normalizedParagraph.match(/[^。！？；!?;]+[。！？；!?;]?/g) || [normalizedParagraph];
    return sentenceList.reduce((result, sentence) => {
      const cleanSentence = (sentence || '').trim();
      if (!cleanSentence) {
        return result;
      }
      return result.concat(this.splitLongText(cleanSentence, MAX_SEGMENT_LENGTH));
    }, []);
  },

  splitLongText(text, maxLength) {
    const content = (text || '').trim();
    if (!content) {
      return [];
    }

    if (content.length <= maxLength) {
      return [content];
    }

    const chunks = [];
    let start = 0;

    while (start < content.length) {
      let end = Math.min(start + maxLength, content.length);
      if (end < content.length) {
        const candidateIndexes = [
          content.lastIndexOf('，', end),
          content.lastIndexOf('、', end),
          content.lastIndexOf(',', end),
          content.lastIndexOf(' ', end)
        ];
        const breakIndex = Math.max(...candidateIndexes);
        if (breakIndex > start + Math.floor(maxLength / 2)) {
          end = breakIndex + 1;
        }
      }

      chunks.push(content.slice(start, end).trim());
      start = end;
    }

    return chunks.filter(Boolean);
  },

  getSegmentWeight(text) {
    return Math.max(1, Math.ceil((text || '').length * 1.15) + 12);
  },

  normalizeCarouselImageUrl(rawUrl) {
    if (!rawUrl) {
      return LOCAL_CAROUSEL_FALLBACK;
    }

    const trimmedUrl = String(rawUrl).trim();
    if (!trimmedUrl) {
      return LOCAL_CAROUSEL_FALLBACK;
    }

    let normalizedUrl = trimmedUrl.replace(/\\/g, '/');
    if (/^https?:\/\//i.test(normalizedUrl)) {
      const uploadMatch = normalizedUrl.match(/\/uploads\/.+$/i);
      if (uploadMatch) {
        return `${MEDIA_BASE_URL}${uploadMatch[0]}`;
      }
      return normalizedUrl;
    }

    if (normalizedUrl.startsWith('/uploads/')) {
      return `${MEDIA_BASE_URL}${normalizedUrl}`;
    }

    normalizedUrl = normalizedUrl.replace(/^\/+/, '');
    return `${MEDIA_BASE_URL}/uploads/${normalizedUrl}`;
  },

  formatTime(value) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  previewCover() {
    const detail = this.data.detail;
    if (!detail || !detail.displayImageUrl) {
      return;
    }

    wx.previewImage({
      current: detail.displayImageUrl,
      urls: [detail.displayImageUrl]
    });
  },

  handleReaderPageChange(event) {
    const current = event && event.detail ? Number(event.detail.current || 0) : 0;
    this.setData({
      currentReaderPage: current
    });
  },

  goToPrevReaderPage() {
    this.setData({
      currentReaderPage: Math.max(0, (this.data.currentReaderPage || 0) - 1)
    });
  },

  goToNextReaderPage() {
    const detail = this.data.detail || {};
    const pageCount = Array.isArray(detail.readerPages) ? detail.readerPages.length : 0;
    this.setData({
      currentReaderPage: Math.min(Math.max(pageCount - 1, 0), (this.data.currentReaderPage || 0) + 1)
    });
  }
});
