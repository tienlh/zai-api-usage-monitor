use crate::types::Config;
use std::fs;
use std::path::PathBuf;

/// Get the configuration file path for the current platform
fn get_config_path() -> PathBuf {
    // Use the appropriate config directory for each platform
    #[cfg(target_os = "macos")]
    let base_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."));

    #[cfg(not(target_os = "macos"))]
    let base_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."));

    base_dir
        .join("zai-usage-monitor")
        .join("config.json")
}

/// Load configuration from disk, or return default if not found
pub fn load_config() -> Result<Config, String> {
    let path = get_config_path();

    if path.exists() {
        let contents = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read config: {}", e))?;

        serde_json::from_str(&contents)
            .map_err(|e| format!("Failed to parse config: {}", e))
    } else {
        Ok(Config::default())
    }
}

/// Save configuration to disk
pub fn save_config(config: &Config) -> Result<(), String> {
    let path = get_config_path();

    // Create parent directory if it doesn't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let contents = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&path, contents)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}
