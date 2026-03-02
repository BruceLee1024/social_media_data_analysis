import React, { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, Target, Award, Eye, Heart, MessageCircle, Share2, BookmarkPlus, Calendar, ChevronDown, ChevronUp, Edit3, Save, X, Plus, AlertTriangle } from 'lucide-react';
import { PerformanceMetrics } from '../../types';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';
import GoalSummaryTable from './GoalSummaryTable';

interface DetailedGoalDashboardProps {
  metrics: PerformanceMetrics;
  analytics: any;
  goalData?: any;
  onGoalDataChange?: (data: any) => void;
}

interface MonthlyGoal {
  month: string;
  period: string;
  contentGoals: {
    totalVideos: number;
    interviewVideos: number;
    otherVideos: number;
  };
  fansGoals: {
    douyin: number;
    shipinhao: number;
    xiaohongshu: number;
    total: number;
  };
  engagementGoals: {
    totalViews: number; // 次
    viralCount: number;
    totalInteractions: number; // 次
    completionRate: number; // %
  };
}

const STORAGE_KEY = 'social_media_monthly_goals_v2';

const DEFAULT_MONTHLY_GOALS: MonthlyGoal[] = [
  {
    month: '10月', period: '2024-10',
    contentGoals: { totalVideos: 25, interviewVideos: 20, otherVideos: 5 },
    fansGoals: { douyin: 1900, shipinhao: 2400, xiaohongshu: 700, total: 5000 },
    engagementGoals: { totalViews: 40, viralCount: 1, totalInteractions: 12500, completionRate: 12 }
  },
  {
    month: '11月', period: '2024-11',
    contentGoals: { totalVideos: 25, interviewVideos: 20, otherVideos: 5 },
    fansGoals: { douyin: 2700, shipinhao: 3300, xiaohongshu: 1000, total: 7000 },
    engagementGoals: { totalViews: 50, viralCount: 1, totalInteractions: 17500, completionRate: 12 }
  },
  {
    month: '12月', period: '2024-12',
    contentGoals: { totalVideos: 25, interviewVideos: 20, otherVideos: 5 },
    fansGoals: { douyin: 3400, shipinhao: 4300, xiaohongshu: 1300, total: 8000 },
    engagementGoals: { totalViews: 60, viralCount: 1, totalInteractions: 20000, completionRate: 12 }
  }
];

const DetailedGoalDashboard: React.FC<DetailedGoalDashboardProps> = ({ metrics, analytics, goalData, onGoalDataChange }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('年度');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content', 'fans', 'engagement']));
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [dynamicMonthlyGoals, setDynamicMonthlyGoals] = useState<MonthlyGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_MONTHLY_GOALS;
    } catch { return DEFAULT_MONTHLY_GOALS; }
  });
  const [newMonthForm, setNewMonthForm] = useState({
    period: '', douyinFans: 0, shipinhaoFans: 0, xiaohongshuFans: 0,
    totalVideos: 20, interviewVideos: 15, otherVideos: 5,
    totalViews: 0, viralCount: 1, totalInteractions: 0, completionRate: 12
  });
  const [editingData, setEditingData] = useState(() => {
    // 如果有传入的goalData，使用它；否则使用默认值
    if (goalData) {
      return goalData;
    }
    return {
      content: {
        totalVideos: 14, // 基于视频号的当前视频数量
        interviewVideos: 0,
        otherVideos: 0
      },
      fans: {
        douyin: 0,
        shipinhao: 0,
        xiaohongshu: 0,
        total: 0
      }
    };
  });

  // 当goalData变化时，更新editingData
  useEffect(() => {
    if (goalData) {
      console.log('Loading goalData from snapshot:', goalData);
      setEditingData(goalData);
    }
  }, [goalData]);

  const saveMonthlyGoals = (goals: MonthlyGoal[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    setDynamicMonthlyGoals(goals);
  };

  const handleAddMonth = () => {
    if (!newMonthForm.period || !/^\d{4}-\d{2}$/.test(newMonthForm.period)) return;
    const [y, m] = newMonthForm.period.split('-').map(Number);
    const curY = new Date().getFullYear();
    const displayName = y === curY ? `${m}月` : `${y}年${m}月`;
    const existing = dynamicMonthlyGoals.find(g => g.period === newMonthForm.period);
    if (existing) { alert('该月份目标已存在'); return; }
    const newGoal: MonthlyGoal = {
      month: displayName,
      period: newMonthForm.period,
      contentGoals: { totalVideos: newMonthForm.totalVideos, interviewVideos: newMonthForm.interviewVideos, otherVideos: newMonthForm.otherVideos },
      fansGoals: { douyin: newMonthForm.douyinFans, shipinhao: newMonthForm.shipinhaoFans, xiaohongshu: newMonthForm.xiaohongshuFans, total: newMonthForm.douyinFans + newMonthForm.shipinhaoFans + newMonthForm.xiaohongshuFans },
      engagementGoals: { totalViews: newMonthForm.totalViews, viralCount: newMonthForm.viralCount, totalInteractions: newMonthForm.totalInteractions, completionRate: newMonthForm.completionRate }
    };
    saveMonthlyGoals([...dynamicMonthlyGoals, newGoal]);
    setSelectedMonth(displayName);
    setShowAddMonthModal(false);
    setNewMonthForm({ period: '', douyinFans: 0, shipinhaoFans: 0, xiaohongshuFans: 0, totalVideos: 20, interviewVideos: 15, otherVideos: 5, totalViews: 0, viralCount: 1, totalInteractions: 0, completionRate: 12 });
  };

  // 当月预计达成百分比
  const computeForecastPct = (current: number, target: number): number | null => {
    if (selectedMonth === '年度' || target <= 0) return null;
    const goal = dynamicMonthlyGoals.find(g => g.month === selectedMonth);
    if (!goal) return null;
    const parts = goal.period.split('-').map(Number);
    const [gy, gm] = parts;
    const today = new Date();
    if (today.getFullYear() !== gy || today.getMonth() + 1 !== gm) return null;
    const daysInMonth = new Date(gy, gm, 0).getDate();
    const elapsed = today.getDate();
    if (elapsed === 0) return null;
    return ((current / elapsed) * daysInMonth / target) * 100;
  };

  // 目标数据 (历史兼容保留，使用动态状态)
  const monthlyGoals = dynamicMonthlyGoals;

  // 年度目标
  const yearlyGoals = {
    contentGoals: {
      totalVideos: 75,
      interviewVideos: 60,
      otherVideos: 15
    },
    fansGoals: {
      douyin: 8000,
      shipinhao: 10000,
      xiaohongshu: 2000,
      total: 20000
    },
    engagementGoals: {
      totalViews: 2000000,
      viralCount: 3,
      totalInteractions: 50000, // 修复：改为50000次
      completionRate: 12
    }
  };

  // 获取当前目标
  const currentGoal = selectedMonth === '年度' ? yearlyGoals : monthlyGoals.find(goal => goal.month === selectedMonth) || monthlyGoals[0];

  // 计算当前数据（使用实际数据和手动输入的数据结合）
  const currentData = {
    content: {
      totalVideos: metrics?.totalContent || editingData.content.totalVideos, // 优先使用实际的已发布视频号数据
      interviewVideos: editingData.content.interviewVideos,
      otherVideos: editingData.content.otherVideos
    },
    fans: {
      douyin: editingData.fans.douyin,
      shipinhao: editingData.fans.shipinhao,
      xiaohongshu: editingData.fans.xiaohongshu,
      total: editingData.fans.douyin + editingData.fans.shipinhao + editingData.fans.xiaohongshu // 自动计算总计
    },
    engagement: {
      totalViews: metrics?.totalViews || 0, // 修复：使用实际总播放量
      viralCount: metrics?.viralContentCount || 0, // 修复：使用实际的爆款视频数量
      totalInteractions: (metrics?.totalLikes + metrics?.totalComments + metrics?.totalShares + (metrics?.totalBookmarks || 0)) || 0, // 修复：使用实际总互动量
      completionRate: metrics?.avgCompletionRate || 0 // 修复：使用实际完播率
    }
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return target > 0 ? (current / target) * 100 : 0;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (percentage: number): string => {
    if (percentage >= 100) return '已完成';
    if (percentage >= 80) return '接近完成';
    if (percentage >= 60) return '进行中';
    return '需加油';
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleSaveEdit = () => {
    setEditMode(false);
    console.log('DetailedGoalDashboard - Saving edit data:', editingData);
    // 将编辑的数据传递给父组件
    if (onGoalDataChange) {
      onGoalDataChange(editingData);
      console.log('DetailedGoalDashboard - Called onGoalDataChange with:', editingData);
    }
  };

  const handleInputChange = (category: 'content' | 'fans', field: string, value: number) => {
    setEditingData((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const renderProgressCard = (title: string, current: number, target: number, unit: string, icon: React.ElementType, color: string) => {
    const Icon = icon;
    const percentage = getProgressPercentage(current, target);
    const progressColor = getProgressColor(percentage);
    const statusText = getStatusText(percentage);
    const forecastPct = computeForecastPct(current, target);

    return (
      <div className={`bg-${color}-50 rounded-lg p-4 border border-${color}-100`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className={`w-4 h-4 text-${color}-600`} />
            <span className="text-sm font-medium text-gray-900">{title}</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            percentage >= 100 ? 'bg-green-100 text-green-800' :
            percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
            percentage >= 60 ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {statusText}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">进度</span>
            <span className={`font-semibold text-${color}-900`}>
              {unit === '%' ? `${current.toFixed(1)}` : AnalyticsProcessor.formatNumber(current)} / {unit === '%' ? `${target}` : AnalyticsProcessor.formatNumber(target)} {unit}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold text-${color}-900`}>{percentage.toFixed(1)}%</span>
            {forecastPct !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                forecastPct >= 100 ? 'bg-green-100 text-green-700' :
                forecastPct >= 80 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {forecastPct < 80 && <AlertTriangle className="w-3 h-3" />}
                预计{forecastPct.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEditableProgressCard = (title: string, current: number, target: number, unit: string, icon: React.ElementType, color: string, category: 'content' | 'fans', field: string) => {
    const Icon = icon;
    const percentage = getProgressPercentage(current, target);
    const progressColor = getProgressColor(percentage);
    const statusText = getStatusText(percentage);

    return (
      <div className={`bg-${color}-50 rounded-lg p-4 border border-${color}-100`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className={`w-4 h-4 text-${color}-600`} />
            <span className="text-sm font-medium text-gray-900">{title}</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            percentage >= 100 ? 'bg-green-100 text-green-800' :
            percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
            percentage >= 60 ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {statusText}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">进度</span>
            <div className="flex items-center space-x-2">
              {editMode ? (
                <input
                  type="number"
                  value={current}
                  onChange={(e) => handleInputChange(category, field, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center"
                  min="0"
                />
              ) : (
                <span className={`font-semibold text-${color}-900`}>
                  {AnalyticsProcessor.formatNumber(current)}
                </span>
              )}
              <span className={`font-semibold text-${color}-900`}>
                / {AnalyticsProcessor.formatNumber(target)} {unit}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="text-right">
            <span className={`text-sm font-semibold text-${color}-900`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 头部控制区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold mb-2">目标达成情况</h2>
            <p className="text-blue-100">跟踪内容创作、粉丝增长和互动表现的进度</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* 编辑模式切换 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEditToggle}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  editMode 
                    ? 'bg-white/20 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                <span>{editMode ? '保存' : '编辑'}</span>
              </button>
              {editMode && (
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>取消</span>
                </button>
              )}
            </div>
            
            {/* 时间选择器 */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="年度" className="text-gray-900">年度目标</option>
                {dynamicMonthlyGoals.map(g => (
                  <option key={g.period} value={g.month} className="text-gray-900">{g.month}目标</option>
                ))}
              </select>
              <button
                onClick={() => setShowAddMonthModal(true)}
                className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="添加月份目标"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 粉丝增长目标 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('fans')}
        >
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">粉丝增长目标</h3>
          </div>
          {expandedSections.has('fans') ? 
            <ChevronUp className="w-5 h-5 text-gray-500" /> : 
            <ChevronDown className="w-5 h-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.has('fans') && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedMonth === '年度' ? (
              <>
                {renderEditableProgressCard('抖音粉丝', currentData.fans.douyin, yearlyGoals.fansGoals.douyin, '人', Users, 'pink', 'fans', 'douyin')}
                {renderEditableProgressCard('视频号粉丝', currentData.fans.shipinhao, yearlyGoals.fansGoals.shipinhao, '人', Users, 'green', 'fans', 'shipinhao')}
                {renderEditableProgressCard('小红书粉丝', currentData.fans.xiaohongshu, yearlyGoals.fansGoals.xiaohongshu, '人', Users, 'red', 'fans', 'xiaohongshu')}
                {renderProgressCard('总计', currentData.fans.total, yearlyGoals.fansGoals.total, '人', Users, 'blue')}
              </>
            ) : (
              <>
                {renderEditableProgressCard('抖音粉丝', currentData.fans.douyin, currentGoal.fansGoals.douyin, '人', Users, 'pink', 'fans', 'douyin')}
                {renderEditableProgressCard('视频号粉丝', currentData.fans.shipinhao, currentGoal.fansGoals.shipinhao, '人', Users, 'green', 'fans', 'shipinhao')}
                {renderEditableProgressCard('小红书粉丝', currentData.fans.xiaohongshu, currentGoal.fansGoals.xiaohongshu, '人', Users, 'red', 'fans', 'xiaohongshu')}
                {renderProgressCard('当月合计', currentData.fans.total, currentGoal.fansGoals.total, '人', Users, 'blue')}
              </>
            )}
          </div>
        )}
      </div>

      {/* 播放与互动目标 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('engagement')}
        >
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-900">播放与互动目标</h3>
          </div>
          {expandedSections.has('engagement') ? 
            <ChevronUp className="w-5 h-5 text-gray-500" /> : 
            <ChevronDown className="w-5 h-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.has('engagement') && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedMonth === '年度' ? (
              <>
                {renderProgressCard('总播放量', currentData.engagement.totalViews, yearlyGoals.engagementGoals.totalViews, '次', Eye, 'purple')}
                {renderProgressCard('爆款视频', currentData.engagement.viralCount, yearlyGoals.engagementGoals.viralCount, '个', Award, 'yellow')}
                {renderProgressCard('总互动量', currentData.engagement.totalInteractions, yearlyGoals.engagementGoals.totalInteractions, '次', Heart, 'red')}
                {renderProgressCard('完播率', currentData.engagement.completionRate, yearlyGoals.engagementGoals.completionRate, '%', BookmarkPlus, 'green')}
              </>
            ) : (
              <>
                {renderProgressCard('总播放量', currentData.engagement.totalViews, currentGoal.engagementGoals.totalViews, '次', Eye, 'purple')}
                {renderProgressCard('爆款视频', currentData.engagement.viralCount, currentGoal.engagementGoals.viralCount, '个', Award, 'yellow')}
                {renderProgressCard('总互动量', currentData.engagement.totalInteractions, currentGoal.engagementGoals.totalInteractions, '次', Heart, 'red')}
                {renderProgressCard('完播率', currentData.engagement.completionRate, currentGoal.engagementGoals.completionRate, '%', BookmarkPlus, 'green')}
              </>
            )}
          </div>
        )}
      </div>

      {/* 内容创作目标 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('content')}
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">内容创作目标</h3>
          </div>
          {expandedSections.has('content') ? 
            <ChevronUp className="w-5 h-5 text-gray-500" /> : 
            <ChevronDown className="w-5 h-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.has('content') && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedMonth === '年度' ? (
              <>
                {renderEditableProgressCard('视频总数', currentData.content.totalVideos, yearlyGoals.contentGoals.totalVideos, '条', FileText, 'blue', 'content', 'totalVideos')}
                {renderEditableProgressCard('采访类视频', currentData.content.interviewVideos, yearlyGoals.contentGoals.interviewVideos, '条', MessageCircle, 'green', 'content', 'interviewVideos')}
                {renderEditableProgressCard('其他类视频', currentData.content.otherVideos, yearlyGoals.contentGoals.otherVideos, '条', Share2, 'purple', 'content', 'otherVideos')}
              </>
            ) : (
              <>
                {renderEditableProgressCard('视频总数', currentData.content.totalVideos, currentGoal.contentGoals.totalVideos, '条', FileText, 'blue', 'content', 'totalVideos')}
                {renderEditableProgressCard('采访类视频', currentData.content.interviewVideos, currentGoal.contentGoals.interviewVideos, '条', MessageCircle, 'green', 'content', 'interviewVideos')}
                {renderEditableProgressCard('其他类视频', currentData.content.otherVideos, currentGoal.contentGoals.otherVideos, '条', Share2, 'purple', 'content', 'otherVideos')}
              </>
            )}
          </div>
        )}
      </div>

      {/* 目标完成情况表格 */}
      <GoalSummaryTable 
        metrics={metrics} 
        goalData={{
          content: currentData.content,
          contentGoals: selectedMonth === '年度' ? yearlyGoals.contentGoals : currentGoal.contentGoals,
          fans: currentData.fans,
          fansGoals: selectedMonth === '年度' ? yearlyGoals.fansGoals : currentGoal.fansGoals,
          engagement: currentData.engagement,
          engagementGoals: selectedMonth === '年度' ? yearlyGoals.engagementGoals : currentGoal.engagementGoals
        }}
      />

      {/* 添加月份目标 Modal */}
      {showAddMonthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">添加月份目标</h3>
              <button onClick={() => setShowAddMonthModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">月份 (YYYY-MM) *</label>
                <input type="month" value={newMonthForm.period} onChange={e => setNewMonthForm(f => ({ ...f, period: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">视频总数目标</label>
                  <input type="number" min="0" value={newMonthForm.totalVideos} onChange={e => setNewMonthForm(f => ({ ...f, totalVideos: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">采访类视频</label>
                  <input type="number" min="0" value={newMonthForm.interviewVideos} onChange={e => setNewMonthForm(f => ({ ...f, interviewVideos: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">抖音粉丝目标</label>
                  <input type="number" min="0" value={newMonthForm.douyinFans} onChange={e => setNewMonthForm(f => ({ ...f, douyinFans: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">视频号粉丝</label>
                  <input type="number" min="0" value={newMonthForm.shipinhaoFans} onChange={e => setNewMonthForm(f => ({ ...f, shipinhaoFans: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">小红书粉丝</label>
                  <input type="number" min="0" value={newMonthForm.xiaohongshuFans} onChange={e => setNewMonthForm(f => ({ ...f, xiaohongshuFans: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">播放量目标 (次)</label>
                  <input type="number" min="0" value={newMonthForm.totalViews} onChange={e => setNewMonthForm(f => ({ ...f, totalViews: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">互动量目标 (次)</label>
                  <input type="number" min="0" value={newMonthForm.totalInteractions} onChange={e => setNewMonthForm(f => ({ ...f, totalInteractions: +e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddMonthModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">取消</button>
              <button onClick={handleAddMonth} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedGoalDashboard;
