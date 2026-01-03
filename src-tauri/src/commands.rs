use crate::api::UsageClient;
use crate::types::{AllUsageData, Config};
use std::sync::Mutex;
use tauri::{State, AppHandle, Emitter, Manager};
use serde_json::json;

/// Application state for holding the config and last usage data
pub struct AppState {
    pub config: Mutex<Config>,
    pub last_usage_data: Mutex<Option<AllUsageData>>,
}

/// Resize the window to fit content
#[tauri::command]
pub async fn resize_window(app: AppHandle, width: i32, height: i32) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let width = width as u32;
        let height = height as u32;
        window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }))
            .map_err(|e| format!("Failed to resize window: {}", e))?;
    }
    Ok(())
}

/// Fetch all usage data from the API
#[tauri::command]
pub async fn get_usage_data(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<AllUsageData, String> {
    let config = state.config.lock().unwrap().clone();

    let client = UsageClient::new(config);

    // Fetch all data in parallel for better performance
    let (model_usage, tool_usage, quota_limits) = tokio::try_join!(
        client.fetch_model_usage(),
        client.fetch_tool_usage(),
        client.fetch_quota_limits()
    )
    .map_err(|e| format!("Failed to fetch data: {}", e))?;

    let data = AllUsageData {
        model_usage,
        tool_usage,
        quota_limits: quota_limits.clone(),
        timestamp: chrono::Local::now().timestamp(),
    };

    // Store in state for tray access
    *state.last_usage_data.lock().unwrap() = Some(data.clone());

    // Emit usage alerts for high usage
    for limit in &quota_limits {
        if limit.percentage >= 90.0 {
            let _ = app.emit("usage-alert", json!({
                "type": limit.type_field,
                "percentage": limit.percentage,
                "severity": "critical"
            }));
        } else if limit.percentage >= 70.0 {
            let _ = app.emit("usage-alert", json!({
                "type": limit.type_field,
                "percentage": limit.percentage,
                "severity": "warning"
            }));
        }
    }

    Ok(data)
}

/// Save configuration to persistent storage
#[tauri::command]
pub fn save_config(
    auth_token: String,
    base_url: String,
    refresh_interval_minutes: u64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let new_config = Config {
        auth_token,
        base_url,
        refresh_interval_minutes,
    };

    // Save to persistent storage
    crate::config::save_config(&new_config)?;

    // Update in-memory state
    *state.config.lock().unwrap() = new_config;

    Ok(())
}

/// Load configuration from persistent storage
#[tauri::command]
pub fn get_config(state: State<'_, AppState>) -> Result<Config, String> {
    Ok(state.config.lock().unwrap().clone())
}
