# Z.ai Usage Monitor

A sleek, compact macOS menubar application for monitoring your Z.ai API usage in real-time. Built with Tauri, React, and TypeScript.

![Z.ai Usage Monitor](./screenshot.png)

## ✨ Features

### 🎨 **Compact Interface**
- Space-optimized design perfect for menubar apps
- Token and MCP usage displayed side-by-side in a single row
- Collapsible detailed breakdowns for easy viewing
- Fixed window size (420×480px) optimized for content

### 📊 **Real-Time Usage Tracking**
- **Token Usage**: 5-hour rolling window with percentage tracking
- **MCP Tool Usage**: 1-month window with request monitoring
- **Color-coded Progress Bars**: Visual indicators for usage levels
  - 🟢 Green: < 50% usage
  - 🟡 Yellow: 50-70% usage
  - 🟠 Amber: 70-90% usage
  - 🔴 Red: ≥ 90% usage

### 🔔 **Smart Notifications**
- Browser notifications when approaching quota limits
- Warning alerts at 70% usage
- Critical alerts at 90% usage
- Native macOS notification support

### 🖥️ **System Tray Integration**
- Dynamic tooltip showing current usage percentages
- Quick stats in tray menu
- One-click refresh from tray
- Show/Hide window controls
- Auto-update tray with latest data

### 📱 **Interactive Details**
- **Model Breakdown**: View token usage and request counts per model
- **Tool Usage**: Track MCP tool usage statistics
- **Sortable Tables**: Sort by tokens, requests, or name
- **Tabbed Interface**: Switch between Models and Tools views

### ⚙️ **Configurable Settings**
- Custom API token authentication
- Configurable base URL
- Adjustable refresh interval (default: 5 minutes)
- Persistent configuration storage

## 📦 Installation

### Prerequisites

- **macOS**: 10.13 or later
- **Node.js**: 18.x or later
- **Rust**: 1.70 or later (with Cargo)
- **npm**: 9.x or later

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### Clone and Install Dependencies

```bash
git clone <repository-url>
cd zai-usage-monitor
npm install
```

## 🚀 Usage

### Development Mode

```bash
npm run tauri dev
```

This will:
1. Start the Vite dev server (http://localhost:1420)
2. Compile the Rust backend
3. Launch the application

### Production Build

```bash
npm run tauri build
```

This creates a `.dmg` installer in `src-tauri/target/release/bundle/dmg/`

### First Run Setup

1. Click the **Settings** button (gear icon) in the top-right
2. Enter your **Z.ai API Token**
3. Configure the **Base URL** (default: `https://api.z.ai/api/anthropic`)
4. Set the **Refresh Interval** (default: 5 minutes)
5. Click **Save**

The app will immediately start fetching your usage data!

## 🎯 Features Breakdown

### Main Display

**Fixed Window Size** (420×480px):
- App icon and title
- Token usage percentage with progress bar
- MCP usage percentage with progress bar
- Quick stats showing used/remaining amounts
- Collapsible Details section

### Details Section

Click **"Details"** to expand/collapse:
- **Models Tab**: View all models sorted by token usage or request count
- **Tools Tab**: View MCP tools sorted by usage count or name
- Tables show model/tool names with usage statistics

### System Tray

**Tooltip** (hover over tray icon):
```
📊 Tokens: XX.X% | MCP: XX.X%
Updated: HH:MM
```

**Menu Options**:
- Show/Hide window
- Refresh Now
- Quit

## 🔧 Configuration

### Config File Location

The configuration is stored at:
```
~/Library/Application Support/zai-usage-monitor/config.json
```

### Config Structure

```json
{
  "auth_token": "your-api-token",
  "base_url": "https://api.z.ai/api/anthropic",
  "refresh_interval_minutes": 5
}
```

### Environment Variables

You can also configure via environment variables (development only):
- `ZAI_AUTH_TOKEN`: Your Z.ai API token
- `ZAI_BASE_URL`: Custom base URL

## 🏗️ Project Structure

```
zai-usage-monitor/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # React components
│   │   ├── UsageDisplay.tsx     # Token/MCP usage display
│   │   ├── UsageDetails.tsx     # Model/Tool breakdowns
│   │   ├── Settings.tsx         # Settings modal
│   │   └── ui/                 # shadcn/ui components
│   ├── styles/                  # Global styles
│   │   └── globals.css          # Tailwind + custom styles
│   ├── lib/                     # Utilities
│   │   └── utils.ts            # Helper functions
│   └── App.tsx                  # Main application
├── src-tauri/                   # Backend (Rust)
│   ├── src/
│   │   ├── lib.rs              # Main entry point, tray setup
│   │   ├── commands.rs         # Tauri commands (IPC)
│   │   ├── api.rs              # API client
│   │   ├── config.rs           # Config management
│   │   └── types.rs            # Type definitions
│   ├── icons/                   # Application icons
│   └── tauri.conf.json         # Tauri configuration
├── package.json                 # Node.js dependencies
└── Cargo.toml                   # Rust dependencies
```

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - UI framework
- **TypeScript** - Type safety
- **Vite 7.3** - Build tool
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - Component library
- **Lucide React** - Icons

### Backend
- **Tauri 2.9** - Desktop framework
- **Rust 1.92** - Backend language
- **Tokio** - Async runtime
- **Serde** - Serialization
- **Chrono** - Date/time handling

## 📝 API Integration

The app integrates with the Z.ai API using these endpoints:

### Fetch Model Usage
```
GET /api/monitor/usage/model-usage
Time Window: Yesterday at HH:00:00 to Today at HH:59:59
```

### Fetch Tool Usage
```
GET /api/monitor/usage/tool-usage
Time Window: Yesterday at HH:00:00 to Today at HH:59:59
```

### Fetch Quota Limits
```
GET /api/monitor/usage/quota/limit
```

All requests include:
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

## 🎨 UI/UX Features

### Glass-Morphism Design
- Backdrop blur effects
- Semi-transparent backgrounds
- Gradient accents
- Smooth transitions

### Responsive Behavior
- Fixed window size optimized for all content
- Minimum size constraints prevent UI breakage
- Optimized for menubar app usage
- Resizable if user wants larger view

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast mode compatible
- Clear visual hierarchy

## 🔒 Security

- **API Token Storage**: Stored locally in macOS keychain-protected config directory
- **HTTPS Only**: All API communication over encrypted connections
- **No Telemetry**: No data sent to external services
- **Open Source**: Fully auditable codebase

## 🐛 Troubleshooting

### App Won't Start

1. Ensure Rust is installed: `cargo --version`
2. Ensure Node.js is installed: `node --version`
3. Clear cache: `rm -rf node_modules && npm install`
4. Rebuild: `npm run tauri build`

### API Errors

1. **401 Unauthorized**: Check your API token in Settings
2. **403 Forbidden**: Token may have expired or insufficient permissions
3. **Network Error**: Check your internet connection and base URL

### Window Not Visible

1. Check System Tray (menubar) for the 📊 icon
2. Right-click and select "Show"
3. If not found, restart the app

### High Memory Usage

- This is normal during initial data fetch
- Memory usage stabilizes after first refresh
- Consider increasing refresh interval if issues persist

## 🔄 Development Workflow

### Adding New Features

1. **Frontend**: Edit React components in `src/`
2. **Backend**: Edit Rust code in `src-tauri/src/`
3. **Styles**: Modify `src/styles/globals.css`
4. **Config**: Update `src-tauri/tauri.conf.json`

### Hot Reload

- **Frontend**: Auto-reloads on save
- **Backend**: Auto-recompiles on save
- Full restart required for some Rust changes

### Code Style

- **TypeScript**: Strict mode enabled
- **Rust**: Standard formatting (`cargo fmt`)
- **ESLint**: Configured for React + TypeScript

## 📄 License

MIT License - feel free to use this project for your own needs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the Tauri docs: https://tauri.app/

## 🙏 Acknowledgments

- **Tauri Team** - For the amazing desktop framework
- **shadcn** - For the beautiful UI components
- **Z.ai** - For the API and platform

---

**Made with ❤️ using Tauri + React**
