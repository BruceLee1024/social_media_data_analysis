import React, { useState, useCallback, useMemo } from 'react';
import { Database, RefreshCcw, CheckCircle, AlertCircle, BarChart3, FileText, Target, Save, ShieldCheck } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ProcessingProgress from './components/ProcessingProgress';
import DataPreview from './components/DataPreview';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import DetailedGoalDashboard from './components/Analytics/DetailedGoalDashboard';
import SnapshotManager from './components/SnapshotManager';
import { FileProcessor } from './utils/fileProcessor';
import { DataProcessor } from './utils/dataProcessor';
import { AnalyticsProcessor } from './utils/analyticsProcessor';
import { DataExporter } from './utils/exporter';
import { PlatformData, UnifiedData, AnalyticsData } from './types';

interface ProcessingStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<UnifiedData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string>('');
  const [activeView, setActiveView] = useState<'home' | 'data' | 'analytics' | 'goals' | 'snapshots'>('home');
  const [showSnapshotManager, setShowSnapshotManager] = useState(false);
  const [goalData, setGoalData] = useState<any>(null);

  // 数据质量统计
  const dataQualityStats = useMemo(() => {
    if (processedData.length === 0) return null;
    const total = processedData.length;
    const missingViews = processedData.filter(d => !d['播放量'] || d['播放量'] === 0).length;
    const validCompletion = processedData.filter(d => d['完播率'] && d['完播率'] > 0).length;
    const missingFans = processedData.filter(d => !d['粉丝增量'] || d['粉丝增量'] === 0).length;
    const byPlatform: Record<string, number> = {};
    processedData.forEach(d => {
      const p = d['来源平台'] || '未知';
      byPlatform[p] = (byPlatform[p] || 0) + 1;
    });
    const completeness = Math.round(((total - missingViews) / total) * 100);
    return { total, missingViews, validCompletion, missingFans, byPlatform, completeness };
  }, [processedData]);

  // 包装setGoalData以添加调试日志
  const handleGoalDataChange = (data: any) => {
    console.log('App.tsx - Setting goalData to:', data);
    setGoalData(data);
  };

  const updateStep = (stepId: string, status: ProcessingStep['status'], error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, error } : step
    ));
    if (status === 'processing') {
      setCurrentStep(stepId);
    }
  };

  const initializeSteps = (fileCount: number) => {
    const initialSteps: ProcessingStep[] = [
      { id: 'parse', title: `解析 ${fileCount} 个文件`, status: 'pending' },
      { id: 'detect', title: '识别平台类型', status: 'pending' },
      { id: 'clean', title: '数据清洗和格式化', status: 'pending' },
      { id: 'merge', title: '合并数据', status: 'pending' },
      { id: 'complete', title: '处理完成', status: 'pending' },
    ];
    setSteps(initialSteps);
  };

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
    setProcessedData([]);
    setAnalytics(null);
    setSummary(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setProcessedData([]);
    setAnalytics(null);
    setSummary(null);
  }, []);

  const processFiles = async () => {
    if (files.length === 0) {
      setError('请先选择要处理的文件');
      return;
    }

    setIsProcessing(true);
    setError('');
    setProcessedData([]);
    setAnalytics(null);
    setSummary(null);
    initializeSteps(files.length);

    try {
      // 步骤1: 解析文件
      updateStep('parse', 'processing');
      const platformDataList: PlatformData[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawData = await FileProcessor.processFile(file);
        
        if (!rawData || rawData.length === 0) {
          throw new Error(`文件 ${file.name} 没有有效数据`);
        }

        platformDataList.push({
          platform: '抖音', // 临时设置，下一步会检测
          rawData,
          processedData: [],
          fileName: file.name,
        });
      }
      updateStep('parse', 'completed');

      // 步骤2: 识别平台类型
      updateStep('detect', 'processing');
      for (const platformData of platformDataList) {
        const headers = Object.keys(platformData.rawData[0] || {});
        const detectedPlatform = DataProcessor.detectPlatform(headers);
        
        if (!detectedPlatform) {
          throw new Error(`无法识别文件 ${platformData.fileName} 的平台类型，请检查字段格式`);
        }
        
        platformData.platform = detectedPlatform;
      }
      updateStep('detect', 'completed');

      // 步骤3: 数据清洗和格式化
      updateStep('clean', 'processing');
      const allProcessedData: UnifiedData[] = [];
      const allErrors: string[] = [];

      for (const platformData of platformDataList) {
        const result = DataProcessor.processData(platformData);
        allProcessedData.push(...result.data);
        
        if (result.errors.length > 0) {
          allErrors.push(`${platformData.fileName}: ${result.errors.join(', ')}`);
        }
      }

      if (allProcessedData.length === 0) {
        throw new Error('没有有效的数据被处理，请检查文件格式和内容');
      }
      updateStep('clean', 'completed');

      // 步骤4: 合并数据
      updateStep('merge', 'processing');
      // 按发布时间排序
      allProcessedData.sort((a, b) => 
        new Date(b.发布时间).getTime() - new Date(a.发布时间).getTime()
      );
      
      const summaryReport = DataExporter.generateSummaryReport(allProcessedData);
      updateStep('merge', 'completed');

      // 步骤5: 完成
      updateStep('complete', 'completed');
      setProcessedData(allProcessedData);
      setSummary(summaryReport);
      
      // 生成分析数据
      try {
        const analyticsData = AnalyticsProcessor.generateAnalytics(allProcessedData);
        console.log('分析数据生成成功:', analyticsData);
        setAnalytics(analyticsData);
      } catch (analyticsError) {
        console.error('生成分析数据失败:', analyticsError);
        // 即使分析数据生成失败，也显示数据预览按钮
        setAnalytics(null);
        if (allErrors.length === 0) {
          setError(`数据处理完成，但生成分析图表时出错。数据预览功能仍可正常使用。`);
        }
      }

      if (allErrors.length > 0) {
        setError(`数据处理完成，但发现以下警告：\n${allErrors.join('\n')}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '处理失败';
      setError(errorMessage);
      
      // 标记当前步骤为错误
      if (currentStep) {
        updateStep(currentStep, 'error', errorMessage);
      }
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleExport = () => {
    if (processedData.length > 0) {
      DataExporter.exportToExcel(processedData);
    }
  };

  const resetAll = () => {
    setFiles([]);
    setProcessedData([]);
    setAnalytics(null);
    setSummary(null);
    setSteps([]);
    setError('');
    setIsProcessing(false);
    setCurrentStep('');
    setActiveView('data');
  };

  // 导航栏项目
  const navigationItems = [
    { id: 'home', name: '首页', icon: Database },
    { id: 'data', name: '数据处理', icon: FileText },
    { id: 'analytics', name: '数据分析', icon: BarChart3 },
    { id: 'goals', name: '目标达成', icon: Target },
    { id: 'snapshots', name: '快照管理', icon: Save },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center h-16">
            {/* Logo和标题 - 最左侧 */}
            <div className="flex items-center space-x-4 mr-8">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Database className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent whitespace-nowrap">
                多平台数据整合工具
              </h1>
            </div>
            
            {/* 导航菜单 - 居中 */}
            <div className="flex items-center flex-1 justify-center">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`flex items-center justify-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex-1 mx-1 ${
                      activeView === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </button>
                );
              })}
            </div>
            
            {/* 操作按钮 - 最右侧 */}
            <div className="flex items-center space-x-2 ml-8">
              {(processedData.length > 0 || error) && (
                <button
                  onClick={resetAll}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
                >
                  重新开始
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="px-4 py-8 w-full max-w-none overflow-visible">
        {/* Main Content - 首页单独处理 */}
        {activeView === 'home' ? (
          <div className="relative min-h-[calc(100vh-200px)] overflow-hidden">
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
              <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
              <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-full container mx-auto px-4">
              {/* 英雄区域 */}
              <div className="text-center mb-16 max-w-4xl">
                {/* 主标题 */}
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                    <Database className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6 leading-tight">
                    智能数据整合
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-6">
                    多平台数据，一键统一
                  </h2>
                </div>

                {/* 描述文字 */}
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                  支持抖音、视频号、小红书等主流平台数据文件，
                  <span className="text-blue-600 font-semibold">智能识别平台类型</span>，
                  <span className="text-purple-600 font-semibold">自动统一字段格式</span>，
                  让您专注于数据洞察而非数据处理
                </p>

                {/* 特性标签 */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    🚀 智能识别
                  </span>
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    ⚡ 快速处理
                  </span>
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    📊 可视化分析
                  </span>
                  <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    📈 目标跟踪
                  </span>
                </div>
              </div>

              {/* 功能展示卡片 */}
              <div className="w-full max-w-6xl">
                {/* 主要功能卡片 */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 mb-12">
                  <div className="text-center mb-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      三步完成数据整合
                    </h3>
                    <p className="text-gray-600 text-lg">
                      简单易用的工作流程，让数据处理变得轻松高效
                    </p>
                  </div>

                  {/* 步骤展示 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="group relative">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">1. 上传文件</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          支持多平台数据文件同时上传，
                          自动识别文件格式和平台类型
                        </p>
                      </div>
                    </div>

                    <div className="group relative">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                          <RefreshCcw className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">2. 智能处理</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          AI驱动的数据清洗和格式统一，
                          确保数据质量和一致性
                        </p>
                      </div>
                    </div>

                    <div className="group relative">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">3. 分析导出</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          获得标准化数据和深度分析报告，
                          支持多种格式导出
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 行动按钮 */}
                  <div className="text-center">
                    <button
                      onClick={() => setActiveView('data')}
                      className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="relative z-10 flex items-center">
                        开始数据整合之旅
                        <Database className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                </div>

                {/* 支持平台展示 */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">支持的数据平台</h4>
                    <p className="text-gray-600 text-sm">覆盖主流内容创作和营销平台</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-black to-gray-800 rounded-xl text-white">
                      <span className="font-medium">🎵 抖音 (Excel)</span>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
                      <span className="font-medium">📱 视频号 (CSV)</span>
                    </div>
                    <div className="flex items-center justify-center p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white">
                      <span className="font-medium">📖 小红书 (Excel)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 items-start container mx-auto overflow-visible ${
            activeView === 'analytics' ? 'lg:grid-cols-1' : ''
          }`}>
            {/* Left Column - File Upload */}
            {activeView !== 'analytics' && activeView !== 'goals' && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8 self-start">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    文件上传
                  </h2>
                  
                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    acceptedFiles={files}
                    onRemoveFile={handleRemoveFile}
                    isProcessing={isProcessing}
                  />

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={processFiles}
                      disabled={files.length === 0 || isProcessing}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                          处理中...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 mr-2" />
                          开始处理
                        </>
                      )}
                    </button>

                    {/* 数据处理进度 */}
                    {steps.length > 0 && (
                      <ProcessingProgress steps={steps} currentStep={currentStep} />
                    )}

                    {/* 文件操作按钮 */}
                    {files.length > 0 && (
                      <div className="flex space-x-2">
                        <button
                          onClick={processFiles}
                          disabled={files.length === 0 || isProcessing}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                              处理中...
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4 mr-2" />
                              开始处理
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setFiles([])}
                          disabled={isProcessing}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          清空文件
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Platform Info */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">支持的平台:</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div>• <span className="font-medium">抖音</span>: Excel格式 (.xlsx/.xls)</div>
                      <div>• <span className="font-medium">视频号</span>: CSV格式 (.csv)</div>
                      <div>• <span className="font-medium">小红书</span>: Excel格式 (.xlsx/.xls)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 右侧内容区域 */}
            <div className={`space-y-6 w-full overflow-visible ${
              activeView === 'analytics' || activeView === 'goals' ? 'lg:col-span-4' : 'lg:col-span-3'
            }`}>
              {/* Error Message */}
              {error && activeView === 'data' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">处理警告</h3>
                      <pre className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {processedData.length > 0 && !error && activeView === 'data' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">处理成功</h3>
                      <p className="text-sm text-green-700 mt-1">
                        成功处理 {processedData.length} 条数据，可以预览和导出结果
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Progress */}
              {steps.length > 0 && activeView === 'data' && (
                <ProcessingProgress steps={steps} currentStep={currentStep} />
              )}

              {/* 数据质量报告 */}
              {activeView === 'data' && dataQualityStats && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">数据质量报告</h3>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                      dataQualityStats.completeness >= 80 ? 'bg-green-100 text-green-700' :
                      dataQualityStats.completeness >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>完整度 {dataQualityStats.completeness}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-gray-500">总条数</div>
                      <div className="font-semibold text-gray-900 text-sm">{dataQualityStats.total}</div>
                    </div>
                    <div className={`rounded-lg p-2 ${dataQualityStats.missingViews > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="text-gray-500">播放量缺失</div>
                      <div className={`font-semibold text-sm ${dataQualityStats.missingViews > 0 ? 'text-red-600' : 'text-gray-900'}`}>{dataQualityStats.missingViews} 条</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-gray-500">完播率有效</div>
                      <div className="font-semibold text-gray-900 text-sm">{dataQualityStats.validCompletion} 条</div>
                    </div>
                    <div className={`rounded-lg p-2 ${dataQualityStats.missingFans > dataQualityStats.total * 0.5 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                      <div className="text-gray-500">粉丝增量缺失</div>
                      <div className={`font-semibold text-sm ${dataQualityStats.missingFans > dataQualityStats.total * 0.5 ? 'text-yellow-600' : 'text-gray-900'}`}>{dataQualityStats.missingFans} 条</div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <div className="text-xs text-gray-500 mb-1">平台分布</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(dataQualityStats.byPlatform).map(([platform, count]) => (
                        <span key={platform} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {platform}: {count}条
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 数据处理页面 */}
              {activeView === 'data' && (
                <>
                  {/* Data Preview */}
                  {processedData.length > 0 && summary && (
                    <DataPreview
                      data={processedData}
                      onExport={handleExport}
                      summary={summary}
                    />
                  )}

                  {/* Welcome Card for Data Processing */}
                  {files.length === 0 && steps.length === 0 && activeView === 'data' && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        准备处理您的数据文件
                      </h3>
                      <p className="text-gray-600 mb-4">
                        请在左侧上传您的平台数据文件，支持同时上传多个文件
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* 数据分析页面 */}
              {activeView === 'analytics' && analytics && (
                <AnalyticsDashboard analytics={analytics} summary={summary} rawData={processedData} goalData={goalData} />
              )}

              {/* 数据分析页面 - 无数据提示 */}
              {activeView === 'analytics' && !analytics && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    暂无分析数据
                  </h3>
                  <p className="text-gray-600 mb-4">
                    请先处理数据文件，然后查看数据分析结果
                  </p>
                  <button
                    onClick={() => setActiveView('data')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    去处理数据
                  </button>
                </div>
              )}

              {/* 目标达成页面 */}
              {activeView === 'goals' && processedData.length > 0 && analytics && (
                <DetailedGoalDashboard 
                  metrics={analytics.performanceMetrics} 
                  analytics={analytics}
                  goalData={goalData}
                  onGoalDataChange={handleGoalDataChange}
                />
              )}

              {/* 目标达成页面 - 无数据提示 */}
              {activeView === 'goals' && (processedData.length === 0 || !analytics) && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    暂无目标数据
                  </h3>
                  <p className="text-gray-600 mb-4">
                    请先处理数据文件，然后查看目标达成情况
                  </p>
                  <button
                    onClick={() => setActiveView('data')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    去处理数据
                  </button>
                </div>
              )}

              {/* 快照管理页面 */}
              {activeView === 'snapshots' && (
                <SnapshotManager 
                  processedData={processedData}
                  analytics={analytics}
                  summary={summary}
                  goalData={goalData}
                  onLoadSnapshot={(data, analytics, summary, goalData) => {
                    console.log('App.tsx - Loading snapshot data:', { data, analytics, summary, goalData });
                    setProcessedData(data);
                    setAnalytics(analytics);
                    setSummary(summary);
                    setGoalData(goalData);
                    console.log('App.tsx - Goal data set to:', goalData);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;