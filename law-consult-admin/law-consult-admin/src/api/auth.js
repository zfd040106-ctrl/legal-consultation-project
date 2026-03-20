import request from './request'

/**
 * 管理员登录接口
 */
export const login = (account, password) => {
  return request.post('/auth/admin/login', {
    account,
    password
  })
}

/**
 * 登出接口
 */
export const logout = () => {
  return request.post('/auth/admin/logout')
}

/**
 * 刷新 token
 */
export const refreshToken = () => {
  return request.post('/auth/admin/refresh-token')
}

/**
 * 获取当前管理员信息
 */
export const getAdminProfile = () => {
  return request.get('/profile')
}
