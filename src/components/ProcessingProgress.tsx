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

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ steps, currentStep }) => {
  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'processing':
        return 'text-blue-700';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">处理进度</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getStepIcon(step)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${getStepColor(step)}`}>
                {step.title}
              </p>
              {step.error && (
                <p className="text-sm text-red-600 mt-1">{step.error}</p>
              )}
              {step.status === 'processing' && currentStep === step.id && (
                <div className="mt-2">
                  <div className="bg-blue-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse w-1/2"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingProgress;