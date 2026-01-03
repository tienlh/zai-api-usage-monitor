use crate::commands::{AppState, get_config, get_usage_data, save_config, resize_window};
use crate::config::load_config;
use crate::types::AllUsageData;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, Emitter, AppHandle, Runtime, Listener,
};

mod api;
mod commands;
mod config;
mod types;

/// Generate tray title with current usage statistics
fn generate_tray_title(usage_data: &AllUsageData) -> String {
    let token_limit = usage_data.quota_limits.iter()
        .find(|l| l.type_field.contains("Token"));

    let mcp_limit = usage_data.quota_limits.iter()
        .find(|l| l.type_field.contains("MCP"));

    let token_pct = token_limit.map(|l| l.percentage).unwrap_or(0.0);
    let mcp_pct = mcp_limit.map(|l| l.percentage).unwrap_or(0.0);

    format!("🆉 T:{:.0}% M:{:.0}%", token_pct, mcp_pct)
}

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

/// Update tray icon tooltip, title, and menu with latest usage data
pub fn update_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let state = app.state::<crate::commands::AppState>();
    let usage_data = state.last_usage_data.lock().unwrap();
    let tray_id_opt = state.tray_id.lock().unwrap();

    if let Some(data) = &*usage_data {
        if let Some(tray_id) = &*tray_id_opt {
            if let Some(tray) = app.tray_by_id(tray_id) {
                // Update title
                let title = generate_tray_title(data);
                println!("DEBUG: Updating tray title to: {}", title);
                tray.set_title(Some(title.as_str()))?;

                // Update tooltip
                let tooltip = generate_tray_tooltip(data);
                tray.set_tooltip(Some(tooltip.as_str()))?;

                // Update menu with stats
                let new_menu = create_tray_menu_with_stats(app, data)?;
                tray.set_menu(Some(new_menu))?;
            } else {
                println!("DEBUG: No tray found with ID: {:?}", tray_id);
            }
        } else {
            println!("DEBUG: No tray ID stored");
        }
    } else {
        println!("DEBUG: No usage data available");
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
                tray_id: std::sync::Mutex::new(None),
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
            let tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .title("🆉 Loading...")
                .build(app)
                .unwrap();

            // Get the tray's ID and store it for later access
            let tray_id = tray.id().clone();
            println!("DEBUG: Tray created with ID: {:?}", tray_id);

            // Store the tray ID in app state
            let state = app.state::<crate::commands::AppState>();
            *state.tray_id.lock().unwrap() = Some(tray_id.clone());

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

            // Listen for usage data updates and update the tray
            let app_handle_for_listener = app.handle().clone();
            let _ = app.listen("usage-data-updated", move |_event| {
                let app_handle = app_handle_for_listener.clone();
                tauri::async_runtime::spawn(async move {
                    // Small delay to ensure data is stored
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                    let _ = update_tray(&app_handle);
                });
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
