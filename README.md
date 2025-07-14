# 项目管理系统 (Project Management System)

一个功能完整的项目管理系统，支持项目/任务管理、团队协作、权限控制、甘特图可视化、文件服务和API集成。

## 🌟 功能特性

### 📋 项目管理
- ✅ 项目创建、编辑、删除
- ✅ 项目进度跟踪和状态管理
- ✅ 项目团队分配
- ✅ 项目时间线管理

### ✅ 任务管理
- ✅ 任务和子任务的完整生命周期管理
- ✅ 任务状态跟踪 (待办/进行中/审核/完成)
- ✅ 优先级设置 (低/中/高/紧急)
- ✅ 任务分配给团队成员
- ✅ 任务进度跟踪

### 👥 团队协作
- ✅ 团队创建和成员管理
- ✅ 角色权限控制 (管理员/经理/成员/查看者)
- ✅ 成员可归属多个团队
- ✅ 团队管理员设置

### 📊 可视化
- ✅ 甘特图时间线展示
- ✅ 项目进度仪表板
- ✅ 任务统计和分析
- ✅ 团队/成员过滤功能

### 📁 文件管理
- ✅ 项目文件上传和共享
- ✅ 任务附件支持
- ✅ 文件评论功能
- ✅ 公共文件服务

### 🔗 集成功能
- ✅ 外部API集成支持
- ✅ 任务完成实时通知
- ✅ RESTful API接口

## 🏗️ 技术架构

### 后端技术栈
- **框架**: FastAPI (Python)
- **API文档**: 自动生成的OpenAPI/Swagger文档
- **认证**: Bearer Token认证
- **数据存储**: 内存数据库 (概念验证)

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: 自定义组件库
- **路由**: React Router
- **HTTP客户端**: Axios
- **图标**: Lucide React

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- Python 3.12+
- Poetry (Python包管理)
- pnpm/npm/yarn (Node.js包管理)

### 本地开发

#### 1. 克隆项目
```bash
git clone <repository-url>
cd project-management-system
```

#### 2. 启动后端服务
```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将在 http://localhost:8000 启动
API文档访问: http://localhost:8000/docs

#### 3. 启动前端服务
```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:5173 启动

### 生产部署

#### 后端部署 (Fly.io)
```bash
cd backend
# 确保 pyproject.toml 包含所有依赖
fly deploy
```

#### 前端部署
```bash
cd frontend
# 更新 src/lib/api.ts 中的 API_URL 为生产环境地址
npm run build
# 部署 dist 目录到静态文件托管服务
```

## 📖 API文档

### 认证
所有API请求需要在Header中包含认证令牌:
```
Authorization: Bearer demo-token
```

### 主要端点

#### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/{user_id}` - 获取用户详情

#### 团队管理
- `GET /api/teams` - 获取团队列表
- `POST /api/teams` - 创建团队
- `POST /api/teams/{team_id}/members/{user_id}` - 添加团队成员
- `DELETE /api/teams/{team_id}/members/{user_id}` - 移除团队成员

#### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `PUT /api/projects/{project_id}` - 更新项目
- `DELETE /api/projects/{project_id}` - 删除项目

#### 任务管理
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/{task_id}` - 更新任务
- `DELETE /api/tasks/{task_id}` - 删除任务
- `GET /api/tasks/{task_id}/subtasks` - 获取子任务

#### 文件管理
- `GET /api/files` - 获取文件列表
- `POST /api/files/upload` - 上传文件
- `DELETE /api/files/{file_id}` - 删除文件

#### 甘特图
- `GET /api/gantt` - 获取甘特图数据

完整API文档请访问: `/docs` 端点

## 🎯 使用指南

### 1. 创建团队
1. 访问"Teams"页面
2. 点击"New Team"按钮
3. 填写团队名称和描述
4. 添加团队成员

### 2. 创建项目
1. 访问"Projects"页面
2. 点击"New Project"按钮
3. 填写项目信息并选择团队
4. 设置项目时间线

### 3. 管理任务
1. 访问"Tasks"页面
2. 创建任务并分配给团队成员
3. 设置任务优先级和截止日期
4. 跟踪任务进度

### 4. 查看甘特图
1. 访问"Gantt Chart"页面
2. 使用过滤器查看特定项目/团队的任务
3. 可视化项目时间线和依赖关系

### 5. 文件管理
1. 访问"Files"页面
2. 上传项目相关文件
3. 为文件添加评论
4. 管理文件权限

## 🔧 配置说明

### 环境变量

#### 前端 (.env)
```
VITE_API_URL=http://localhost:8000  # 后端API地址
```

#### 后端
```
# 当前使用内存数据库，生产环境建议配置:
DATABASE_URL=postgresql://...  # 数据库连接
JWT_SECRET=your-secret-key     # JWT密钥
```

## 🚀 部署链接

### 生产环境
- **前端应用**: https://project-management-app-tedwx1xq.devinapps.com
- **后端API**: https://app-qtmxfjcr.fly.dev
- **API文档**: https://app-qtmxfjcr.fly.dev/docs

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 支持

如有问题或建议，请创建 Issue 或联系开发团队。

---

**开发者**: Devin AI  
**GitHub**: @Jeffrey9130  
**Devin运行链接**: https://app.devin.ai/sessions/340247620b2f4589a2aefab9a5e67c0e
