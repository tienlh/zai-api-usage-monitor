use crate::types::{
    Config, ModelUsageItem, ModelUsageResponse, ToolUsageItem, ToolUsageResponse, ToolDetail,
    QuotaLimit, QuotaLimitResponse, ModelUsageData, ModelUsageResult, ModelUsageTimeSeries,
};
use chrono::{DateTime, Local, Duration, Timelike};
use reqwest::Client;

/// HTTP client for Z.ai API
pub struct UsageClient {
    client: Client,
    config: Config,
}

impl UsageClient {
    /// Create a new UsageClient with the given configuration
    pub fn new(config: Config) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    /// Create ModelUsageItem from ModelUsageData
    fn create_model_usage_items(data: &ModelUsageData) -> Vec<ModelUsageItem> {
        vec![ModelUsageItem {
            model: "All Models".to_string(),
            token_count: data.total_usage.total_tokens_usage,
            request_count: data.total_usage.total_model_call_count,
        }]
    }

    /// Extract the base domain from the configured base URL
    fn get_base_domain(&self) -> Result<String, String> {
        let base_url = &self.config.base_url;

        if base_url.contains("api.z.ai") {
            Ok("https://api.z.ai".to_string())
        } else if base_url.contains("open.bigmodel.cn") || base_url.contains("dev.bigmodel.cn") {
            Ok("https://open.bigmodel.cn".to_string())
        } else {
            Err("Unrecognized base URL".to_string())
        }
    }

    /// Calculate the time window for API queries
    /// Returns (start_time, end_time) as formatted strings
    ///
    /// Time window: from yesterday at the current hour (HH:00:00)
    /// to today at the current hour end (HH:59:59)
    fn get_time_window() -> (String, String) {
        let now = Local::now();

        // Start: yesterday at current hour HH:00:00
        let start_date = now - Duration::days(1);
        let start_date = start_date
            .with_second(0)
            .unwrap()
            .with_minute(0)
            .unwrap()
            .with_hour(now.hour())
            .unwrap();

        // End: today at current hour HH:59:59
        let end_date = now
            .with_second(59)
            .unwrap()
            .with_minute(59)
            .unwrap()
            .with_hour(now.hour())
            .unwrap();

        let format_datetime = |date: DateTime<Local>| -> String {
            date.format("%Y-%m-%d %H:%M:%S").to_string()
        };

        (format_datetime(start_date), format_datetime(end_date))
    }

    /// Fetch model usage data from the API
    pub async fn fetch_model_usage(&self) -> Result<ModelUsageResult, String> {
        let base_domain = self.get_base_domain()?;
        let url = format!("{}/api/monitor/usage/model-usage", base_domain);
        let (start, end) = Self::get_time_window();

        let response = self
            .client
            .get(&url)
            .query(&[("startTime", &start), ("endTime", &end)])
            .header("Authorization", &self.config.auth_token)
            .header("Accept-Language", "en-US,en")
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let status = response.status();
        if status != 200 {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("HTTP {}: {}", status, error_text));
        }

        // Log raw response body for debugging
        let raw_body = response.text().await.map_err(|e| format!("Failed to read response body: {}", e))?;
        eprintln!("DEBUG: Model usage API response: {}", raw_body);

        let model_response: ModelUsageResponse = serde_json::from_str(&raw_body)
            .map_err(|e| format!("Parse error: {} - Response was: {}", e, raw_body))?;

        // Convert time-series data to ModelUsageItem format for frontend
        // Since API returns totals, create a single "All Models" entry
        let model_items = Self::create_model_usage_items(&model_response.data);

        // Extract time-series data for charts
        let timeseries = ModelUsageTimeSeries {
            x_time: model_response.data.x_time,
            model_call_count: model_response.data.model_call_count,
            tokens_usage: model_response.data.tokens_usage,
        };

        Ok(ModelUsageResult {
            items: model_items,
            timeseries: Some(timeseries),
        })
    }

    /// Fetch tool usage data from the API
    pub async fn fetch_tool_usage(&self) -> Result<Vec<ToolUsageItem>, String> {
        let base_domain = self.get_base_domain()?;
        let url = format!("{}/api/monitor/usage/tool-usage", base_domain);
        let (start, end) = Self::get_time_window();

        let response = self
            .client
            .get(&url)
            .query(&[("startTime", &start), ("endTime", &end)])
            .header("Authorization", &self.config.auth_token)
            .header("Accept-Language", "en-US,en")
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let status = response.status();
        if status != 200 {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("HTTP {}: {}", status, error_text));
        }

        // Log raw response body for debugging
        let raw_body = response.text().await.map_err(|e| format!("Failed to read response body: {}", e))?;
        eprintln!("DEBUG: Tool usage API response: {}", raw_body);

        let tool_response: ToolUsageResponse = serde_json::from_str(&raw_body)
            .map_err(|e| format!("Parse error: {} - Response was: {}", e, raw_body))?;

        // Convert ToolDetail to ToolUsageItem format for frontend
        let tool_items: Vec<ToolUsageItem> = tool_response
            .data
            .total_usage
            .tool_details
            .into_iter()
            .map(|detail: ToolDetail| ToolUsageItem {
                tool_name: detail.model_name,
                usage_count: detail.total_usage_count,
            })
            .collect();

        Ok(tool_items)
    }

    /// Fetch quota limits from the API
    pub async fn fetch_quota_limits(&self) -> Result<Vec<QuotaLimit>, String> {
        let base_domain = self.get_base_domain()?;
        let url = format!("{}/api/monitor/usage/quota/limit", base_domain);

        let response = self
            .client
            .get(&url)
            .header("Authorization", &self.config.auth_token)
            .header("Accept-Language", "en-US,en")
            .header("Content-Type", "application/json")
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let status = response.status();
        if status != 200 {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("HTTP {}: {}", status, error_text));
        }

        // Log raw response body for debugging
        let raw_body = response.text().await.map_err(|e| format!("Failed to read response body: {}", e))?;
        eprintln!("DEBUG: Quota limits API response: {}", raw_body);

        let quota_response: QuotaLimitResponse = serde_json::from_str(&raw_body)
            .map_err(|e| format!("Parse error: {} - Response was: {}", e, raw_body))?;

        // Transform quota limits (match Node.js logic from query-usage.mjs)
        let mut limits = quota_response.data.limits;
        for limit in &mut limits {
            match limit.type_field.as_str() {
                "TOKENS_LIMIT" => {
                    limit.type_field = "Token usage(5 Hour)".to_string();
                }
                "TIME_LIMIT" => {
                    limit.type_field = "MCP usage(1 Month)".to_string();
                }
                _ => {}
            }
        }

        Ok(limits)
    }
}
