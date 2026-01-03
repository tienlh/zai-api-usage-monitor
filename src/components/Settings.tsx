import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings as SettingsIcon, Key, Globe, Timer, Loader2, FlaskRound, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Config {
  auth_token: string;
  base_url: string;
  refresh_interval_minutes: number;
}

interface SettingsProps {
  config: Config;
  onSave: () => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsProps> = ({ config, onSave, onClose }) => {
  const [authToken, setAuthToken] = useState(config.auth_token || '');
  const [baseUrl, setBaseUrl] = useState(config.base_url || 'https://api.z.ai/api/anthropic');
  const [refreshInterval, setRefreshInterval] = useState(config.refresh_interval_minutes || 5);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setError(null);

    try {
      await invoke('save_config', {
        authToken,
        baseUrl,
        refreshIntervalMinutes: refreshInterval,
      });

      await invoke('get_usage_data');
      alert('✅ Connection successful!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await invoke('save_config', {
        authToken,
        baseUrl,
        refreshIntervalMinutes: refreshInterval,
      });
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Settings</DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configure your API credentials</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="auth-token" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Auth Token
            </Label>
            <Input
              id="auth-token"
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">Your Z.ai API authentication token</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-url" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Base URL
            </Label>
            <Select value={baseUrl} onValueChange={setBaseUrl}>
              <SelectTrigger id="base-url" className="font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="https://api.z.ai/api/anthropic" className="font-mono text-sm">
                  https://api.z.ai/api/anthropic
                </SelectItem>
                <SelectItem value="https://open.bigmodel.cn/api/anthropic" className="font-mono text-sm">
                  https://open.bigmodel.cn/api/anthropic
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refresh-interval" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Refresh Interval
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="refresh-interval"
                type="number"
                min="1"
                max="60"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
                className="flex-1"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">minutes</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">How often to fetch usage data</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm break-words">{error}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleTest}
            disabled={testing || !authToken}
            variant="outline"
            className="flex-1"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <FlaskRound className="w-4 h-4 mr-2" />
                Test
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !authToken}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
