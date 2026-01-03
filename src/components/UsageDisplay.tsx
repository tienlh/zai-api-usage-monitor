import React from 'react';
import { Zap, Wrench, Inbox } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

interface UsageDisplayProps {
  quotaLimits: QuotaLimit[];
}

const UsageDisplay: React.FC<UsageDisplayProps> = ({ quotaLimits }) => {
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-gradient-to-r from-red-500 to-rose-600';
    if (percentage >= 70) return 'bg-gradient-to-r from-amber-500 to-orange-600';
    if (percentage >= 50) return 'bg-gradient-to-r from-yellow-500 to-amber-600';
    return 'bg-gradient-to-r from-emerald-500 to-green-600';
  };

  const getBgGradient = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
    if (percentage >= 70) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50';
    if (percentage >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50';
    return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50';
  };

  const getTextColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-700 dark:text-red-200';
    if (percentage >= 70) return 'text-amber-700 dark:text-amber-200';
    if (percentage >= 50) return 'text-yellow-700 dark:text-yellow-200';
    return 'text-emerald-700 dark:text-emerald-200';
  };

  const tokenLimit = quotaLimits.find(l => l.type_field.includes('Token'));
  const mcpLimit = quotaLimits.find(l => l.type_field.includes('MCP'));

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg shadow border border-slate-200/50 dark:border-slate-700/50 p-2">
      <div className="flex gap-2">
        {tokenLimit && (
          <div className={`flex-1 p-2 rounded-md border ${getBgGradient(tokenLimit.percentage)} backdrop-blur-sm transition-all duration-300`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate">Tokens</span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400">5hr</span>
                </div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${getTextColor(tokenLimit.percentage)}`}>
                {tokenLimit.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-1.5">
              <Progress
                value={Math.min(tokenLimit.percentage, 100)}
                className="h-1.5"
              />
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${getProgressColor(tokenLimit.percentage)} transition-all duration-500 ease-out shadow-sm pointer-events-none`}
                style={{ width: `${Math.min(tokenLimit.percentage, 100)}%` }}
              />
            </div>
            {tokenLimit.remaining !== undefined && tokenLimit.usage !== undefined && (
              <div className="flex justify-between mt-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span>{(tokenLimit.usage / 1000000).toFixed(1)}M</span>
                <span>{(tokenLimit.remaining / 1000000).toFixed(1)}M left</span>
              </div>
            )}
          </div>
        )}

        {mcpLimit && (
          <div className={`flex-1 p-2 rounded-md border ${getBgGradient(mcpLimit.percentage)} backdrop-blur-sm transition-all duration-300`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Wrench className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate">MCP</span>
                  <span className="text-[9px] text-slate-600 dark:text-slate-400">1mo</span>
                </div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${getTextColor(mcpLimit.percentage)}`}>
                {mcpLimit.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-1.5">
              <Progress
                value={Math.min(mcpLimit.percentage, 100)}
                className="h-1.5"
              />
              <div
                className={`absolute top-0 left-0 h-full rounded-full ${getProgressColor(mcpLimit.percentage)} transition-all duration-500 ease-out shadow-sm pointer-events-none`}
                style={{ width: `${Math.min(mcpLimit.percentage, 100)}%` }}
              />
            </div>
            {mcpLimit.current_value !== undefined && mcpLimit.unit !== undefined && mcpLimit.number !== undefined && (
              <div className="flex justify-between mt-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span>{mcpLimit.current_value}/{mcpLimit.unit * mcpLimit.number}</span>
                {mcpLimit.remaining !== undefined && <span>{mcpLimit.remaining} left</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {!tokenLimit && !mcpLimit && (
        <div className="text-center py-4">
          <Inbox className="w-6 h-6 mx-auto mb-1.5 text-slate-400" />
          <p className="text-[10px] text-slate-500 dark:text-slate-400">No usage data</p>
        </div>
      )}
    </div>
  );
};

export default UsageDisplay;
