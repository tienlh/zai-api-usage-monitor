import React, { useState } from 'react';
import { Bot, Wrench, Zap, BarChart3, Flame, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ModelUsageItem {
  model: string;
  token_count: number;
  request_count: number;
}

interface ToolUsageItem {
  tool_name: string;
  usage_count: number;
}

interface UsageDetailsProps {
  modelUsage: ModelUsageItem[];
  toolUsage: ToolUsageItem[];
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const UsageDetails: React.FC<UsageDetailsProps> = ({ modelUsage, toolUsage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'models' | 'tools'>('models');
  const [modelSortBy, setModelSortBy] = useState<'tokens' | 'requests'>('tokens');
  const [toolSortBy, setToolSortBy] = useState<'count' | 'name'>('count');

  const sortedModels = [...modelUsage].sort((a, b) => {
    if (modelSortBy === 'tokens') return b.token_count - a.token_count;
    return b.request_count - a.request_count;
  });

  const sortedTools = [...toolUsage].sort((a, b) => {
    if (toolSortBy === 'count') return b.usage_count - a.usage_count;
    return a.tool_name.localeCompare(b.tool_name);
  });

  const hasData = modelUsage.length > 0 || toolUsage.length > 0;

  if (!hasData) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-lg shadow border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="w-full h-8 px-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Details
          </span>
          <span className="text-[10px] text-slate-500">
            ({modelUsage.length} models, {toolUsage.length} tools)
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </Button>

      {isExpanded && (
        <div className="border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                <Button
                  onClick={() => setActiveTab('models')}
                  size="sm"
                  variant={activeTab === 'models' ? 'default' : 'ghost'}
                  className="text-xs h-7 px-3"
                >
                  <Bot className="w-3.5 h-3.5 mr-1.5" />
                  Models ({modelUsage.length})
                </Button>
                <Button
                  onClick={() => setActiveTab('tools')}
                  size="sm"
                  variant={activeTab === 'tools' ? 'default' : 'ghost'}
                  className="text-xs h-7 px-3"
                >
                  <Wrench className="w-3.5 h-3.5 mr-1.5" />
                  Tools ({toolUsage.length})
                </Button>
              </div>
              {activeTab === 'models' && modelUsage.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    onClick={() => setModelSortBy('tokens')}
                    size="sm"
                    variant={modelSortBy === 'tokens' ? 'outline' : 'ghost'}
                    className="text-xs h-7 px-2"
                  >
                    <Zap className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => setModelSortBy('requests')}
                    size="sm"
                    variant={modelSortBy === 'requests' ? 'outline' : 'ghost'}
                    className="text-xs h-7 px-2"
                  >
                    <BarChart3 className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {activeTab === 'tools' && toolUsage.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    onClick={() => setToolSortBy('count')}
                    size="sm"
                    variant={toolSortBy === 'count' ? 'outline' : 'ghost'}
                    className="text-xs h-7 px-2"
                  >
                    <Flame className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => setToolSortBy('name')}
                    size="sm"
                    variant={toolSortBy === 'name' ? 'outline' : 'ghost'}
                    className="text-xs h-7 px-2"
                  >
                    A-Z
                  </Button>
                </div>
              )}
            </div>

            {activeTab === 'models' && modelUsage.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-xs py-1">Model</TableHead>
                      <TableHead className="h-8 text-xs text-right py-1">Tokens</TableHead>
                      <TableHead className="h-8 text-xs text-right py-1">Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedModels.map((item, index) => (
                      <TableRow key={index} className="h-8">
                        <TableCell className="text-xs py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-500 w-3">{index + 1}</span>
                            <span className="font-medium truncate text-slate-900 dark:text-slate-100 text-[10px]" title={item.model}>
                              {item.model}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right py-1">
                          <span className="text-[10px] font-medium">{formatNumber(item.token_count)}</span>
                        </TableCell>
                        <TableCell className="text-xs text-right py-1">
                          <span className="text-[10px] font-medium">{item.request_count.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === 'tools' && toolUsage.length > 0 && (
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead className="h-8 text-xs py-1">Tool</TableHead>
                      <TableHead className="h-8 text-xs text-right py-1">Calls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTools.map((item, index) => (
                      <TableRow key={index} className="h-8">
                        <TableCell className="text-xs py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-500 w-3">{index + 1}</span>
                            <span className="font-medium truncate text-slate-900 dark:text-slate-100 text-[10px]" title={item.tool_name}>
                              {item.tool_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right py-1">
                          <span className="text-[10px] font-medium">{item.usage_count.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageDetails;
