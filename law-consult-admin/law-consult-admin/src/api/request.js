import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

/**
 * 创建 axios 实例
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    config.headers['Content-Type'] = 'application/json'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
apiClient.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data

    if (code === 200 || code === 201) {
      return Promise.resolve(data)
    } else {
      return Promise.reject(new Error(message || '请求失败'))
    }
  },
  (error) => {
    // 处理响应错误
    if (error.response?.status === 401) {
      // Token 过期或无效
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminId')
      localStorage.removeItem('adminRole')
      localStorage.removeItem('adminName')
      window.location.href = '/login'
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }

    const message = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(message))
  }
)

/**
 * 通用请求方法
 */
const request = {
  get(url, params = {}) {
    return apiClient.get(url, { params })
  },

  post(url, data = {}, isQueryParams = false) {
    if (isQueryParams) {
      const queryString = new URLSearchParams(data).toString()
      return apiClient.post(`${url}?${queryString}`)
    }
    return apiClient.post(url, data)
  },

  put(url, data = {}, isQueryParams = false) {
    if (isQueryParams) {
      const queryString = new URLSearchParams(data).toString()
      return apiClient.put(`${url}?${queryString}`)
    }
    return apiClient.put(url, data)
  },

  delete(url, data = {}) {
    return apiClient.delete(url, { data })
  }
}

export default request
