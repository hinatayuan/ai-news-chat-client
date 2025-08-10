# AI News Chat Client

一个基于 React + TypeScript 的现代化 AI 新闻聊天客户端，连接到部署在 Cloudflare Workers 上的 Mastra AI Agent，提供智能新闻摘要和深度分析服务。

## ✨ 功能特性

🤖 **智能对话** - 基于 DeepSeek AI 的自然语言对话  
📰 **实时新闻** - 获取最新新闻摘要和分析  
🏷️ **智能分类** - 自动分类新闻类型和重要程度  
📊 **情感分析** - 分析新闻情感倾向  
🔍 **关键词提取** - 提取新闻关键信息  
💡 **个性化推荐** - 根据对话提供相关建议  
⚡ **实时连接** - 连接状态监控和错误处理  

## 🏗️ 技术架构

```
┌─────────────────────┐    HTTP/REST API    ┌─────────────────────┐
│                     │ ──────────────────> │                     │
│  React Client       │                     │  Mastra Workers     │
│  (此项目)            │ <────────────────── │  (Cloudflare)       │
│                     │    JSON Response    │                     │
└─────────────────────┘                     └─────────────────────┘
                                                       │
                                                       │ API Calls
                                                       ▼
                                             ┌─────────────────────┐
                                             │   DeepSeek API      │
                                             │   (AI Analysis)     │
                                             └─────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js 18.0+
- npm 或 yarn
- 现代浏览器

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/hinatayuan/ai-news-chat-client.git
cd ai-news-chat-client

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

访问 http://localhost:3000 即可使用。

## 🔗 连接到 Mastra Workers

项目默认连接到：`https://mastra-agent.liuweiyuan0713.workers.dev`

如果你想连接到自己的 Mastra Workers 实例，修改 `src/services/MastraClient.ts` 中的 `MASTRA_API_BASE` 常量。

## 📱 使用示例

### 基础对话
```
用户：今天有什么科技新闻？
AI：为你找到了 5 条科技领域最新新闻：
[显示新闻卡片列表]
```

### 详细分析
```
用户：分析一下AI领域的最新动态
AI：AI领域新闻分析报告：
📊 统计概览：
• 共分析 8 篇文章
• 涉及类别：Technology、Business
• 情感分布：Positive: 5篇，Neutral: 3篇
...
```

### 支持的问题类型
- "今天有什么重要新闻？"
- "科技领域最新动态"  
- "给我分析一下商业新闻"
- "有什么关于AI的消息吗？"
- "健康相关的新闻摘要"

## 🛠️ 项目结构

```
src/
├── components/           # React 组件
│   ├── NewsChatBox.tsx  # 主聊天界面
│   └── NewsCard.tsx     # 新闻卡片组件
├── services/            # 服务层
│   └── MastraClient.ts  # Mastra API 客户端
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 🎨 界面预览

### 主界面
- 现代化渐变背景设计
- 响应式布局，支持桌面和移动端
- 实时连接状态显示
- 侧边栏功能介绍和 API 信息

### 聊天界面
- 类似现代聊天应用的对话气泡
- Markdown 支持，代码高亮
- 新闻卡片展示，包含完整元信息
- 建议问题快速选择
- 输入状态和错误处理

### 新闻卡片
- 分类标签和重要程度标识
- 情感分析指示器
- 关键词标签
- 一键跳转到原文
- 时间距离显示

## ⚙️ 配置选项

### MastraClient 配置

```typescript
export class MastraClient {
  constructor(baseUrl: string = MASTRA_API_BASE) {
    this.baseUrl = baseUrl;
  }
}
```

### 自定义 API 端点

```typescript
// 修改 src/services/MastraClient.ts
const MASTRA_API_BASE = 'https://your-mastra-worker.workers.dev';
```

## 📊 API 接口

### 健康检查
```bash
GET /health
```

### 快速新闻
```bash
GET /api/news?category=technology&maxArticles=5
```

### 详细分析
```bash
POST /api/summarize
Content-Type: application/json

{
  "category": "AI",
  "maxArticles": 10,
  "summaryLength": "medium",
  "focusAreas": ["machine learning", "startups"]
}
```

## 🔧 开发指南

### 添加新的对话意图

1. 在 `MastraClient.ts` 的 `analyzeUserIntent` 方法中添加新的意图检测
2. 在 `chatWithNews` 方法中添加对应的处理逻辑
3. 更新建议问题生成逻辑

### 自定义新闻卡片样式

修改 `NewsCard.tsx` 组件，支持：
- 自定义颜色主题
- 不同显示模式（紧凑/详细）
- 自定义元信息显示

### 添加新的 UI 组件

使用 Tailwind CSS 类名进行样式设置，遵循现有的设计系统：
- 主色调：蓝色到紫色渐变
- 圆角：xl (12px)
- 间距：一致的 4px 网格系统

## 🚀 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Netlify 部署

```bash
# 构建
npm run build

# 上传 dist 目录到 Netlify
```

### GitHub Pages

```bash
# 安装 gh-pages
npm install -g gh-pages

# 部署
npm run build
gh-pages -d dist
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 更新日志

### v1.0.0 (2025-08-10)
- ✨ 初始版本发布
- 🎨 完整的聊天界面设计
- 🔗 Mastra Workers API 集成
- 📱 响应式设计支持
- 🤖 智能对话和新闻分析

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- **Mastra Workers API**: https://mastra-agent.liuweiyuan0713.workers.dev
- **API 文档**: https://mastra-agent.liuweiyuan0713.workers.dev/api/docs
- **Mastra 框架**: https://mastra.ai
- **DeepSeek AI**: https://deepseek.com
- **原始聊天框项目**: https://github.com/hinatayuan/ai-chat-box

## 👨‍💻 作者

**HinataYuan** - [@hinatayuan](https://github.com/hinatayuan)

## 🙏 致谢

- [Mastra AI](https://mastra.ai) - 提供强大的 TypeScript AI 框架
- [DeepSeek](https://deepseek.com) - 提供高性能 AI 模型
- [Cloudflare Workers](https://workers.cloudflare.com) - 提供边缘计算平台
- [React](https://reactjs.org) 和 [TypeScript](https://typescriptlang.org) 生态系统

---

**开始使用：** `npm run dev` 🚀  
**立即体验：** [在线演示](https://your-demo-url.com) ✨
