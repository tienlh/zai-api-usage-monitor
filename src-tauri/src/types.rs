use serde::{Deserialize, Serialize};

/// Model usage response from API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsageResponse {
    pub code: i64,
    pub msg: String,
    pub data: ModelUsageData,
    pub success: bool,
}

/// Model usage data wrapper (time-series data)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsageData {
    #[serde(rename = "x_time")]
    pub x_time: Vec<String>,
    #[serde(rename = "modelCallCount")]
    pub model_call_count: Vec<Option<i64>>,
    #[serde(rename = "tokensUsage")]
    pub tokens_usage: Vec<Option<i64>>,
    #[serde(rename = "totalUsage")]
    pub total_usage: ModelTotalUsage,
}

/// Total usage summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelTotalUsage {
    #[serde(rename = "totalModelCallCount")]
    pub total_model_call_count: i64,
    #[serde(rename = "totalTokensUsage")]
    pub total_tokens_usage: i64,
}

/// Individual model usage item (frontend format - simplified)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsageItem {
    pub model: String,
    pub token_count: i64,
    pub request_count: i64,
}

/// Tool usage response from API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolUsageResponse {
    pub code: i64,
    pub msg: String,
    pub data: ToolUsageData,
    pub success: bool,
}

/// Tool usage data wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolUsageData {
    #[serde(rename = "totalUsage")]
    pub total_usage: TotalUsage,
    #[serde(flatten)]
    pub extra: serde_json::Value, // To capture x_time and other fields we don't use
}

/// Total usage summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TotalUsage {
    #[serde(rename = "totalNetworkSearchCount")]
    pub total_network_search_count: i64,
    #[serde(rename = "totalWebReadMcpCount")]
    pub total_web_read_mcp_count: i64,
    #[serde(rename = "totalZreadMcpCount")]
    pub total_zread_mcp_count: i64,
    #[serde(rename = "totalSearchMcpCount")]
    pub total_search_mcp_count: i64,
    #[serde(rename = "toolDetails")]
    pub tool_details: Vec<ToolDetail>,
}

/// Individual tool detail from API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDetail {
    #[serde(rename = "modelName")]
    pub model_name: String,
    #[serde(rename = "totalUsageCount")]
    pub total_usage_count: i64,
}

/// Individual tool usage item (frontend format)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolUsageItem {
    pub tool_name: String,
    pub usage_count: i64,
}

/// Quota limit response from API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaLimitResponse {
    pub code: i64,
    pub msg: String,
    pub data: QuotaLimitData,
    pub success: bool,
}

/// Quota limit data wrapper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaLimitData {
    pub limits: Vec<QuotaLimit>,
}

/// Individual quota limit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaLimit {
    #[serde(rename = "type")]
    pub type_field: String,
    pub unit: i64,
    pub number: i64,
    #[serde(default)]
    pub usage: Option<i64>,
    #[serde(rename = "currentValue", default)]
    pub current_value: Option<i64>,
    #[serde(default)]
    pub remaining: Option<i64>,
    pub percentage: f64,
    #[serde(rename = "usageDetails", default)]
    pub usage_details: Option<Vec<UsageDetail>>,
    #[serde(rename = "nextResetTime", default)]
    pub next_reset_time: Option<i64>,
}

/// Usage detail for quota limits
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageDetail {
    #[serde(rename(serialize = "tool_name", deserialize = "modelCode"))]
    pub tool_name: String,
    pub usage: i64,
}

/// Combined usage data returned to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllUsageData {
    pub model_usage: Vec<ModelUsageItem>,
    pub model_usage_timeseries: Option<ModelUsageTimeSeries>,
    pub tool_usage: Vec<ToolUsageItem>,
    pub quota_limits: Vec<QuotaLimit>,
    pub timestamp: i64,
}

/// Time-series data for model usage (charts)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsageTimeSeries {
    #[serde(rename = "x_time")]
    pub x_time: Vec<String>,
    #[serde(rename = "modelCallCount")]
    pub model_call_count: Vec<Option<i64>>,
    #[serde(rename = "tokensUsage")]
    pub tokens_usage: Vec<Option<i64>>,
}

/// Combined model usage result (aggregated items + time-series data)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsageResult {
    pub items: Vec<ModelUsageItem>,
    pub timeseries: Option<ModelUsageTimeSeries>,
}

/// Configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub auth_token: String,
    pub base_url: String,
    pub refresh_interval_minutes: u64,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            auth_token: String::new(),
            base_url: "https://api.z.ai/api/anthropic".to_string(),
            refresh_interval_minutes: 5,
        }
    }
}
