<template>
  <div class="login-page">
    <!-- 全屏背景图 -->
    <div class="background-layer">
      <img src="@/assets/login-bg.png" alt="背景" class="bg-image" />
      <div class="bg-overlay"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="card-header">
        <div class="logo-wrapper">
          <el-icon :size="42" color="#0f172a"><Connection /></el-icon>
        </div>
        <h1>法律咨询平台</h1>
        <p>管理后台登录</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="account">
          <el-input
            v-model="form.account"
            placeholder="请输入账号"
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            class="custom-input"
          />
        </el-form-item>

        <div class="form-actions">
          <el-checkbox v-model="rememberMe" label="记住账号" />
          <el-button link type="primary" class="forgot-btn">忘记密码？</el-button>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-footer">
      © 2025 法律咨询平台 · All Rights Reserved
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Connection } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  account: '',
  password: ''
})

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    loading.value = true

    console.log('[Login] 开始登录...', form.account)
    const success = await authStore.login(form.account, form.password)
    console.log('[Login] 登录结果:', success)
    console.log('[Login] authStore.isLoggedIn:', authStore.isLoggedIn)

    if (success) {
      ElMessage.success('登录成功')
      console.log('[Login] 准备跳转到 /dashboard')
      await router.push('/dashboard')
      console.log('[Login] 跳转完成')
    } else {
      ElMessage.error(authStore.error || '登录失败，请检查账号密码')
    }
  } catch (error) {
    console.error('[Login] 登录错误:', error)
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
}

/* 背景层 */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.2) 100%
  );
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.08),
    0 25px 50px -12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.card-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.card-header p {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

/* 表单样式 */
.login-form {
  :deep(.el-form-item) {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    padding: 8px 16px;
    height: 50px;
    border-radius: 12px;
    background-color: #f8fafc;
    box-shadow: none !important;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;

    &:hover {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
    }

    &.is-focus {
      background-color: #fff;
      border-color: #0f172a;
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08) !important;
    }
  }

  :deep(.el-input__inner) {
    font-weight: 500;
    color: #0f172a;
    &::placeholder {
      color: #94a3b8;
    }
  }

  :deep(.el-input__prefix-inner .el-icon) {
    font-size: 18px;
    color: #94a3b8;
    margin-left: 4px;
  }
  :deep(.is-focus .el-input__prefix-inner .el-icon) {
    color: #0f172a;
  }
  :deep(.el-input__suffix-inner .el-icon) {
    color: #94a3b8;
  }
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  margin-top: -8px;
}

.form-actions :deep(.el-checkbox__label) {
  color: #64748b;
  font-weight: 500;
}

.form-actions :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #0f172a;
  border-color: #0f172a;
}

.forgot-btn {
  color: #64748b;
  font-weight: 600;
  &:hover { color: #0f172a; }
}

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s;

  &:hover, &:focus {
    background: linear-gradient(135deg, #2d4a6f 0%, #1e293b 100%);
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -10px rgba(15, 23, 42, 0.4);
  }
}

.page-footer {
  position: absolute;
  bottom: 32px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  z-index: 10;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}
</style>
