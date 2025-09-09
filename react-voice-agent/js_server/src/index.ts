import "dotenv/config";
import { type WebSocket } from "ws";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import { serveStatic } from "@hono/node-server/serve-static";

import { OpenAIVoiceReactAgent } from "./lib/langchain_openai_voice.js";
import { INSTRUCTIONS } from "./prompt.js";
import { getAllTools } from "./tools.js";
import { StructuredTool } from "langchain/tools";
import { z } from "zod";

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

// Enhanced Voice WebSocket (fixed types)
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
          tools: getAllTools(),
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
  const baseInstructions = INSTRUCTIONS;
  
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

export function getAllTools(): StructuredTool<any>[] {
  return [
    new StructuredTool({
      name: "search_web",
      description: "Search the web for information.",
      schema: z.object({
        query: z.string().describe("Search query")
      }),
      async call({ query }) {
        // Implement search logic here
        return `Searched for: ${query}`;
      }
    }),
    // Add other tools as StructuredTool instances here
  ];
}

const port = 3000;

const server = serve({
  fetch: app.fetch,
  port,
});

injectWebSocket(server);

console.log(`🤖 JARVIS Server is running on port ${port}`);
console.log(`Current mode: ${jarvisState.mode}`);
console.log(`Safety enabled: ${jarvisState.safetyEnabled}`);