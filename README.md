# 法律咨询系统（展示版）

这是一个由三个子项目组成的展示版工程（后端 Spring 服务、管理端前端、小程序端前端）。

## 项目概述
- `law-consult-server`：Spring Boot + MyBatis 的后端服务，提供 `/api/*` 接口（含认证、用户/律师管理、咨询、投诉、公告、文件上传、钱包、AI 分类与问答等）。
- `law-consult-admin`：Vue3 + Vite 的管理端页面，通过代理将 `/api` 转发到后端。
- `law-consult-miniprogram`：微信小程序前端，调用后端接口。

## 技术栈
- 后端：Spring Boot（WebMVC）、MyBatis、MySQL（通过 JDBC）、Spring Security Crypto（密码哈希校验）、SpringDoc OpenAPI UI（依赖已在 `pom.xml` 中出现）
- 管理端：Vue 3、Vue Router、Pinia、Axios、Element Plus、Vite
- 小程序端：WeChat Mini Program（工程由 `app.json`/`pages`/`utils` 等组成）

## 目录结构
- `law-consult-server/`
  - `law-consult-server/`（真正的 Maven 项目）
    - `src/main/java/`：后端控制器、服务、工具类等
    - `src/main/resources/`：`application.properties`、MyBatis Mapper、以及 SQL 初始化/对齐脚本
    - （运行时会用到）`uploads/`：文件上传目录（本展示版已移入 `__to_review_delete__`）
- `law-consult-admin/`
  - `law-consult-admin/`（Vite 项目）
    - `src/`：页面组件与 API 调用
    - `vite.config.js`：`/api` 代理配置（目标默认 `http://localhost:8080`）
- `law-consult-miniprogram/`
  - 小程序工程目录（含：`pages/`、`components/`、`utils/`、`app.js/json/wxss` 等）
  - `utils/config.js`：后端基础地址配置（开发环境默认 `http://localhost:8080/api`）
- `__to_review_delete__/`
  - 用于暂存不适合公开上传的依赖/构建产物/上传文件（例如 `node_modules/`、`dist/`、`target/`、`.idea/` 等），建议在公开仓库中不要提交

## 功能模块（后端路由/能力概览）
- 健康检查：`GET /api`
- 认证与账户：`/api/auth/*`、`/api/users`、`/api/lawyers`
- 咨询：`/api/consultations/*`（创建、列表、详情、回复/确认解决、接单/拒单/付费/删除等）
- 管理后台：`/api/admin/*`
  - 公告：`/api/admin/announcements/*`
  - 投诉：`/api/admin/complaints/*`
  - 轮播：`/api/admin/carousels/*`
  - 咨询管理：`/api/admin/consultations*`
  - 审核日志与统计：`/api/admin/audit-logs*`、`/api/admin/statistics*`
- 文件上传：`/api/file/*`（upload/avatar/consultation）
- 钱包：`/api/wallet/*`
- AI：`/api/ai*`
- 公开信息：`/api/public*`

## 运行环境
- 后端运行
  - JDK：项目 `pom.xml` 中指定版本（按项目实际要求安装）
  - MySQL：需要创建数据库与表（见下方“数据库初始化说明”）
  - 需要网络访问 OpenRouter（如启用 AI 功能）
- 管理端运行
  - Node.js（满足 `law-consult-admin/law-consult-admin/package.json` 依赖）
- 小程序运行
  - 微信开发者工具

## 配置说明（不要提交真实密钥/密码）
后端配置位于：
- `law-consult-server/law-consult-server/src/main/resources/application.properties`
- 示例配置文件：`law-consult-server/law-consult-server/src/main/resources/application.example.properties`

仓库内的 `application.properties` 已使用占位符（不会包含真实密钥/密码）。你需要在本地运行时将其替换为自己的真实值：
- `spring.datasource.password`
- `openrouter.api.key`

其它关键配置：
- `server.port=8080`
- `app.upload.dir=uploads/`
- `app.upload.base-url=http://localhost:8080/uploads/`

## 数据库初始化说明
后端 SQL 初始化/对齐脚本位于：
- `law-consult-server/law-consult-server/src/main/resources/init.sql`
  - 包含数据库/表结构创建与初始化数据：本展示版已注释掉最后的固定演示管理员账号插入语句
- `law-consult-server/law-consult-server/src/main/resources/chapter5_restore.sql`
  - 用于钱包/余额等数据恢复（依赖 `users` 的已有数据）
- `law-consult-server/law-consult-server/src/main/resources/paper_schema_align.sql`
  - 用于后续字段调整与数据补齐（包含 `UPDATE`/`ALTER TABLE` 等操作）

## 注意事项
- 不要在公开仓库中提交真实的数据库密码、API Key 或任何生产环境凭据。
- 本展示版将 `node_modules/`、`dist/`、`target/`、`.idea/`、上传目录等不适合公开的内容移动到 `__to_review_delete__/`，建议不要提交该目录。
- 如果你需要使用演示数据，请在部署前检查其中是否包含你不希望公开的个人信息或账号信息。

