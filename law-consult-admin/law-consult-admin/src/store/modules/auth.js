import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const adminToken = ref(localStorage.getItem('adminToken') || '')
  const adminId = ref(localStorage.getItem('adminId') || '')
  const adminName = ref(localStorage.getItem('adminName') || '')
  const adminRole = ref(localStorage.getItem('adminRole') || '')
  const permissions = ref(JSON.parse(localStorage.getItem('permissions') || '[]'))
  const isLoading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!adminToken.value)

  /**
   * 登录
   */
  const login = async (account, password) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await authApi.login(account, password)

      // 保存认证信息（使用adminId作为令牌，不需要token）
      adminToken.value = response.adminId.toString()  // 为兼容性保留token字段，值为adminId
      adminId.value = response.adminId
      adminName.value = response.adminName || response.username
      adminRole.value = response.adminRole
      permissions.value = response.permissions || []

      // 保存到本地存储
      localStorage.setItem('adminToken', response.adminId.toString())
      localStorage.setItem('adminId', response.adminId)
      localStorage.setItem('adminName', response.adminName || response.username)
      localStorage.setItem('adminRole', response.adminRole)
      localStorage.setItem('permissions', JSON.stringify(response.permissions || []))

      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 登出
   */
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('登出错误:', err)
    } finally {
      // 清空状态
      adminToken.value = ''
      adminId.value = ''
      adminName.value = ''
      adminRole.value = ''
      permissions.value = []

      // 清空本地存储
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminId')
      localStorage.removeItem('adminName')
      localStorage.removeItem('adminRole')
      localStorage.removeItem('permissions')
    }
  }

  /**
   * 检查权限
   */
  const hasPermission = (permission) => {
    // superAdmin 拥有所有权限
    if (adminRole.value === 'superAdmin') {
      return true
    }
    return permissions.value.includes(permission)
  }

  /**
   * 初始化认证状态（从本地存储恢复）
   */
  const initializeAuth = () => {
    const token = localStorage.getItem('adminToken')
    const id = localStorage.getItem('adminId')
    const name = localStorage.getItem('adminName')
    const role = localStorage.getItem('adminRole')
    const perms = JSON.parse(localStorage.getItem('permissions') || '[]')

    if (token && id && role) {
      adminToken.value = token
      adminId.value = id
      adminName.value = name
      adminRole.value = role
      permissions.value = perms
      return true
    }
    return false
  }

  return {
    // 状态
    adminToken,
    adminId,
    adminName,
    adminRole,
    permissions,
    isLoading,
    error,
    isLoggedIn,

    // 方法
    login,
    logout,
    hasPermission,
    initializeAuth
  }
})
