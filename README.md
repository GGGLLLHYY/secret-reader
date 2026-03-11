# 隐蔽小说阅读器

一个隐蔽的小说阅读器，适合工作时偷偷看小说。

## 功能特点

- ✅ **透明窗口** - 可调节窗口透明度（30%-100%）
- ✅ **系统托盘** - 点击关闭隐藏到托盘，托盘图标控制显示/隐藏
- ✅ **窗口置顶** - 一键置顶，方便边工作边看
- ✅ **无边框设计** - 界面简洁美观
- ✅ **快捷键** - Alt+H 快速隐藏
- ✅ **章节导航** - 支持上下章节切换

## 本地运行

### 1. 安装依赖

首先确保已安装 Node.js，然后运行：

```bash
npm install
```

### 2. 启动应用

```bash
npm start
```

## 在线打包成 EXE（纯小白教程）

### 方案：使用 GitHub Actions 自动打包

这是**最简单、完全免费**的方案，不需要任何本地配置！

#### 步骤 1：创建 GitHub 仓库

1. 访问 [GitHub](https://github.com) 并登录账号（如果没有就注册一个）
2. 点击右上角的 "+" 号，选择 "New repository"
3. 仓库名称填写：`secret-reader`（或你喜欢的名字）
4. 选择 "Public" 或 "Private" 都可以
5. 点击 "Create repository"

#### 步骤 2：上传代码

**方法 A（推荐 - 使用 GitHub Desktop）：**

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 用 GitHub Desktop 克隆刚才创建的仓库
3. 将本项目文件复制到克隆的文件夹中
4. 在 GitHub Desktop 中填写提交信息，点击 "Commit"
5. 点击 "Publish repository" 推送到 GitHub

**方法 B（使用命令行）：**

在项目目录下运行：

```bash
# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "初次提交"

# 添加远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/secret-reader.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 步骤 3：配置自动打包

项目已经配置好了自动打包功能，**代码上传后自动开始打包**！

等待约 10-20 分钟，打包完成后：

1. 进入你的 GitHub 仓库
2. 点击右侧的 "Actions" 标签
3. 点击左侧的 "Build and Release"
4. 等待构建完成（绿色对勾）
5. 点击构建记录，向下滚动找到 "Artifacts"
6. 下载 `secret-reader-setup-1.0.0.exe` 文件

#### 步骤 4：安装使用

1. 双击下载的 `.exe` 文件
2. 按提示安装
3. 桌面会出现"隐蔽小说阅读器"图标
4. 双击即可使用！

## 使用说明

### 基本操作

- **调节透明度**：拖动窗口上方的透明度滑块
- **隐藏窗口**：点击窗口控制栏的"◻"按钮，或点击右下角"快速隐藏"按钮
- **显示窗口**：在系统托盘（右下角）找到图标，单击显示
- **退出程序**：右键托盘图标，选择"退出"
- **切换章节**：点击底部的"上一章"/"下一章"按钮

### 快捷键

- `Alt + H`：快速隐藏窗口
- `Alt + S`：显示窗口

### 自定义小说内容

编辑 `index.html` 文件，找到 `chapters` 数组，修改其中的 `title`（章节标题）和 `content`（章节内容）。

```javascript
const chapters = [
    {
        title: "第一章 章节标题",
        content: `章节内容第一段。
        
章节内容第二段。`
    },
    // 添加更多章节...
];
```

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **HTML/CSS/JavaScript** - 前端技术
- **GitHub Actions** - 自动化构建和打包

## 注意事项

1. 打包需要等待 10-20 分钟，请耐心等待
2. 如果是 Windows 电脑，下载 Windows 版本即可
3. 首次安装可能会被杀毒软件拦截，选择"允许运行"即可
4. 托盘图标可能在隐藏区域（小箭头），点击展开即可看到

## 常见问题

**Q: 找不到托盘图标？**  
A: 在 Windows 右下角，点击小箭头（^）展开隐藏图标区域。

**Q: GitHub Actions 构建失败？**  
A: 检查代码是否正确上传，等待几分钟后重试。

**Q: 如何修改小说内容？**  
A: 编辑 `index.html` 中的 `chapters` 数组，然后重新上传代码触发打包。

**Q: 可以同时打包 Windows 和 Mac 版本吗？**  
A: 可以！修改 `.github/workflows/build.yml` 文件即可。

## 许可证

MIT License

---

**提示**：工作重要，适度娱乐哦！😉
