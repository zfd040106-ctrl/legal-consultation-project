import request from './request'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

export const getAdminProfile = (adminId) => {
  return request.get('/admin/profile', { adminId })
}

export const getStatistics = () => {
  return request.get('/admin/statistics')
}

export const getUserGrowthData = () => {
  return request.get('/admin/statistics/user-growth')
}

export const getLawyerGrowthData = () => {
  return request.get('/admin/statistics/lawyer-growth')
}

export const getConsultationDistribution = () => {
  return request.get('/admin/statistics/consultation-distribution')
}

export const getUsers = (params) => {
  return request.get('/admin/users', params)
}

export const getUserDetail = (userId) => {
  return request.get(`/admin/users/${userId}`)
}

export const updateUserStatus = (userId, status) => {
  return request.put(`/admin/users/${userId}/status`, { status }, true)
}

export const deleteUser = (userId) => {
  return request.delete(`/admin/users/${userId}`)
}

export const getPendingLawyers = (params) => {
  return request.get('/admin/lawyers/pending', params)
}

export const getLawyerDetail = (lawyerId) => {
  return request.get(`/admin/lawyers/${lawyerId}`)
}

export const approveLawyer = (lawyerId, adminId, reason = '') => {
  return request.put(`/admin/lawyers/${lawyerId}/approve`, {
    adminId,
    approved: true,
    reason
  }, true)
}

export const rejectLawyer = (lawyerId, adminId, reason = '') => {
  return request.put(`/admin/lawyers/${lawyerId}/approve`, {
    adminId,
    approved: false,
    reason
  }, true)
}

export const getComplaints = (params) => {
  return request.get('/admin/complaints', params)
}

export const getComplaintDetail = (complaintId) => {
  return request.get(`/admin/complaints/${complaintId}`)
}

export const handleComplaint = (complaintId, adminId, status, reason = '') => {
  return request.put(`/admin/complaints/${complaintId}`, {
    adminId,
    status,
    reason
  }, false)
}

export const deleteComplaint = (complaintId) => {
  return request.delete(`/admin/complaints/${complaintId}`)
}

export const getAnnouncements = (params) => {
  return request.get('/admin/announcements', params)
}

export const createAnnouncement = (data) => {
  const { adminId, title, content, isPinned, status } = data
  return request.post('/admin/announcements', {
    adminId,
    title,
    content,
    isPinned: isPinned || false,
    status: status || 'published'
  }, true)
}

export const updateAnnouncement = (announcementId, data) => {
  return request.put(`/admin/announcements/${announcementId}`, data, true)
}

export const pinAnnouncement = (announcementId) => {
  return request.post(`/admin/announcements/${announcementId}/pin`, {})
}

export const unpinAnnouncement = (announcementId) => {
  return request.post(`/admin/announcements/${announcementId}/unpin`, {})
}

export const deleteAnnouncement = (announcementId) => {
  return request.delete(`/admin/announcements/${announcementId}`)
}

export const getConsultations = (params) => {
  return request.get('/admin/consultations', params)
}

export const getConsultationDetail = (consultationId) => {
  return request.get(`/admin/consultations/${consultationId}`)
}

export const updateConsultationStatus = (consultationId, status) => {
  return request.put(`/admin/consultations/${consultationId}/status`, { status }, false)
}

export const assignLawyerToConsultation = (consultationId, lawyerId) => {
  return request.put(`/admin/consultations/${consultationId}/assign-lawyer`, { lawyerId }, true)
}

export const deleteConsultation = (consultationId, adminId) => {
  return request.delete(`/admin/consultations/${consultationId}?adminId=${adminId}`)
}

export const getCarousels = (params) => {
  return request.get('/admin/carousels', params)
}

export const createCarousel = (data) => {
  return request.post('/admin/carousels', data)
}

export const updateCarousel = (carouselId, data) => {
  return request.put(`/admin/carousels/${carouselId}`, data)
}

export const deleteCarousel = (carouselId) => {
  return request.delete(`/admin/carousels/${carouselId}`)
}

export const uploadCarouselImage = async (file, adminId) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'carousel')
  if (adminId) {
    formData.append('userId', adminId)
  }

  const token = localStorage.getItem('adminToken')
  const response = await axios.post(`${API_BASE_URL}/file/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : ''
    }
  })

  if (response.data.code === 200 || response.data.code === 201) {
    const data = response.data.data
    return data.url || data.path || data
  }
  throw new Error(response.data.message || '上传失败')
}

export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const token = localStorage.getItem('adminToken')
  const response = await axios.post(`${API_BASE_URL}/file/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : ''
    }
  })
  if (response.data.code === 200 || response.data.code === 201) {
    const data = response.data.data
    return data.url || data.path || data
  }
  throw new Error(response.data.message || '上传失败')
}

export const updateAdminAvatar = (userId, avatar) => {
  return request.put('/users/profile', { userId, avatar }, true)
}

export const getRecentAuditLogs = (limit = 10) => {
  return request.get('/admin/audit-logs', { limit })
}

export const getAuditLogsList = (params) => {
  return request.get('/admin/audit-logs/list', params)
}
