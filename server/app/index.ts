import { app, BrowserWindow, Menu, dialog } from 'electron';
import server from './server';

const port = ~~(Math.random() * 50000 + 10000);
server({ port: port }, () => {
    app.quit();
    process.exit(0);
}, (str: string) => {
    dialog.showErrorBox('MEP', str);
});

let mainWindow: null | BrowserWindow = null;

app.on('ready', () => {
    Menu.setApplicationMenu(null);
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        fullscreen: false,
        fullscreenable: true,
        alwaysOnTop: false,
        skipTaskbar: false,
        frame: true,
        webPreferences: {
            webSecurity: false,
            contextIsolation: true
        }
    });
    mainWindow.on('close', () => {
        app.quit();
        process.exit(0);
    });
    mainWindow.on('ready-to-show', () => {
        if (process.argv.indexOf('--app-debug') !== -1 && mainWindow) mainWindow.webContents.openDevTools();
    });
    mainWindow.loadURL('http://localhost:' + port);
});
