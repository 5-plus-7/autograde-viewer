# 作业批改查看器

基于 Excalidraw 的作业批改结果展示应用，支持移动端访问。

## 功能特性

- ✅ 通过记录ID查询批改结果
- ✅ 在 Excalidraw 画布中显示题目图片
- ✅ 自动标记正确/错误题目（红色对勾/圆圈）
- ✅ 支持多页面切换
- ✅ 显示详细的批改信息和分析
- ✅ 完全适配移动端

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite
- **画布工具**: Excalidraw
- **数据源**: 飞书多维表格

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn install
```

### 2. 配置飞书API

编辑 `src/utils/feishuAPI.js` 文件，填入您的飞书应用信息：

```javascript
const FEISHU_CONFIG = {
  appId: 'YOUR_APP_ID',           // 飞书应用ID
  appSecret: 'YOUR_APP_SECRET',   // 飞书应用Secret
  appToken: 'YOUR_APP_TOKEN',     // 多维表格app_token
  tableId: 'YOUR_TABLE_ID',       // 表格ID
  jsonColumnName: '自动批改结果json链接', // JSON列名
}
```

#### 获取飞书配置信息：

1. **创建飞书应用**
   - 访问 [飞书开放平台](https://open.feishu.cn/)
   - 创建企业自建应用
   - 获取 App ID 和 App Secret

2. **获取多维表格信息**
   - 打开多维表格
   - URL格式：`https://xxx.feishu.cn/base/{appToken}?table={tableId}`
   - 提取 `appToken` 和 `tableId`

3. **配置权限**
   - 在应用管理后台添加权限：
     - `bitable:app` (读取多维表格)
   - 将应用添加到对应的多维表格

### 3. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

应用将在 `http://localhost:3000` 启动

### 4. 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建产物将生成在 `dist` 目录

## 项目结构

```
autograde_test/
├── public/              # 静态资源
├── src/
│   ├── components/      # React组件
│   │   ├── InputPage.jsx      # 输入页面
│   │   ├── InputPage.css
│   │   ├── ViewerPage.jsx     # 查看器页面
│   │   └── ViewerPage.css
│   ├── utils/
│   │   └── feishuAPI.js       # 飞书API工具
│   ├── App.jsx          # 主应用组件
│   ├── App.css
│   ├── main.jsx         # 入口文件
│   └── index.css
├── example.json         # 示例数据
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 使用说明

### 1. 输入记录ID

在首页输入框中输入您的作业记录ID，点击"查看批改结果"按钮。

### 2. 查看批改结果

- 点击顶部"加载图片"按钮加载题目图片
- 画布会自动标记所有题目的正误：
  - ✓ 红色对勾 = 正确
  - ○ 红色圆圈 = 错误
- 底部面板显示详细的批改信息和分析

### 3. 多页面切换

如果有多页题目，使用顶部的导航按钮切换页面。

### 4. 返回首页

点击左上角"返回"按钮返回输入页面。

## JSON数据格式

应用支持以下JSON数据格式：

```json
[
  {
    "image_url": "图片URL",
    "markup_status": "completed",
    "page_type": "question_and_answer",
    "has_standard_answer": true,
    "questions_info": [
      {
        "question_number": "1",
        "question_type": "选择题",
        "question_text": "题目内容",
        "answer_steps": [
          {
            "step_id": 1,
            "student_answer": "A",
            "standard_answer": "B",
            "is_correct": false,
            "analysis": "解析内容",
            "answer_location": [x1, y1, x2, y2]
          }
        ]
      }
    ]
  }
]
```

## 注意事项

1. **CORS问题**：如果遇到跨域问题，需要配置服务器端的CORS策略或使用代理

2. **图片加载**：确保图片URL可以公开访问，建议使用CDN

3. **飞书权限**：确保应用有足够的权限访问多维表格数据

4. **移动端访问**：应用已优化移动端体验，建议使用现代浏览器访问

## 开发建议

### 本地测试

在开发阶段，可以使用本地的 `example.json` 文件进行测试。应用默认会从 `/example.json` 读取数据。

### 生产环境

在生产环境中，需要：
1. 配置正确的飞书API信息
2. 修改 `App.jsx` 中的数据获取逻辑，使用飞书API而非本地文件
3. 确保服务器配置了正确的CORS策略

## 常见问题

**Q: 为什么加载图片失败？**
A: 检查图片URL是否正确，是否可以公开访问，浏览器控制台是否有CORS错误。

**Q: 如何自定义标记样式？**
A: 修改 `ViewerPage.jsx` 中的 `updateCanvas` 函数，调整标记的颜色、大小等参数。

**Q: 支持哪些图片格式？**
A: 支持常见的图片格式：PNG, JPG, JPEG, GIF, WebP等。

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

