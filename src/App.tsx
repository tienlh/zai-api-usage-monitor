import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { BarChart3, Settings, AlertTriangle, Key, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UsageDisplay from './components/UsageDisplay';
import UsageDetails from './components/UsageDetails';
import SettingsModal from './components/Settings';

interface Config {
  auth_token: string;
  base_url: string;
  refresh_interval_minutes: number;
}

interface QuotaLimit {
  type_field: string;
  percentage: number;
  current_value?: number;
  usage?: number;
  remaining?: number;
  unit?: number;
  number?: number;
  usage_details?: Array<{ tool_name: string; usage: number }>;
}

interface ModelUsageItem {
  model: string;
  token_count: number;
  request_count: number;
}

interface ModelUsageTimeSeries {
  x_time: string[];
  modelCallCount: (number | null)[];
  tokensUsage: (number | null)[];
}

interface ToolUsageItem {
  tool_name: string;
  usage_count: number;
}

interface AllUsageData {
  model_usage: ModelUsageItem[];
  model_usage_timeseries?: ModelUsageTimeSeries;
  tool_usage: ToolUsageItem[];
  quota_limits: QuotaLimit[];
  timestamp: number;
}

interface UsageAlert {
  type: string;
  percentage: number;
  severity: 'warning' | 'critical';
}

function App() {
  const [config, setConfig] = useState<Config>({
    auth_token: '',
    base_url: 'https://api.z.ai/api/anthropic',
    refresh_interval_minutes: 5,
  });
  const [usageData, setUsageData] = useState<AllUsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [needsConfig, setNeedsConfig] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const fetchUsageData = useCallback(async () => {
    if (!config.auth_token) {
      setNeedsConfig(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await invoke<AllUsageData>('get_usage_data');
      setUsageData(data);
      setNeedsConfig(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        setNeedsConfig(true);
      }
    } finally {
      setLoading(false);
    }
  }, [config.auth_token]);

  const loadConfig = useCallback(async () => {
    try {
      const loadedConfig = await invoke<Config>('get_config');
      setConfig(loadedConfig);
      if (!loadedConfig.auth_token) {
        setNeedsConfig(true);
      }
    } catch (err: unknown) {
      console.error('Failed to load config:', err);
    }
  }, []);

  const handleSettingsSave = () => {
    setShowSettings(false);
    fetchUsageData();
  };

  const handleRefresh = () => {
    fetchUsageData();
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  useEffect(() => {
    if (config.auth_token) {
      intervalRef.current = window.setInterval(() => {
        fetchUsageData();
      }, config.refresh_interval_minutes * 60 * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [config, fetchUsageData]);

  useEffect(() => {
    const unlisten = listen('refresh-requested', () => {
      fetchUsageData();
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [fetchUsageData]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen for usage alerts and show notifications
  useEffect(() => {
    const unlisten = listen<UsageAlert>('usage-alert', (event) => {
      const { type, percentage, severity } = event.payload;

      if ('Notification' in window && Notification.permission === 'granted') {
        const title = severity === 'critical'
          ? '🚨 Critical Usage Alert'
          : '⚠️ Usage Warning';

        new Notification(title, {
          body: `${type}: ${percentage.toFixed(1)}% used`,
          icon: '/icon.png',
        });
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const formatLastUpdated = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {showSettings && (
        <SettingsModal
          config={config}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="max-w-lg mx-auto p-3">
        {/* Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg shadow border border-slate-200/50 dark:border-slate-700/50 p-3 mb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white">Z.ai Usage</h1>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Real-time monitoring</p>
              </div>
            </div>
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              size="icon"
              className="rounded-md h-7 w-7"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-3 backdrop-blur-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            <AlertDescription>
              <div className="flex flex-col gap-1.5">
                <div>
                  <p className="font-semibold text-xs">Error Loading Data</p>
                  <p className="text-[10px] break-words">{error}</p>
                </div>
                {needsConfig && (
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    size="sm"
                    className="w-fit text-[10px] h-6"
                  >
                    Open Settings
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && !usageData && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg shadow border border-slate-200/50 dark:border-slate-700/50 p-6 text-center">
            <Loader2 className="inline-block animate-spin h-6 w-6 text-blue-500 mb-2" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Loading usage data...</p>
          </div>
        )}

        {/* Needs Config State */}
        {needsConfig && !loading && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg shadow border border-slate-200/50 dark:border-slate-700/50 p-6 text-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xs font-semibold text-slate-900 dark:text-white mb-1.5">Setup Required</h2>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-3 max-w-xs mx-auto">
              Configure your API credentials to start monitoring
            </p>
            <Button
              onClick={() => setShowSettings(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-7 text-[10px]"
            >
              Configure Settings
            </Button>
          </div>
        )}

        {/* Main Content */}
        {usageData && !loading && (
          <div className="space-y-2">
            <UsageDisplay quotaLimits={usageData.quota_limits} />
            <UsageDetails
              modelUsage={usageData.model_usage}
              modelUsageTimeseries={usageData.model_usage_timeseries}
              toolUsage={usageData.tool_usage}
            />
          </div>
        )}

        {/* Footer */}
        {usageData && (
          <div className="mt-3 flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
              Last updated: {formatLastUpdated(usageData.timestamp)}
            </span>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="h-6 text-[10px]"
              title="Refresh Now"
            >
              {loading ? (
                <>
                  <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                  Refreshing
                </>
              ) : (
                <>
                  <RefreshCw className="w-2.5 h-2.5 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
