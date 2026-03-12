const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, globalShortcut, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let hideShortcut = null;
let showShortcut = null;

// 创建托盘图标（使用内置图标）
function createTray() {
  // 创建一个简单的图标
  const icon = nativeImage.createEmpty();

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // 单击托盘图标切换显示/隐藏
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    frame: false,          // 无边框
    transparent: true,     // 透明窗口
    alwaysOnTop: false,     // 不默认置顶
    resizable: true,       // 可调整大小
    skipTaskbar: true,     // 不在任务栏显示
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // 关闭时隐藏到托盘而不是退出
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // 创建系统托盘
  createTray();
}

// IPC 处理
ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});

ipcMain.on('hide-window', () => {
  mainWindow.hide();
});

ipcMain.on('show-window', () => {
  mainWindow.show();
});

ipcMain.on('set-always-on-top', (event, alwaysOnTop) => {
  mainWindow.setAlwaysOnTop(alwaysOnTop);
});

ipcMain.on('register-shortcut', (event, { hideKey, showKey }) => {
  // 注销旧快捷键
  if (hideShortcut) {
    globalShortcut.unregister(hideShortcut);
  }
  if (showShortcut) {
    globalShortcut.unregister(showShortcut);
  }

  // 注册新快捷键
  try {
    hideShortcut = hideKey;
    showShortcut = showKey;

    globalShortcut.register(hideKey, () => {
      mainWindow.hide();
    });

    globalShortcut.register(showKey, () => {
      mainWindow.show();
    });

    event.reply('shortcut-registered', { success: true });
  } catch (error) {
    event.reply('shortcut-registered', { success: false, error: error.message });
  }
});

ipcMain.on('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      mainWindow.webContents.send('file-loaded', { content, fileName: path.basename(filePath) });
    } catch (error) {
      mainWindow.webContents.send('file-error', { error: error.message });
    }
  }
});

// 导入书源
ipcMain.on('import-book-source', async (event) => {
  try {
    console.log('收到导入书源请求');
    
    // 临时方案:直接读取桌面上的书源文件
    const desktopPath = 'C:\\Users\\QYT-099\\Desktop\\阿源书源-小黑网络素材书源.txt';
    
    try {
      const content = fs.readFileSync(desktopPath, 'utf-8');
      const sources = JSON.parse(content);
      
      if (!Array.isArray(sources)) {
        throw new Error('书源格式错误：应为数组格式');
      }

      console.log('成功解析书源,数量:', sources.length);
      mainWindow.webContents.send('book-source-imported', { sources });
      return;
    } catch (error) {
      console.error('直接读取书源失败:', error);
    }
    
    // 如果直接读取失败,尝试打开文件选择对话框
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    console.log('文件选择结果:', result);

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      console.log('选择的文件:', filePath);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const sources = JSON.parse(content);
        
        if (!Array.isArray(sources)) {
          throw new Error('书源格式错误：应为数组格式');
        }

        console.log('成功解析书源,数量:', sources.length);
        mainWindow.webContents.send('book-source-imported', { sources });
      } catch (error) {
        console.error('解析书源失败:', error);
        mainWindow.webContents.send('book-source-imported', { error: error.message });
      }
    } else {
      console.log('用户取消了文件选择');
    }
  } catch (error) {
    console.error('打开文件对话框失败:', error);
    mainWindow.webContents.send('book-source-imported', { error: error.message });
  }
});

// 搜索小说
ipcMain.on('search-books', async (event, { source, keyword }) => {
  try {
    const results = await searchBooks(source, keyword);
    mainWindow.webContents.send('search-results', { results });
  } catch (error) {
    mainWindow.webContents.send('search-results', { error: error.message });
  }
});

// 获取章节列表
ipcMain.on('get-chapters', async (event, { source, book }) => {
  try {
    const chapters = await getChapters(source, book);
    mainWindow.webContents.send('chapters-loaded', { chapters });
  } catch (error) {
    mainWindow.webContents.send('chapters-loaded', { error: error.message });
  }
});

// 获取章节内容
ipcMain.on('get-chapter-content', async (event, { source, book, chapter }) => {
  try {
    const content = await getChapterContent(source, book, chapter);
    mainWindow.webContents.send('chapter-content-loaded', { content });
  } catch (error) {
    mainWindow.webContents.send('chapter-content-loaded', { error: error.message });
  }
});

// 缓存小说为TXT
ipcMain.on('cache-book-to-txt', async (event, { book, chapters }) => {
  try {
    const saveResult = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${book.name}.txt`,
      filters: [
        { name: 'Text Files', extensions: ['txt'] }
      ]
    });

    if (saveResult.canceled) {
      mainWindow.webContents.send('cache-completed', { success: false, error: '用户取消保存' });
      return;
    }

    let content = `${book.name}\n\n`;
    
    for (const chapter of chapters) {
      content += `\n${'='.repeat(50)}\n`;
      content += `${chapter.title}\n`;
      content += `${'='.repeat(50)}\n\n`;
      
      // 获取章节内容
      try {
        const chapterContent = await getChapterContent(null, book, chapter);
        content += chapterContent + '\n';
      } catch (error) {
        content += `[获取失败: ${error.message}]\n`;
      }
      
      // 进度提示
      mainWindow.webContents.send('cache-completed', { 
        success: false, 
        error: `缓存中... ${chapters.indexOf(chapter) + 1}/${chapters.length}` 
      });
    }

    fs.writeFileSync(saveResult.filePath, content, 'utf-8');
    mainWindow.webContents.send('cache-completed', { success: true, filePath: saveResult.filePath });
  } catch (error) {
    mainWindow.webContents.send('cache-completed', { success: false, error: error.message });
  }
});

// 应用启动时创建窗口
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前设置标志
app.on('before-quit', () => {
  app.isQuiting = true;
});

// 应用退出时注销快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ===== 书源功能相关函数 =====

// 网络请求函数
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    request.on('response', (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      response.on('end', () => {
        try {
          resolve(data);
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      });
    });
    request.on('error', (error) => {
      reject(error);
    });
    request.end();
  });
}

// 替换URL模板中的变量
function replaceUrlTemplate(template, key, page = 1) {
  let url = template;
  url = url.replace(/\{\{key\}\}/g, encodeURIComponent(key));
  url = url.replace(/\{\{(page-1)\*\d+\}\}/g, (page - 1) * 10);
  url = url.replace(/\{\{page\}\}/g, page);
  return url;
}

// 解析JSONPath（简化版）
function parseJsonPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (part.startsWith('$')) {
      continue;
    }
    
    if (part.includes('[') && part.includes(']')) {
      const [base, arrayPart] = part.split('[');
      const index = parseInt(arrayPart.replace(']', ''));
      if (Array.isArray(current[base]) && !isNaN(index)) {
        current = current[base][index];
      } else if (arrayPart.includes('*')) {
        current = current[base] || [];
        break;
      }
    } else if (part === '*') {
      if (Array.isArray(current)) {
        break;
      }
    } else {
      current = current[part];
    }
    
    if (current === undefined || current === null) {
      return null;
    }
  }
  
  return current;
}

// 搜索小说
async function searchBooks(source, keyword) {
  try {
    const searchUrl = replaceUrlTemplate(source.ruleSearch.searchUrl || source.searchUrl, keyword);
    const data = await httpGet(searchUrl);
    const json = JSON.parse(data);
    
    const bookListPath = source.ruleSearch.bookList;
    const results = parseJsonPath(json, bookListPath);
    
    if (!Array.isArray(results)) {
      throw new Error('搜索结果格式错误');
    }
    
    const books = [];
    for (const item of results) {
      if (!item) continue;
      
      const name = parseJsonPath(item, source.ruleSearch.name) || item.book_name || item.name;
      const author = parseJsonPath(item, source.ruleSearch.author) || item.author;
      const intro = parseJsonPath(item, source.ruleSearch.intro) || item.abstract || item.introduction;
      const kind = parseJsonPath(item, source.ruleSearch.kind) || item.category;
      const bookId = parseJsonPath(item, '$.book_id') || item.book_id;
      
      if (name) {
        books.push({
          name,
          author,
          intro,
          kind,
          bookId,
          bookUrl: source.ruleSearch.bookUrl ? 
                   replaceUrlTemplate(source.ruleSearch.bookUrl.replace(/\{\{.*?book_id.*?\}\}/g, bookId), keyword) :
                   source.bookSourceUrl,
          sourceUrl: source.bookSourceUrl
        });
      }
    }
    
    return books;
  } catch (error) {
    throw new Error(`搜索失败: ${error.message}`);
  }
}

// 获取章节列表
async function getChapters(source, book) {
  try {
    const bookUrl = book.bookUrl || book.book_url;
    const data = await httpGet(bookUrl);
    const json = JSON.parse(data);
    
    const chapterListPath = source.ruleToc.chapterList;
    const chapterList = parseJsonPath(json, chapterListPath);
    
    if (!Array.isArray(chapterList)) {
      throw new Error('章节列表格式错误');
    }
    
    const chapters = [];
    for (const item of chapterList) {
      if (!item) continue;
      
      const title = parseJsonPath(item, source.ruleToc.chapterName) || item.title || item.chapter_name;
      const itemId = parseJsonPath(item, '$.item_id') || item.item_id;
      const chapterUrl = source.ruleToc.chapterUrl ?
                        replaceUrlTemplate(source.ruleToc.chapterUrl.replace(/\{\{.*?item_id.*?\}\}/g, itemId), '') :
                        parseJsonPath(item, source.ruleToc.chapterName);
      
      if (title) {
        chapters.push({
          title,
          url: chapterUrl,
          itemId
        });
      }
    }
    
    return chapters;
  } catch (error) {
    throw new Error(`获取章节失败: ${error.message}`);
  }
}

// 获取章节内容
async function getChapterContent(source, book, chapter) {
  try {
    const chapterUrl = chapter.url;
    const data = await httpGet(chapterUrl);
    
    // 尝试解析JSON
    try {
      const json = JSON.parse(data);
      const contentPath = source?.ruleContent?.content || '$.data.content';
      const content = parseJsonPath(json, contentPath);
      
      if (content) {
        return content;
      }
    } catch (e) {
      // 不是JSON，尝试解析HTML
    }
    
    // 如果是HTML，提取文本内容
    const content = data.replace(/<[^>]+>/g, '\n')
                         .replace(/\n\s*\n/g, '\n\n')
                         .trim();
    
    return content;
  } catch (error) {
    throw new Error(`获取章节内容失败: ${error.message}`);
  }
}
