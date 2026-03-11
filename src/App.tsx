import React, { useState, useCallback, useMemo } from 'react';
import { Database, RefreshCcw, CheckCircle, AlertCircle, BarChart3, FileText, Target, Save, ShieldCheck, PlusCircle, X } from 'lucide-react';
import { useTheme, THEMES, Theme } from './utils/themeContext';
import FileUpload from './components/FileUpload';
import HistoricalDataUpload from './components/HistoricalDataUpload';
import ProcessingProgress from './components/ProcessingProgress';
import DataPreview from './components/DataPreview';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import DetailedGoalDashboard from './components/Analytics/DetailedGoalDashboard';
import SnapshotManager from './components/SnapshotManager';
import LandingPage from './components/LandingPage';
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
  const { theme, config: themeConfig, setTheme } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [appendMode, setAppendMode] = useState(false);
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
  const [historicalData, setHistoricalData] = useState<UnifiedData[]>([]);

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
    if (!appendMode) {
      setProcessedData([]);
      setAnalytics(null);
      setSummary(null);
    }
  }, [appendMode]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (!appendMode) {
      setProcessedData([]);
      setAnalytics(null);
      setSummary(null);
    }
  }, [appendMode]);

  const processFiles = async () => {
    if (files.length === 0) {
      setError('请先选择要处理的文件');
      return;
    }

    setIsProcessing(true);
    setError('');
    if (!appendMode) {
      setProcessedData([]);
      setAnalytics(null);
      setSummary(null);
    }
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
      // 增量模式：合并已有数据
      const finalData = appendMode ? [...processedData, ...allProcessedData] : allProcessedData;
      // 按发布时间排序
      finalData.sort((a, b) => 
        new Date(b.发布时间).getTime() - new Date(a.发布时间).getTime()
      );
      
      const summaryReport = DataExporter.generateSummaryReport(finalData);
      updateStep('merge', 'completed');

      // 步骤5: 完成
      updateStep('complete', 'completed');
      setProcessedData(finalData);
      setSummary(summaryReport);
      
      // 生成分析数据
      try {
        const analyticsData = AnalyticsProcessor.generateAnalytics(finalData);
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
    setHistoricalData([]);
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

  // 主题色映射（完整 Tailwind class 字符串，避免 JIT 裁剪）
  const navActiveClass: Record<string, string> = {
    blue:   'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg',
    green:  'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg',
    purple: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg',
  };
  const btnPrimaryClass: Record<string, string> = {
    blue:   'bg-blue-600 hover:bg-blue-700',
    green:  'bg-emerald-600 hover:bg-emerald-700',
    purple: 'bg-violet-600 hover:bg-violet-700',
  };

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
                        ? (navActiveClass[theme] ?? navActiveClass.blue)
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
            <div className="flex items-center space-x-3 ml-8">
              {/* 主题切换 */}
              <div className="flex items-center space-x-1.5">
                {(Object.keys(THEMES) as Theme[]).map(t => (
                  <button
                    key={t}
                    title={`${THEMES[t].label}色主题`}
                    onClick={() => setTheme(t)}
                    className={`w-5 h-5 rounded-full transition-all duration-200 ${
                      theme === t ? 'ring-2 ring-offset-1 ring-gray-400 scale-125' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: THEMES[t].dot }}
                  />
                ))}
              </div>
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
          <LandingPage onNavigateToData={() => setActiveView('data')} />
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
                    {/* 增量导入开关 */}
                    <div className="flex items-center justify-between px-1 py-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <PlusCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">增量导入</span>
                      </div>
                      <button
                        onClick={() => setAppendMode(prev => !prev)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          appendMode ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          appendMode ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    {appendMode && (
                      <p className="text-xs text-blue-600 px-1">新导入数据将追加到已有 {processedData.length} 条记录</p>
                    )}
                    {/* 开始处理 + 清空文件（合并一行，去除重复按钮） */}
                    <div className="flex gap-2">
                      <button
                        onClick={processFiles}
                        disabled={files.length === 0 || isProcessing}
                        className={`flex-1 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center ${btnPrimaryClass[theme] ?? btnPrimaryClass.blue}`}
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
                      {files.length > 0 && (
                        <button
                          onClick={() => setFiles([])}
                          disabled={isProcessing}
                          title="清空已选文件"
                          className="px-3 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* 数据处理进度 */}
                    {steps.length > 0 && (
                      <ProcessingProgress steps={steps} currentStep={currentStep} />
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

                  {/* 历史数据上传 */}
                  <HistoricalDataUpload
                    historicalData={historicalData}
                    onHistoricalDataLoaded={setHistoricalData}
                    isProcessing={isProcessing}
                  />
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
                <AnalyticsDashboard analytics={analytics} summary={summary} rawData={processedData} goalData={goalData} historicalData={historicalData} />
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
                  historicalData={historicalData}
                  onLoadSnapshot={(data, analytics, summary, goalData, historicalData) => {
                    console.log('App.tsx - Loading snapshot data:', { data, analytics, summary, goalData });
                    setProcessedData(data);
                    setAnalytics(analytics);
                    setSummary(summary);
                    setGoalData(goalData);
                    if (historicalData) setHistoricalData(historicalData);
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