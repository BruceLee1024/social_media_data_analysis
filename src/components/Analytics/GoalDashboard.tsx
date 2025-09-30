import React from 'react';
import { Target, TrendingUp, Award, Eye, Heart, MessageCircle, Share2, BookmarkPlus, Users } from 'lucide-react';
import { PerformanceMetrics } from '../../types';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';

interface GoalDashboardProps {
  metrics: PerformanceMetrics;
  analytics: any; // 添加analytics数据用于获取平台对比数据
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
  isPlatformGoal?: boolean;
  platform?: string;
}

const GoalDashboard: React.FC<GoalDashboardProps> = ({ metrics, analytics }) => {
  // 计算当前数据
  const avgViewsPerItem = metrics.totalContent > 0 ? metrics.totalViews / metrics.totalContent : 0;
  const totalEngagement = metrics.totalLikes + metrics.totalComments + metrics.totalShares + (metrics.totalBookmarks || 0);
  const avgCompletionRate = metrics.avgCompletionRate || 0;

  // 平台粉丝数目标
  const platformGoals = {
    '抖音': 8000,
    '视频号': 10000,
    '小红书': 2000,
  };

  // 计算各平台当前粉丝增量（使用实际的粉丝增量数据）
  const platformMetrics = analytics.platformComparison || [];
  const platformData = platformMetrics.reduce((acc, platform) => {
    // 使用粉丝增量作为当前指标
    acc[platform.platform] = platform.粉丝增量 || 0;
    return acc;
  }, {} as Record<string, number>);

  // 目标配置
  const goals: GoalItem[] = [
    {
      title: '单条平均播放量',
      current: avgViewsPerItem,
      target: 20000,
      unit: '次',
      icon: Eye,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
    },
    {
      title: '总播放量',
      current: metrics.totalViews,
      target: 1500000,
      unit: '次',
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    {
      title: '爆款数量',
      current: metrics.viralContentCount || 0,
      target: 2, // 每月目标
      unit: '条',
      icon: Award,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
    },
    {
      title: '总互动量',
      current: totalEngagement,
      target: 50000,
      unit: '次',
      icon: Heart,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
    {
      title: '平均完播率',
      current: avgCompletionRate,
      target: 12,
      unit: '%',
      icon: Target,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900',
    },
    // 平台粉丝数目标
    ...Object.entries(platformGoals).map(([platform, target]) => ({
      title: `${platform}粉丝数`,
      current: platformData[platform] || 0,
      target: target,
      unit: '人',
      icon: Users,
      color: platform === '抖音' ? 'pink' : platform === '视频号' ? 'green' : 'red',
      bgColor: platform === '抖音' ? 'bg-pink-50' : platform === '视频号' ? 'bg-green-50' : 'bg-red-50',
      iconColor: platform === '抖音' ? 'text-pink-600' : platform === '视频号' ? 'text-green-600' : 'text-red-600',
      textColor: platform === '抖音' ? 'text-pink-900' : platform === '视频号' ? 'text-green-900' : 'text-red-900',
      isPlatformGoal: true,
      platform: platform,
    })),
  ];

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number, isPlatformGoal?: boolean, platform?: string) => {
    if (isPlatformGoal) {
      // 平台目标使用特殊颜色
      if (platform === '抖音') return percentage >= 100 ? 'bg-pink-500' : 'bg-pink-300';
      if (platform === '视频号') return percentage >= 100 ? 'bg-green-500' : 'bg-green-300';
      if (platform === '小红书') return percentage >= 100 ? 'bg-red-500' : 'bg-red-300';
    }
    
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">目标完成情况</h2>
            <p className="text-blue-100">数据驱动，持续优化内容策略</p>
          </div>
          <Target className="w-12 h-12 text-blue-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal, index) => {
          const Icon = goal.icon;
          const percentage = getProgressPercentage(goal.current, goal.target);
          const progressColor = getProgressColor(percentage, goal.isPlatformGoal, goal.platform);
          const statusText = getStatusText(percentage);

          return (
            <div key={index} className={`${goal.bgColor} rounded-xl p-6 border border-gray-100`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                    <Icon className={`w-5 h-5 ${goal.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  goal.isPlatformGoal && goal.platform === '抖音' ? (percentage >= 100 ? 'bg-pink-100 text-pink-800' : 'bg-pink-50 text-pink-700') :
                  goal.isPlatformGoal && goal.platform === '视频号' ? (percentage >= 100 ? 'bg-green-100 text-green-800' : 'bg-green-50 text-green-700') :
                  goal.isPlatformGoal && goal.platform === '小红书' ? (percentage >= 100 ? 'bg-red-100 text-red-800' : 'bg-red-50 text-red-700') :
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
                    {AnalyticsProcessor.formatNumber(goal.current)} / {AnalyticsProcessor.formatNumber(goal.target)} {goal.unit}
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

                {goal.title === '爆款数量' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">爆款标准：播放量 ≥ 50,000</p>
                    <p className="text-xs text-gray-600">当前爆款：{metrics.viralContentCount || 0} 条</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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

export default GoalDashboard;