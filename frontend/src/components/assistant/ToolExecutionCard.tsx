"use client";

import { ToolCall } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Wrench } from 'lucide-react';

interface ToolExecutionCardProps {
  toolCall: ToolCall;
}

export default function ToolExecutionCard({ toolCall }: ToolExecutionCardProps) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'success':
        return 'border-green-200 bg-green-50 text-gray-900';
      case 'error':
        return 'border-red-200 bg-red-50 text-gray-900';
      case 'running':
        return 'border-blue-200 bg-blue-50 text-gray-900';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-900';
    }
  };

  return (
    <Card className={`p-2 ${getStatusColor()} transition-colors`}>
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs text-gray-900">🛠️ {toolCall.tool_name}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 !text-gray-700 border-gray-400">
              {toolCall.status}
            </Badge>
          </div>

          {toolCall.error && (
            <div className="text-[10px] text-red-700 font-medium mt-1">
              Error: {toolCall.error}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
