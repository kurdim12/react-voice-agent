import "dotenv/config";
import { type WebSocket } from "ws";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { serveStatic } from "@hono/node-server/serve-static";

import { OpenAIVoiceReactAgent } from "./lib/langchain_openai_voice.js";
import { JARVIS_PROMPT } from "./prompt.js";
import { getAllTools as getSystemTools, executeToolCall } from "./tools.js";
// Removed unused imports

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// JARVIS State Management
interface JarvisState {
  isAwake: boolean;
  isListening: boolean;
  wakeWordEnabled: boolean;
  safetyEnabled: boolean;
  mode: 'butler' | 'demo' | 'copilot' | 'companion';
}

const jarvisState: JarvisState = {
  isAwake: false,
  isListening: false,
  wakeWordEnabled: false,
  safetyEnabled: true,
  mode: 'butler'
};

app.use("/", serveStatic({ path: "./static/index.html" }));
app.use("/static/*", serveStatic({ root: "./" }));

// JARVIS State API
app.get("/api/jarvis/state", (c) => {
  return c.json(jarvisState);
});

app.post("/api/jarvis/wake", async (c) => {
  if (!jarvisState.safetyEnabled) {
    return c.json({ error: "Safety switch is engaged" }, 400);
  }
  
  jarvisState.isAwake = true;
  jarvisState.isListening = true;
  
  return c.json({ 
    message: "JARVIS is now awake", 
    state: jarvisState 
  });
});

app.post("/api/jarvis/sleep", async (c) => {
  jarvisState.isAwake = false;
  jarvisState.isListening = false;
  
  return c.json({ 
    message: "JARVIS is now sleeping", 
    state: jarvisState 
  });
});

app.post("/api/jarvis/toggle-wake-word", async (c) => {
  jarvisState.wakeWordEnabled = !jarvisState.wakeWordEnabled;
  
  if (!jarvisState.wakeWordEnabled) {
    jarvisState.isAwake = false;
    jarvisState.isListening = false;
  }
  
  return c.json({ 
    message: `Wake word ${jarvisState.wakeWordEnabled ? 'enabled' : 'disabled'}`, 
    state: jarvisState 
  });
});

app.post("/api/jarvis/toggle-safety", async (c) => {
  jarvisState.safetyEnabled = !jarvisState.safetyEnabled;
  
  if (!jarvisState.safetyEnabled) {
    jarvisState.isAwake = false;
    jarvisState.isListening = false;
  }
  
  return c.json({ 
    message: `Safety ${jarvisState.safetyEnabled ? 'enabled' : 'disabled'}`, 
    state: jarvisState 
  });
});

// Tool testing endpoint
app.post("/api/test-tool", async (c) => {
  try {
    const result = await executeToolCall('get_current_time', {});
    return c.json({ 
      status: 'Tools integration working!', 
      test_result: result,
      available_tools: getSystemTools().length
    });
  } catch (error: any) {
    return c.json({ 
      error: 'Tools integration failed', 
      details: error.message 
    }, 500);
  }
});

// Get available tools
app.get("/api/tools", (c) => {
  const tools = getSystemTools();
  return c.json({ 
    count: tools.length,
    tools: tools.map((tool: any) => ({
      name: tool.function.name,
      description: tool.function.description
    }))
  });
});

// WebSocket for state updates
app.get(
  "/ws/state",
  upgradeWebSocket((c) => ({
    onOpen: (c, ws) => {
      ws.send(JSON.stringify({ type: "state_update", state: jarvisState }));
    },
    onClose: () => {
      console.log("State WebSocket closed");
    },
  }))
);

// Enhanced Voice WebSocket with proper OpenAI integration
app.get(
  "/ws",
  upgradeWebSocket(() => ({
    onOpen: async (_evt, ws) => {
      console.log("Voice WebSocket opened");
      
      if (!process.env.OPENAI_API_KEY) {
        ws.send(JSON.stringify({ type: "error", message: "No OpenAI API key" }));
        return ws.close();
      }

      if (!jarvisState.safetyEnabled) {
        ws.send(JSON.stringify({ type: "error", message: "Safety switch is engaged" }));
        return ws.close();
      }

      try {
        // Create JARVIS agent with mode-specific instructions
        const modeInstructions = getModeInstructions(jarvisState.mode);
        const agent = new OpenAIVoiceReactAgent({
          instructions: modeInstructions,
          tools: convertToStructuredTools(),
          model: "gpt-4o-realtime-preview",
          apiKey: process.env.OPENAI_API_KEY,
        });

        await agent.connect(
          ws.raw as WebSocket,
          (chunk: string) => ws.send(chunk)
        );

      } catch (error: any) {
        console.error("Error setting up JARVIS agent:", error);
        ws.send(JSON.stringify({ type: "error", message: "Failed to initialize JARVIS" }));
        ws.close();
      }
    },
    onMessage: async (_evt, ws) => {
      // Handle incoming messages if needed
      console.log("Voice WebSocket message received");
    },
    onClose: () => {
      console.log("Voice WebSocket closed");
      if (jarvisState.isListening) {
        jarvisState.isListening = false;
      }
    },
  }))
);

// Helper Functions
function getModeInstructions(mode: string): string {
  const baseInstructions = JARVIS_PROMPT;
  
  switch (mode) {
    case 'butler':
      return `${baseInstructions}\n\nMode: Butler - You are Tony Stark's personal AI assistant. Be professional, efficient, and anticipate needs. Address the user as "sir" naturally when appropriate.`;
    
    case 'demo':
      return `${baseInstructions}\n\nMode: Demo - You are showcasing your capabilities to an audience. Be impressive, explain what you're doing, and demonstrate your advanced features.`;
    
    case 'copilot':
      return `${baseInstructions}\n\nMode: Copilot - You are a collaborative AI partner. Be supportive, offer suggestions, and work alongside the user as a team member.`;
    
    case 'companion':
      return `${baseInstructions}\n\nMode: Companion - You are a friendly AI companion. Be warm, conversational, and focus on being helpful and personable.`;
    
    default:
      return baseInstructions;
  }
}

// Convert system tools to StructuredTool format for LangChain
function convertToStructuredTools(): any[] {
  // For now, return the system tools directly
  // The OpenAI voice agent will handle the conversion
  return getSystemTools();
}

const port = 3000;

const server = serve({
  fetch: app.fetch,
  port,
});

injectWebSocket(server);

console.log(`🤖 JARVIS Server is running on port ${port}`);
console.log(`🔧 Available tools: ${getSystemTools().length}`);
console.log(`Current mode: ${jarvisState.mode}`);
console.log(`Safety enabled: ${jarvisState.safetyEnabled}`);
console.log(`🌐 Open http://localhost:${port} to access JARVIS`);