const WebSocket = require('ws');
const express = require('express');
const { screen, mouse, keyboard, Key } = require('@nut-tree-fork/nut-js');
const { chromium } = require('playwright');

const app = express();
const PORT = 8787;

// Store browser instance
let browser = null;
let page = null;

// WebSocket Server for commands
const wss = new WebSocket.Server({ port: 8788 });

console.log('🤖 JARVIS Helper starting...');

// Initialize browser
async function initBrowser() {
    try {
        browser = await chromium.launch({ 
            headless: false,
            args: [
                '--start-maximized',
                '--no-default-browser-check',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        const context = await browser.newContext();
        page = await context.newPage();
        
        // Bring to front immediately
        await page.bringToFront();
        
        console.log('✅ Browser initialized and visible');
    } catch (error) {
        console.error('❌ Browser init failed:', error.message);
    }
}

// Computer control functions
const commands = {
    // Application control
    async open_app(params) {
        const { name } = params;
        
        if (name.toLowerCase().includes('notepad')) {
            await keyboard.pressKey(Key.LeftWin, Key.R);
            await keyboard.releaseKey(Key.LeftWin, Key.R);
            await new Promise(resolve => setTimeout(resolve, 500));
            await keyboard.type('notepad');
            await keyboard.pressKey(Key.Enter);
            await keyboard.releaseKey(Key.Enter);
            return { success: true, message: `Opened ${name}` };
        }
        
        if (name.toLowerCase().includes('calculator')) {
            await keyboard.pressKey(Key.LeftWin, Key.R);
            await keyboard.releaseKey(Key.LeftWin, Key.R);
            await new Promise(resolve => setTimeout(resolve, 500));
            await keyboard.type('calc');
            await keyboard.pressKey(Key.Enter);
            await keyboard.releaseKey(Key.Enter);
            return { success: true, message: `Opened ${name}` };
        }
        
        return { success: false, message: `Don't know how to open ${name}` };
    },

    // Browser control
    async browser_goto(params) {
        const { url } = params;
        
        if (!page) await initBrowser();
        
        try {
            // Ensure URL has protocol
            let fullUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                fullUrl = 'https://' + url;
            }
            
            console.log(`🌐 Navigating to: ${fullUrl}`);
            await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            // Force window to front multiple ways
            await page.bringToFront();
            await page.evaluate(() => window.focus());
            
            // Use Windows API to force window to foreground
            const { execSync } = require('child_process');
            try {
                execSync('powershell -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\\"user32.dll\\\")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport(\\\"user32.dll\\\")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName); }\'; $chrome = [Win32]::FindWindow(\\\"Chrome_WidgetWin_1\\\", $null); if($chrome -ne [IntPtr]::Zero) { [Win32]::SetForegroundWindow($chrome) }"', { stdio: 'ignore' });
            } catch (e) {
                // Ignore if PowerShell command fails
            }
            
            return { success: true, message: `Navigated to ${fullUrl}` };
        } catch (error) {
            return { success: false, message: `Failed to navigate: ${error.message}` };
        }
    },

    async browser_search(params) {
        const { query } = params;
        
        if (!page) await initBrowser();
        
        try {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
            console.log(`🔍 Searching for: ${query}`);
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            // Force window to front multiple ways
            await page.bringToFront();
            await page.evaluate(() => window.focus());
            
            // Use Windows API to force window to foreground
            const { execSync } = require('child_process');
            try {
                execSync('powershell -Command "Add-Type -TypeDefinition \'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\\"user32.dll\\\")] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport(\\\"user32.dll\\\")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName); }\'; $chrome = [Win32]::FindWindow(\\\"Chrome_WidgetWin_1\\\", $null); if($chrome -ne [IntPtr]::Zero) { [Win32]::SetForegroundWindow($chrome) }"', { stdio: 'ignore' });
            } catch (e) {
                // Ignore if PowerShell command fails
            }
            
            return { success: true, message: `Searched for: ${query}` };
        } catch (error) {
            return { success: false, message: `Search failed: ${error.message}` };
        }
    },

    // Text input
    async type_text(params) {
        const { text } = params;
        
        try {
            await keyboard.type(text);
            return { success: true, message: `Typed: ${text}` };
        } catch (error) {
            return { success: false, message: `Typing failed: ${error.message}` };
        }
    },

    // Mouse control
    async click_center(params) {
        try {
            const screenSize = await screen.size();
            await mouse.setPosition({ x: screenSize.width / 2, y: screenSize.height / 2 });
            await mouse.leftClick();
            return { success: true, message: 'Clicked center of screen' };
        } catch (error) {
            return { success: false, message: `Click failed: ${error.message}` };
        }
    },

    // Screenshot
    async take_screenshot(params) {
        try {
            const screenshot = await screen.grab();
            
            // Save screenshot to Desktop with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `JARVIS-Screenshot-${timestamp}.png`;
            const desktopPath = require('path').join(require('os').homedir(), 'Desktop', filename);
            
            // Convert Image to buffer and save
            const fs = require('fs');
            const imageBuffer = screenshot.data; // Get the buffer from the Image object
            await fs.promises.writeFile(desktopPath, imageBuffer);
            
            return { 
                success: true, 
                message: `Screenshot saved to Desktop as ${filename}`,
                path: desktopPath
            };
        } catch (error) {
            return { success: false, message: `Screenshot failed: ${error.message}` };
        }
    }
};

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔗 JARVIS Helper connected');

    ws.on('message', async (data) => {
        try {
            const command = JSON.parse(data);
            console.log('📨 Command received:', command.cmd);

            const handler = commands[command.cmd];
            if (handler) {
                const result = await handler(command.params || {});
                ws.send(JSON.stringify(result));
            } else {
                ws.send(JSON.stringify({
                    success: false,
                    message: `Unknown command: ${command.cmd}`
                }));
            }
        } catch (error) {
            console.error('❌ Command error:', error);
            ws.send(JSON.stringify({
                success: false,
                message: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('🔌 JARVIS Helper disconnected');
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'JARVIS Helper running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🌐 JARVIS Helper HTTP server running on port ${PORT}`);
    console.log(`🔌 JARVIS Helper WebSocket server running on port 8788`);
});

// Initialize browser on startup
initBrowser();