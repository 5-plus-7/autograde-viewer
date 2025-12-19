# 快速开始指南

## 5分钟上手使用

### 步骤1: 安装依赖

```bash
cd autograde_test
npm install
```

### 步骤2: 启动开发服务器

```bash
npm run dev
```

浏览器将自动打开 `http://localhost:3000`

### 步骤3: 测试应用

1. 在输入框中输入任意数字ID（例如：`123`）
2. 点击"查看批改结果"按钮
3. 应用会加载示例数据（`example.json`）
4. 自动显示题目图片和批改标记

### 步骤4: 查看批改结果

- **画布区域**：显示题目图片和标记
  - ✅ 绿色对勾 = 答对了
  - ❌ 红色圆圈 = 答错了

- **底部面板**：显示详细的批改信息
  - 题目编号和类型
  - 正确/错误状态
  - 错误分析和建议

- **顶部导航**：
  - 左上角"返回"按钮：返回首页
  - 中间导航：切换不同页面的题目
  - 右上角统计：显示正确和错误题数

## 功能说明

### 多页面切换

如果作业有多页，使用顶部的 ◀️ ▶️ 按钮切换页面。

### 移动端使用

应用已完全适配移动端，可以在手机或平板上正常使用。

### 放大缩小

在Excalidraw画布中：
- **鼠标滚轮**：缩放画布
- **拖动**：平移画布
- **双击**：重置视图
- **手指捏合**（移动端）：缩放

## 接入飞书数据

### 方式1: 本地测试（已配置）

应用默认使用 `public/example.json` 作为测试数据，可以直接使用。

### 方式2: 使用真实飞书数据

1. **获取飞书配置信息**
   - 参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的"飞书配置"章节
   - 获取 App ID, App Secret, App Token, Table ID

2. **修改API配置**
   - 编辑 `src/utils/feishuAPI.js`
   - 填入真实的配置信息

3. **更新数据获取逻辑**
   - 编辑 `src/App.jsx`
   - 将以下代码：
   ```javascript
   const response = await fetch('/example.json')
   ```
   
   替换为：
   ```javascript
   import { fetchGradingData } from './utils/feishuAPI'
   const data = await fetchGradingData(recordId)
   ```

4. **重启应用**
   ```bash
   npm run dev
   ```

## 自定义配置

### 修改标记样式

编辑 `src/components/ViewerPage.jsx`：

```javascript
// 修改对勾颜色（默认绿色 #22c55e）
strokeColor: '#00ff00',

// 修改圆圈颜色（默认红色 #ef4444）
strokeColor: '#ff0000',

// 修改标记大小
const checkSize = 40  // 对勾大小
const radius = 30     // 圆圈半径
```

### 修改UI颜色主题

编辑 `src/components/InputPage.css` 和 `src/App.css`：

```css
/* 修改主题色（默认紫色渐变）*/
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 改为蓝色渐变 */
background: linear-gradient(135deg, #667eea 0%, #0ea5e9 100%);

/* 改为绿色渐变 */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
```

## JSON数据格式说明

应用期望的JSON格式：

```json
[
  {
    "image_url": "https://example.com/image.png",
    "questions_info": [
      {
        "question_number": "1",
        "question_type": "选择题",
        "answer_steps": [
          {
            "is_correct": true,
            "analysis": "回答正确...",
            "answer_location": [100, 200, 300, 400]
          }
        ]
      }
    ]
  }
]
```

**关键字段说明：**
- `image_url`: 题目图片的URL
- `answer_location`: 答案位置 [x1, y1, x2, y2]，坐标相对于图片左上角
- `is_correct`: 是否正确 (true/false)
- `analysis`: 批改分析文字

## 常见问题

### Q: 图片无法显示？

**A:** 检查以下几点：
1. 图片URL是否正确
2. 图片是否可以公开访问
3. 浏览器控制台是否有CORS错误
4. 如果有CORS问题，可以使用图片代理服务

### Q: 标记位置不准确？

**A:** 检查JSON中的 `answer_location` 坐标是否正确：
- 坐标应该相对于图片的左上角 (0, 0)
- 格式：[x1, y1, x2, y2]，表示矩形区域
- 单位：像素

### Q: 如何调试？

**A:** 打开浏览器开发者工具（F12）：
- **Console标签**：查看错误日志
- **Network标签**：查看网络请求
- **Elements标签**：检查DOM结构

### Q: 移动端显示异常？

**A:** 确保：
1. viewport设置正确（已在index.html中配置）
2. 使用现代浏览器（Chrome, Safari, Edge）
3. 清除浏览器缓存后重试

## 性能优化建议

1. **图片优化**
   - 使用CDN存储图片
   - 压缩图片大小
   - 使用WebP格式

2. **加载速度**
   - 启用gzip压缩
   - 使用CDN加速
   - 懒加载非关键资源

3. **用户体验**
   - 添加loading动画
   - 优化交互反馈
   - 提供离线支持

## 下一步

- 📖 查看完整文档：[README.md](./README.md)
- 🚀 学习部署流程：[DEPLOYMENT.md](./DEPLOYMENT.md)
- 💡 自定义开发：修改源代码以满足特定需求

## 技术支持

遇到问题？
1. 查看项目文档
2. 检查浏览器控制台
3. 提交GitHub Issue

---

Happy Coding! 🎉

