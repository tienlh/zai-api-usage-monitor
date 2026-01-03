import React, { useState } from 'react';
import { Wrench, Inbox, Flame } from 'lucide-react';
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

interface ToolUsageItem {
  tool_name: string;
  usage_count: number;
}

interface ToolUsageProps {
  toolUsage: ToolUsageItem[];
}

const ToolUsage: React.FC<ToolUsageProps> = ({ toolUsage }) => {
  const [sortBy, setSortBy] = useState<'count' | 'name'>('count');

  const sortedData = [...toolUsage].sort((a, b) => {
    if (sortBy === 'count') {
      return b.usage_count - a.usage_count;
    }
    return a.tool_name.localeCompare(b.tool_name);
  });

  if (toolUsage.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            MCP Tool Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Inbox className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No tool usage data available</p>
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
            <Wrench className="w-5 h-5" />
            MCP Tool Usage
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setSortBy('count')}
              size="sm"
              variant={sortBy === 'count' ? 'default' : 'outline'}
              className="text-xs"
            >
              By Count
            </Button>
            <Button
              onClick={() => setSortBy('name')}
              size="sm"
              variant={sortBy === 'name' ? 'default' : 'outline'}
              className="text-xs"
            >
              By Name
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="text-right">Calls</TableHead>
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
                      <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[220px]" title={item.tool_name}>
                        {item.tool_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="gap-1">
                      <Flame className="w-3 h-3" />
                      {item.usage_count.toLocaleString()}
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

export default ToolUsage;
