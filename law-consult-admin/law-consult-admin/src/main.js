import { createApp } from 'vue'
import App from './App.vue'

// Element Plus UI 库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 自定义样式
import './styles/variables.css'
import './styles/common.css'

// Pinia 状态管理
import pinia from './store'

// Vue Router 路由
import router from './router'

const app = createApp(App)

// 使用插件
app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 挂载应用
app.mount('#app')

