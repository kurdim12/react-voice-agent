import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Time and date functions
export async function getCurrentTime(): Promise<string> {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  return `It's currently ${timeString} on ${dateString}`;
}

export async function getSystemInfo(): Promise<string> {
  try {
    const { stdout } = await execAsync('systeminfo | findstr "OS"');
    return `System information: ${stdout.trim()}`;
  } catch (error) {
    return `Unable to retrieve system information: ${error}`;
  }
}

// Application control functions
export async function openApplication(appName: string): Promise<string> {
  const appMappings: Record<string, string> = {
    'calculator': 'calc',
    'calc': 'calc',
    'notepad': 'notepad',
    'paint': 'mspaint',
    'file explorer': 'explorer',
    'explorer': 'explorer',
    'task manager': 'taskmgr',
    'taskmgr': 'taskmgr',
    'control panel': 'control',
    'cmd': 'cmd',
    'command prompt': 'cmd',
    'powershell': 'powershell',
  };

  const command = appMappings[appName.toLowerCase()] || appName;

  try {
    await execAsync(`start ${command}`);
    return `✅ Opened ${appName}`;
  } catch (error) {
    return `❌ Failed to open ${appName}: ${error}`;
  }
}

// Browser and website functions
export async function openWebsite(urlOrName: string): Promise<string> {
  const websites: Record<string, string> = {
    "google": "https://www.google.com",
    "youtube": "https://www.youtube.com",
    "github": "https://www.github.com", 
    "chatgpt": "https://chat.openai.com",
    "openai": "https://chat.openai.com",
    "gmail": "https://mail.google.com",
    "twitter": "https://twitter.com",
    "x": "https://x.com",
    "facebook": "https://facebook.com",
    "linkedin": "https://linkedin.com",
    "reddit": "https://reddit.com",
    "stackoverflow": "https://stackoverflow.com",
    "amazon": "https://amazon.com",
    "netflix": "https://netflix.com"
  };
  
  let url: string;
  let siteName: string;
  
  if (urlOrName.toLowerCase() in websites) {
    url = websites[urlOrName.toLowerCase()];
    siteName = urlOrName.charAt(0).toUpperCase() + urlOrName.slice(1);
  } else if (urlOrName.startsWith('http://') || urlOrName.startsWith('https://') || urlOrName.startsWith('www.')) {
    url = urlOrName.startsWith('www.') ? `https://${urlOrName}` : urlOrName;
    siteName = urlOrName;
  } else {
    url = `https://www.google.com/search?q=${encodeURIComponent(urlOrName)}`;
    siteName = `Google search for '${urlOrName}'`;
  }
  
  try {
    await execAsync(`start "" "${url}"`);
    return `✅ Opened ${siteName}`;
  } catch (error) {
    try {
      await execAsync(`cmd /c start "${url}"`);
      return `✅ Opened ${siteName} via system command`;
    } catch (error2) {
      return `❌ Failed to open ${siteName}. Error: ${error2}`;
    }
  }
}

export async function searchGoogle(query: string): Promise<string> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await execAsync(`start "" "${searchUrl}"`);
    return `✅ Searching Google for: ${query}`;
  } catch (error) {
    return `❌ Failed to search Google: ${error}`;
  }
}

export async function openChrome(): Promise<string> {
  const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.USERPROFILE}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
  ];
  
  for (const chromePath of chromePaths) {
    try {
      await execAsync(`"${chromePath}"`);
      return "✅ Opened Google Chrome";
    } catch (error) {
      continue;
    }
  }
  
  try {
    await execAsync('start chrome');
    return "✅ Opened Chrome via start command";
  } catch (error) {
    return "❌ Google Chrome not found on this system";
  }
}

// File and folder functions
export async function createFile(filename: string, content: string = ""): Promise<string> {
  try {
    await execAsync(`echo "${content}" > "${filename}"`);
    return `✅ Created file: ${filename}`;
  } catch (error) {
    return `❌ Failed to create file: ${error}`;
  }
}

export async function createFolder(folderName: string): Promise<string> {
  try {
    await execAsync(`mkdir "${folderName}"`);
    return `✅ Created folder: ${folderName}`;
  } catch (error) {
    return `❌ Failed to create folder: ${error}`;
  }
}

// System control functions
export async function shutdownSystem(minutes: number = 0): Promise<string> {
  try {
    if (minutes === 0) {
      await execAsync('shutdown /s /t 0');
      return "✅ System is shutting down now";
    } else {
      await execAsync(`shutdown /s /t ${minutes * 60}`);
      return `✅ System will shutdown in ${minutes} minutes`;
    }
  } catch (error) {
    return `❌ Failed to shutdown system: ${error}`;
  }
}

export async function restartSystem(minutes: number = 0): Promise<string> {
  try {
    if (minutes === 0) {
      await execAsync('shutdown /r /t 0');
      return "✅ System is restarting now";
    } else {
      await execAsync(`shutdown /r /t ${minutes * 60}`);
      return `✅ System will restart in ${minutes} minutes`;
    }
  } catch (error) {
    return `❌ Failed to restart system: ${error}`;
  }
}

export async function cancelShutdown(): Promise<string> {
  try {
    await execAsync('shutdown /a');
    return "✅ Shutdown/restart cancelled";
  } catch (error) {
    return `❌ Failed to cancel shutdown: ${error}`;
  }
}

// Volume control
export async function setVolume(level: number): Promise<string> {
  // Clamp volume between 0 and 100
  const volume = Math.max(0, Math.min(100, level));
  
  try {
    // Using nircmd (if available) or PowerShell as fallback
    await execAsync(`powershell -Command "(New-Object -comObject WScript.Shell).SendKeys([char]175)"`);
    return `✅ Attempting to set volume to ${volume}%`;
  } catch (error) {
    return `❌ Failed to control volume: ${error}`;
  }
}

// Tool definitions for the LLM
export function getAllTools() {
  return [
    {
      type: "function",
      function: {
        name: "get_current_time",
        description: "Get the current time and date",
        parameters: { type: "object", properties: {} }
      }
    },
    {
      type: "function",
      function: {
        name: "get_system_info",
        description: "Get basic system information",
        parameters: { type: "object", properties: {} }
      }
    },
    {
      type: "function",
      function: {
        name: "open_application",
        description: "Open a Windows application (calculator, notepad, paint, etc.)",
        parameters: {
          type: "object",
          properties: {
            app_name: { type: "string", description: "Name of the application to open" }
          },
          required: ["app_name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "open_website",
        description: "Open a website or web application. Use for Google, YouTube, or any website.",
        parameters: {
          type: "object",
          properties: {
            url_or_name: { type: "string", description: "Website name (google, youtube) or URL" }
          },
          required: ["url_or_name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "search_google",
        description: "Search Google for a specific query",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" }
          },
          required: ["query"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "open_chrome",
        description: "Open Google Chrome browser",
        parameters: { type: "object", properties: {} }
      }
    },
    {
      type: "function",
      function: {
        name: "create_file",
        description: "Create a new file with optional content",
        parameters: {
          type: "object",
          properties: {
            filename: { type: "string", description: "Name of the file to create" },
            content: { type: "string", description: "Content to write to the file" }
          },
          required: ["filename"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "create_folder",
        description: "Create a new folder",
        parameters: {
          type: "object",
          properties: {
            folder_name: { type: "string", description: "Name of the folder to create" }
          },
          required: ["folder_name"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "shutdown_system",
        description: "Shutdown the computer (use with caution)",
        parameters: {
          type: "object",
          properties: {
            minutes: { type: "number", description: "Minutes to wait before shutdown (0 = now)" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "restart_system",
        description: "Restart the computer (use with caution)",
        parameters: {
          type: "object",
          properties: {
            minutes: { type: "number", description: "Minutes to wait before restart (0 = now)" }
          }
        }
      }
    },
    {
      type: "function",
      function: {
        name: "cancel_shutdown",
        description: "Cancel a pending shutdown or restart",
        parameters: { type: "object", properties: {} }
      }
    },
    {
      type: "function",
      function: {
        name: "set_volume",
        description: "Set the system volume level",
        parameters: {
          type: "object",
          properties: {
            level: { type: "number", description: "Volume level (0-100)" }
          },
          required: ["level"]
        }
      }
    }
  ];
}

// Tool execution mapping
const toolFunctions: Record<string, Function> = {
  "get_current_time": getCurrentTime,
  "get_system_info": getSystemInfo,
  "open_application": (args: any) => openApplication(args.app_name),
  "open_website": (args: any) => openWebsite(args.url_or_name),
  "search_google": (args: any) => searchGoogle(args.query),
  "open_chrome": openChrome,
  "create_file": (args: any) => createFile(args.filename, args.content),
  "create_folder": (args: any) => createFolder(args.folder_name),
  "shutdown_system": (args: any) => shutdownSystem(args.minutes || 0),
  "restart_system": (args: any) => restartSystem(args.minutes || 0),
  "cancel_shutdown": cancelShutdown,
  "set_volume": (args: any) => setVolume(args.level)
};

// Make sure executeToolCall is exported
export async function executeToolCall(toolName: string, args: any): Promise<string> {
  const toolFunction = toolFunctions[toolName];
  
  if (!toolFunction) {
    return `❌ Unknown tool: ${toolName}`;
  }
  
  try {
    const result = await toolFunction(args);
    return result;
  } catch (error: any) {
    return `❌ Error executing ${toolName}: ${error.message || error}`;
  }
}