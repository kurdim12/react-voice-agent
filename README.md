# 🎤🤖 JARVIS - React Voice Agent

A sophisticated voice-controlled AI assistant built with OpenAI's Realtime API, inspired by Tony Stark's JARVIS. This project implements a ReAct-style agent that can control your Windows system through voice commands.

![JARVIS Interface](react-voice-agent/static/react.png)

## ✨ Features

### 🎯 Core Capabilities
- **Voice Control**: Natural language voice commands using OpenAI Realtime API
- **System Control**: Open applications, manage files, control system functions
- **Web Navigation**: Open websites, perform Google searches
- **Multiple Modes**: Butler, Demo, Copilot, and Companion personalities
- **Safety Controls**: Built-in safety switches and wake word detection
- **Modern UI**: Beautiful, responsive interface with voice visualization

### 🛠️ Available Commands
- **Applications**: Open Calculator, Notepad, Paint, Chrome, File Explorer
- **System**: Shutdown, restart, volume control, system information
- **Web**: Open websites, Google search, browser control
- **Files**: Create files and folders
- **Time**: Get current time and date

## 🏗️ Project Structure

```
react-voice/
├── react-voice-agent/          # Main voice agent application
│   ├── js_server/             # TypeScript server implementation
│   │   ├── src/
│   │   │   ├── index.ts       # Main server with JARVIS state management
│   │   │   ├── tools.ts       # System control tools (12+ functions)
│   │   │   ├── prompt.ts      # JARVIS personality configuration
│   │   │   └── lib/           # Voice agent implementation
│   │   ├── static/            # Frontend UI and assets
│   │   └── package.json
│   ├── server/                # Python implementation (alternative)
│   └── README.md
└── jarvis-helper/             # Advanced system control helper
    ├── index.js               # Browser automation & system control
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- OpenAI API key with Realtime API access
- Windows 10/11 (for system control features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/react-voice-agent.git
cd react-voice-agent
```

2. **Set up the main server**
```bash
cd react-voice-agent/js_server
yarn install
```

3. **Configure environment variables**
```bash
# Copy and edit the environment file
cp .env.example .env
# Add your OpenAI API key to .env
```

4. **Set up the helper service (optional)**
```bash
cd ../../jarvis-helper
npm install
```

### Running the Application

1. **Start the main JARVIS server**
```bash
cd react-voice-agent/js_server
yarn dev
```

2. **Start the helper service (optional, for advanced features)**
```bash
cd jarvis-helper
npm start
```

3. **Open your browser**
Navigate to `http://localhost:3000`

## 🎮 Usage

1. **Enable microphone access** when prompted by your browser
2. **Click the voice orb** to start listening
3. **Speak your commands** naturally:
   - "Open calculator"
   - "Search Google for weather"
   - "What time is it?"
   - "Create a file called test.txt"
   - "Open YouTube"

### JARVIS Modes
- **Butler Mode**: Professional assistant (default)
- **Demo Mode**: Showcases capabilities with explanations
- **Copilot Mode**: Collaborative partner
- **Companion Mode**: Friendly conversational assistant

## 🔧 Configuration

### Environment Variables
Create a `.env` file in `react-voice-agent/js_server/`:
```
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### Adding Custom Tools
Add new tools in `react-voice-agent/js_server/src/tools.ts`:
```typescript
export async function yourCustomFunction(params: any): Promise<string> {
  // Your implementation
  return "Success message";
}
```

## 🏛️ Architecture

### Components
- **Voice Agent**: OpenAI Realtime API integration with ReAct pattern
- **Tool System**: Modular system control functions
- **State Management**: JARVIS wake/sleep states and safety controls
- **WebSocket Server**: Real-time communication between frontend and backend
- **Helper Service**: Advanced system automation using Playwright and nut.js

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (Web Audio API)
- **Backend**: Node.js, TypeScript, Hono framework
- **Voice**: OpenAI Realtime API
- **System Control**: Windows PowerShell, nut.js, Playwright
- **WebSockets**: Real-time bidirectional communication

## 🛡️ Safety Features

- **Safety Switch**: Prevents accidental system commands
- **Wake Word Detection**: Optional hands-free activation
- **Command Confirmation**: Critical operations require confirmation
- **Error Handling**: Graceful failure handling for all operations

## 🐛 Troubleshooting

### Common Issues
- **"WebSocket connection: HTTP 403"**: Check OpenAI API access and billing
- **"No microphone access"**: Enable microphone permissions in browser
- **"Safety switch engaged"**: Toggle safety switch in the UI
- **Tools not working**: Ensure Windows PowerShell execution policy allows scripts

### Debug Mode
Enable verbose logging by setting `DEBUG=true` in your environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the Realtime API
- LangChain for the ReAct pattern implementation
- The open-source community for various tools and libraries

## 🔮 Future Enhancements

- [ ] Cross-platform support (macOS, Linux)
- [ ] Plugin system for custom integrations
- [ ] Voice training for better recognition
- [ ] Mobile companion app
- [ ] Integration with smart home devices
- [ ] Multi-language support

---

**Note**: This project requires OpenAI Realtime API access. Ensure your OpenAI account has the necessary permissions and credits.

For detailed setup instructions and troubleshooting, see the individual README files in each component directory. 