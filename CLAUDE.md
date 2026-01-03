# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Z.ai Usage Monitor is a macOS menubar application built with Tauri (Rust backend) + React (TypeScript frontend). It monitors API usage for the Z.ai platform by fetching model usage, tool usage, and quota limit data from the API and displaying it in a desktop application.

## Development Commands

### Frontend
- `npm run dev` - Start Vite dev server (port 1420, strict port)
- `npm run build` - Build frontend for production (runs TypeScript check then Vite build)
- `npm run preview` - Preview production build locally

### Tauri (Rust Backend)
- `npm run tauri dev` - Run Tauri dev mode (builds frontend and Rust backend with hot reload)
- `npm run tauri build` - Build the application bundle (produces .dmg for macOS)

### TypeScript
- `tsc` - Run TypeScript type check (no output, only checks types)

## Architecture

### Backend (Rust) - `src-tauri/src/`

The Rust backend is organized into modules:

- **lib.rs** - Main entry point. Sets up Tauri app, system tray icon with menu (Show/Hide/Refresh/Quit), and manages app state. The window is hidden on startup for menubar app behavior.
- **commands.rs** - Tauri command handlers exposed to frontend:
  - `get_usage_data()` - Fetches all usage data (model, tool, quota) in parallel using `tokio::try_join!`
  - `save_config()` - Saves config to disk and updates in-memory state
  - `get_config()` - Returns current config from state
- **api.rs** - `UsageClient` handles HTTP requests to Z.ai API. Key methods:
  - `fetch_model_usage()` - GET `/api/monitor/usage/model-usage`
  - `fetch_tool_usage()` - GET `/api/monitor/usage/tool-usage`
  - `fetch_quota_limits()` - GET `/api/monitor/usage/quota/limit`
  - Time window calculation: queries from yesterday at current hour (HH:00:00) to today at current hour (HH:59:59)
- **config.rs** - Manages persistent configuration stored at `~/Library/Application Support/zai-usage-monitor/config.json` on macOS
- **types.rs** - Serde types for API responses and config. Note: `QuotaLimit.type_field` uses `serde(rename)` because "type" is a Rust keyword

### Frontend (React/TypeScript) - `src/`

- **App.tsx** - Main application component. Manages:
  - Config state (auth_token, base_url, refresh_interval_minutes)
  - Usage data fetching with auto-refresh interval
  - Tauri event listener for 'refresh-requested' from system tray
  - Settings modal visibility
- **Components/**:
  - `UsageDisplay.tsx` - Displays quota limits with progress bars
  - `ModelBreakdown.tsx` - Shows model usage (tokens and request counts)
  - `ToolUsage.tsx` - Shows tool usage counts
  - `Settings.tsx` - Configuration form for API token and base URL

### Tauri-Frontend Communication

Frontend calls Rust commands via `invoke()` from `@tauri-apps/api/core`:
```typescript
invoke<AllUsageData>('get_usage_data')
invoke<Config>('get_config')
invoke('save_config', { auth_token, base_url, refresh_interval_minutes })
```

Rust emits events to frontend via `app.emit()`:
```rust
app.emit("refresh-requested", ())
```

Frontend listens via `listen()` from `@tauri-apps/api/event`.

## Key Configuration

- Dev server runs on port 1420 (strictPort, cannot use another port)
- HMR on port 1421 in dev mode
- TypeScript strict mode enabled (noUnusedLocals, noUnusedParameters)
- Config persists to platform-specific config directory
- Time window for API queries uses 24-hour rolling window based on current hour
