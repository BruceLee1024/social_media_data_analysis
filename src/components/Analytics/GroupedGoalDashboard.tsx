import React from 'react';
import { FileText, Users, TrendingUp, Target, Award, Eye, Heart, MessageCircle, Share2, BookmarkPlus } from 'lucide-react';
import { PerformanceMetrics } from '../../types';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';

interface GroupedGoalDashboardProps {
  metrics: PerformanceMetrics;
  analytics: any;
}

interface GoalItem {
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  iconColor: string;
  textColor: string;
  category: 'content' | 'fans' | 'engagement';
}

const GroupedGoalDashboard: React.FC<GroupedGoalDashboardProps> = ({ metrics, analytics }) => {
  // 计算各平台数据
  const platformMetrics = analytics.platformComparison || [];
  const platformData = platformMetrics.reduce((acc: Record<string, number>, platform: any) => {
    acc[platform.platform] = platform.粉丝增量 || 0;
    return acc;
  }, {} as Record<string, number>);

  // 计算视频号的平均播放量（因为用户提到"视频号为主"）
  const shipinhaoData = platformMetrics.find((p: any) => p.platform === '视频号');
  const avgViewsPerItem = shipinhaoData && shipinhaoData.count > 0 
    ? shipinhaoData.totalViews / shipinhaoData.count 
    : (metrics.totalContent > 0 ? metrics.totalViews / metrics.totalContent : 0);
  
  const totalEngagement = metrics.totalLikes + metrics.totalComments + metrics.totalShares + (metrics.totalBookmarks || 0);
  const avgCompletionRate = metrics.avgCompletionRate || 0;

  // 平台粉丝数目标
  const platformGoals = {
    '抖音': 8000,
    '视频号': 10000,
    '小红书': 2000,
  };

  // 按三个维度分组的目标配置
  const goals: GoalItem[] = [
    // 内容数量维度
    {
      title: '内容发布数量',
      current: metrics.totalContent,
      target: 30,
      unit: '条',
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
      category: 'content',
    },
    {
      title: '爆款内容数量',
      current: metrics.viralContentCount || 0,
      target: 2,
      unit: '条',
      icon: Award,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900',
      category: 'content',
    },

    // 粉丝增长维度
    {
      title: '抖音粉丝增长',
      current: platformData['抖音'] || 0,
      target: platformGoals['抖音'],
      unit: '人',
      icon: Users,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      textColor: 'text-pink-900',
      category: 'fans',
    },
    {
      title: '视频号粉丝增长',
      current: platformData['视频号'] || 0,
      target: platformGoals['视频号'],
      unit: '人',
      icon: Users,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
      category: 'fans',
    },
    {
      title: '小红书粉丝增长',
      current: platformData['小红书'] || 0,
      target: platformGoals['小红书'],
      unit: '人',
      icon: Users,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
      category: 'fans',
    },

    // 播放与互动维度
    {
      title: '总播放量',
      current: metrics.totalViews,
      target: 1500000,
      unit: '次',
      icon: Eye,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-900',
      category: 'engagement',
    },
    {
      title: '单条平均播放量',
      current: avgViewsPerItem,
      target: 20000,
      unit: '次',
      icon: TrendingUp,
      color: 'cyan',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      textColor: 'text-cyan-900',
      category: 'engagement',
    },
    {
      title: '总互动量',
      current: totalEngagement,
      target: 50000,
      unit: '次',
      icon: Heart,
      color: 'rose',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      textColor: 'text-rose-900',
      category: 'engagement',
    },
    {
      title: '平均完播率',
      current: avgCompletionRate,
      target: 12,
      unit: '%',
      icon: Target,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-900',
      category: 'engagement',
    },
  ];

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return '已达成';
    if (percentage >= 80) return '接近目标';
    if (percentage >= 60) return '进展良好';
    return '需要努力';
  };

  // 按维度分组
  const contentGoals = goals.filter(g => g.category === 'content');
  const fansGoals = goals.filter(g => g.category === 'fans');
  const engagementGoals = goals.filter(g => g.category === 'engagement');

  const renderGoalCard = (goal: GoalItem) => {
    const Icon = goal.icon;
    const percentage = getProgressPercentage(goal.current, goal.target);
    const progressColor = getProgressColor(percentage);
    const statusText = getStatusText(percentage);

    return (
      <div key={goal.title} className={`${goal.bgColor} rounded-xl p-6 border border-gray-100`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white shadow-sm">
              <Icon className={`w-5 h-5 ${goal.iconColor}`} />
            </div>
            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
          </div>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
            percentage >= 100 ? 'bg-green-100 text-green-800' :
            percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
            percentage >= 60 ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {statusText}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">当前进度</span>
            <span className={`font-bold ${goal.textColor}`}>
              {goal.unit === '%' ? `${goal.current.toFixed(1)}` : AnalyticsProcessor.formatNumber(goal.current)} / {goal.unit === '%' ? `${goal.target}` : AnalyticsProcessor.formatNumber(goal.target)} {goal.unit}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">完成率</span>
            <span className={`font-semibold ${goal.textColor}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">目标完成情况</h2>
            <p className="text-blue-100">按维度分组查看各项目标达成进度</p>
          </div>
          <Target className="w-12 h-12 text-blue-200" />
        </div>
      </div>

      {/* 内容数量维度 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">内容数量</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contentGoals.map(renderGoalCard)}
        </div>
      </div>

      {/* 粉丝增长维度 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">粉丝增长</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {fansGoals.map(renderGoalCard)}
        </div>
      </div>

      {/* 播放与互动维度 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">播放与互动</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {engagementGoals.map(renderGoalCard)}
        </div>
      </div>

      {/* 总体统计 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">目标总结</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {goals.filter(g => getProgressPercentage(g.current, g.target) >= 100).length}
            </div>
            <div className="text-sm text-gray-600">已达成</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {goals.filter(g => {
                const p = getProgressPercentage(g.current, g.target);
                return p >= 80 && p < 100;
              }).length}
            </div>
            <div className="text-sm text-gray-600">接近目标</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {goals.filter(g => {
                const p = getProgressPercentage(g.current, g.target);
                return p >= 60 && p < 80;
              }).length}
            </div>
            <div className="text-sm text-gray-600">进展良好</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {goals.filter(g => getProgressPercentage(g.current, g.target) < 60).length}
            </div>
            <div className="text-sm text-gray-600">需要努力</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupedGoalDashboard;