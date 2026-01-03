use crate::commands::{AppState, get_config, get_usage_data, save_config, resize_window};
use crate::config::load_config;
use crate::types::AllUsageData;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, Emitter, AppHandle, Runtime,
};

mod api;
mod commands;
mod config;
mod types;

/// Generate tooltip text with current usage statistics
fn generate_tray_tooltip(usage_data: &AllUsageData) -> String {
    let token_limit = usage_data.quota_limits.iter()
        .find(|l| l.type_field.contains("Token"));

    let mcp_limit = usage_data.quota_limits.iter()
        .find(|l| l.type_field.contains("MCP"));

    let token_pct = token_limit.map(|l| l.percentage).unwrap_or(0.0);
    let mcp_pct = mcp_limit.map(|l| l.percentage).unwrap_or(0.0);

    let time = chrono::Local::now().format("%H:%M");

    format!("Tokens: {:.1}% | MCP: {:.1}%\nUpdated: {}", token_pct, mcp_pct, time)
}

/// Create dynamic menu with usage statistics
fn create_tray_menu_with_stats<R: Runtime>(app: &AppHandle<R>, usage_data: &AllUsageData) -> Result<Menu<R>, tauri::Error> {
    let token_limit = usage_data.quota_limits.iter()
        .find(|l| l.type_field.contains("Token"));

    let mcp_limit = usage_data.quota_limits.iter()
        .find(|l| l.type_field.contains("MCP"));

    let token_pct = token_limit.map(|l| l.percentage).unwrap_or(0.0);
    let mcp_pct = mcp_limit.map(|l| l.percentage).unwrap_or(0.0);

    // Create stats item
    let stats_text = format!("Tokens: {:.1}% | MCP: {:.1}%", token_pct, mcp_pct);
    let stats_item = MenuItem::with_id(app, "stats", stats_text, true, None::<&str>)?;

    // Create control items
    let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
    let refresh_item = MenuItem::with_id(app, "refresh", "Refresh Now", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    Menu::with_items(app, &[
        &stats_item,
        &separator,
        &show_item,
        &hide_item,
        &refresh_item,
        &separator,
        &quit_item,
    ])
}

/// Update tray icon tooltip and menu with latest usage data
fn update_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let state = app.state::<AppState>();
    let usage_data = state.last_usage_data.lock().unwrap();

    if let Some(data) = &*usage_data {
        if let Some(tray) = app.tray_by_id("main") {
            // Update tooltip
            let tooltip = generate_tray_tooltip(data);
            tray.set_tooltip(Some(tooltip.as_str()))?;

            // Update menu with stats
            let new_menu = create_tray_menu_with_stats(app, data)?;
            tray.set_menu(Some(new_menu))?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Load config from persistent storage
            let config = load_config().unwrap_or_default();

            // Set up app state with empty usage data initially
            app.manage(AppState {
                config: std::sync::Mutex::new(config),
                last_usage_data: std::sync::Mutex::new(None),
            });

            // Create initial menu (will be updated when data arrives)
            let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)
                .unwrap();
            let hide_item = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)
                .unwrap();
            let refresh_item = MenuItem::with_id(app, "refresh", "Refresh Now", true, None::<&str>)
                .unwrap();
            let separator = PredefinedMenuItem::separator(app).unwrap();
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
                .unwrap();

            let menu = Menu::with_items(app, &[
                &show_item,
                &hide_item,
                &refresh_item,
                &separator,
                &quit_item,
            ])
            .unwrap();

            // Build the tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .title("📊")
                .build(app)
                .unwrap();

            // Hide window on startup (menubar app behavior)
            if let Some(window) = app.get_webview_window("main") {
                window.hide().unwrap();
            }

            // Schedule initial tray update after data is likely loaded
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                let _ = update_tray(&app_handle);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_usage_data,
            save_config,
            get_config,
            resize_window,
        ])
        .on_menu_event(|app, event| {
            match event.id.0.as_str() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                "refresh" => {
                    let _ = app.emit("refresh-requested", ());

                    // Update tray after a short delay to allow data fetch
                    let app_handle = app.clone();
                    tauri::async_runtime::spawn(async move {
                        tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
                        let _ = update_tray(&app_handle);
                    });
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|app, event| {
            if let TrayIconEvent::Click { .. } = event {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap() {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
