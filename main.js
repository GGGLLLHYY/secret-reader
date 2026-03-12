const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, globalShortcut, dialog } = require('electron');
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
