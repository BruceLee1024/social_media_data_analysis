import React from 'react';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';

interface AIOverviewCardProps {
  content: string;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
}

const AIOverviewCard: React.FC<AIOverviewCardProps> = ({ content, loading, error, onGenerate }) => {
  return (
    <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-indigo-200 shadow-md p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">AI 概览</h3>
            <p className="text-xs text-gray-500">基于当前筛选数据生成关键结论与优先建议</p>
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? '生成中…' : '生成 AI 概览'}
        </button>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-16">
        {content || '点击“生成 AI 概览”获取整体诊断。'}
      </div>
    </div>
  );
};

export default AIOverviewCard;
