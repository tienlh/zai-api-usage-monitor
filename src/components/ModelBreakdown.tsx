import React, { useState } from 'react';
import { Bot, Inbox, Zap, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ModelUsageItem {
  model: string;
  token_count: number;
  request_count: number;
}

interface ModelBreakdownProps {
  modelUsage: ModelUsageItem[];
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const ModelBreakdown: React.FC<ModelBreakdownProps> = ({ modelUsage }) => {
  const [sortBy, setSortBy] = useState<'tokens' | 'requests'>('tokens');

  const sortedData = [...modelUsage].sort((a, b) => {
    if (sortBy === 'tokens') {
      return b.token_count - a.token_count;
    }
    return b.request_count - a.request_count;
  });

  if (modelUsage.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Model Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Inbox className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No model usage data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Model Breakdown
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setSortBy('tokens')}
              size="sm"
              variant={sortBy === 'tokens' ? 'default' : 'outline'}
              className="text-xs"
            >
              By Tokens
            </Button>
            <Button
              onClick={() => setSortBy('requests')}
              size="sm"
              variant={sortBy === 'requests' ? 'default' : 'outline'}
              className="text-xs"
            >
              By Requests
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Requests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-6 h-6 rounded-lg flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[180px]" title={item.model}>
                        {item.model}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="w-3 h-3" />
                      {formatNumber(item.token_count)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {item.request_count.toLocaleString()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelBreakdown;
