import React from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProcessingStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ProcessingProgressProps {
  steps: ProcessingStep[];
  currentStep?: string;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ steps }) => {
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const hasError = steps.some(s => s.status === 'error');
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const getCircleStyle = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed': return 'bg-green-500 border-green-500 text-white';
      case 'error':     return 'bg-red-500 border-red-500 text-white';
      case 'processing': return 'bg-blue-500 border-blue-500 text-white';
      default:          return 'bg-white border-gray-300 text-gray-400';
    }
  };

  const getRowStyle = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':  return 'bg-green-50';
      case 'error':      return 'bg-red-50';
      case 'processing': return 'bg-blue-50 shadow-sm';
      default:           return 'bg-gray-50/40';
    }
  };

  const getTitleColor = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':  return 'text-green-700';
      case 'error':      return 'text-red-700';
      case 'processing': return 'text-blue-700';
      default:           return 'text-gray-400';
    }
  };

  const getConnectorColor = (step: ProcessingStep) =>
    step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* 标题 + 整体进度条 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900">处理进度</h3>
          <span className="text-sm font-medium text-gray-500">{completedCount} / {steps.length} 步完成</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              hasError ? 'bg-red-500' : completedCount === steps.length ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 步骤列表 */}
      <div>
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex items-stretch">
            {/* 左侧：圆圈 + 连接线 */}
            <div className="flex flex-col items-center mr-3 shrink-0">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-300 ${getCircleStyle(step)}`}>
                {step.status === 'completed'  && <CheckCircle className="w-4 h-4" />}
                {step.status === 'error'      && <AlertCircle className="w-4 h-4" />}
                {step.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
                {step.status === 'pending'    && <span className="text-xs font-bold">{index + 1}</span>}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 transition-colors duration-300 ${getConnectorColor(step)}`} />
              )}
            </div>

            {/* 右侧：内容 */}
            <div className={`flex-1 min-w-0 mb-3 px-3 py-2 rounded-lg transition-all duration-300 ${getRowStyle(step)}`}>
              <p className={`text-sm font-medium ${getTitleColor(step)}`}>
                {step.title}
              </p>
              {step.error && (
                <p className="text-xs text-red-600 mt-1">{step.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingProgress;
