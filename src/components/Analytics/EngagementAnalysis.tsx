import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import { UnifiedData } from '../../types';

interface EngagementAnalysisProps {
  data: UnifiedData[];
}

interface EngagementMetrics {
  platform: string;
  avgEngagementRate: number;
  avgLikeRate: number;
  avgCommentRate: number;
  avgShareRate: number;
  avgBookmarkRate: number;
}

const EngagementAnalysis: React.FC<EngagementAnalysisProps> = ({ data }) => {
  // 统一的图表主题色配置 - 与其他组件保持一致
  const chartThemeColors = {
    primary: ['#3b82f6', '#2563eb'],      // 蓝色 - 主要数据
    secondary: ['#10b981', '#059669'],    // 绿色 - 次要数据
    accent: ['#f59e0b', '#d97706'],       // 橙色 - 强调数据
    success: ['#22c55e', '#16a34a'],      // 成功绿
    warning: ['#eab308', '#ca8a04'],      // 警告黄
    danger: ['#ef4444', '#dc2626'],       // 危险红
    purple: ['#8b5cf6', '#7c3aed'],       // 紫色
    pink: ['#ec4899', '#db2777'],         // 粉色
  };

  const engagementData = useMemo((): EngagementMetrics[] => {
    const platformGroups = data.reduce((acc, item) => {
      if (!acc[item.来源平台]) {
        acc[item.来源平台] = [];
      }
      acc[item.来源平台].push(item);
      return acc;
    }, {} as Record<string, UnifiedData[]>);

    return Object.entries(platformGroups).map(([platform, items]) => {
      const validItems = items.filter(item => item.播放量 > 0);
      
      if (validItems.length === 0) {
        return {
          platform,
          avgEngagementRate: 0,
          avgLikeRate: 0,
          avgCommentRate: 0,
          avgShareRate: 0,
          avgBookmarkRate: 0,
        };
      }

      const totalEngagementRate = validItems.reduce((sum, item) => {
        const totalEngagement = item.点赞量 + item.评论量 + item.分享量 + (item.收藏量 || 0);
        return sum + (totalEngagement / item.播放量) * 100;
      }, 0);

      const totalLikeRate = validItems.reduce((sum, item) => {
        return sum + (item.点赞量 / item.播放量) * 100;
      }, 0);

      const totalCommentRate = validItems.reduce((sum, item) => {
        return sum + (item.评论量 / item.播放量) * 100;
      }, 0);

      const totalShareRate = validItems.reduce((sum, item) => {
        return sum + (item.分享量 / item.播放量) * 100;
      }, 0);

      const totalBookmarkRate = validItems.reduce((sum, item) => {
        return sum + ((item.收藏量 || 0) / item.播放量) * 100;
      }, 0);

      return {
        platform,
        avgEngagementRate: Number((totalEngagementRate / validItems.length).toFixed(2)),
        avgLikeRate: Number((totalLikeRate / validItems.length).toFixed(2)),
        avgCommentRate: Number((totalCommentRate / validItems.length).toFixed(2)),
        avgShareRate: Number((totalShareRate / validItems.length).toFixed(2)),
        avgBookmarkRate: Number((totalBookmarkRate / validItems.length).toFixed(2)),
      };
    });
  }, [data]);

  const formatTooltip = (value: number, name: string) => {
    const nameMap: Record<string, string> = {
      avgEngagementRate: '总互动率',
      avgLikeRate: '点赞率',
      avgCommentRate: '评论率',
      avgShareRate: '分享率',
      avgBookmarkRate: '收藏率',
    };
    return [`${value}%`, nameMap[name] || name];
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl border border-gray-200/60 p-8 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
      {/* 标题区域 - 增强视觉效果 */}
      <div className="flex items-center mb-8">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
        </div>
        <div className="ml-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-2">
            互动率分析
          </h3>
          <p className="text-gray-600 text-sm flex items-center">
            <TrendingUp className="w-4 h-4 mr-1 text-purple-500" />
            各平台内容的平均互动率对比分析
          </p>
        </div>
      </div>

      {/* 图表区域 - 分为两列，增强视觉效果 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 左侧：平台互动数据对比图表 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/60 p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-purple-700 bg-clip-text text-transparent">
              平台互动数据对比
            </h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={engagementData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="likeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.danger[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.danger[1]} />
                  </linearGradient>
                  <linearGradient id="commentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.secondary[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.secondary[1]} />
                  </linearGradient>
                  <linearGradient id="shareGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.purple[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.purple[1]} />
                  </linearGradient>
                  <linearGradient id="bookmarkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.accent[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.accent[1]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  label={{ value: '互动率 (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Legend />
                <Bar dataKey="avgLikeRate" fill="url(#likeGradient)" name="点赞率" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgCommentRate" fill="url(#commentGradient)" name="评论率" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgShareRate" fill="url(#shareGradient)" name="分享率" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgBookmarkRate" fill="url(#bookmarkGradient)" name="收藏率" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧：平台总互动数对比图表 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/60 p-6 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
              平台总互动数对比
            </h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={engagementData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="totalEngagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.primary[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.primary[1]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  label={{ value: '总互动率 (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, '总互动率']}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Bar dataKey="avgEngagementRate" fill="url(#totalEngagementGradient)" name="总互动率" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 详细数据卡片 - 增强视觉效果和排版 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {engagementData.map((platform, index) => (
          <div 
            key={platform.platform} 
            className="group bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 border border-gray-200/60 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* 平台标题 */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent">
                {platform.platform}
              </h4>
              <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
            </div>
            
            {/* 数据指标 */}
            <div className="space-y-3">
              {/* 总互动率 */}
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">总互动率</span>
                </div>
                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg text-sm">
                  {platform.avgEngagementRate}%
                </span>
              </div>
              
              {/* 点赞率 */}
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100/50">
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">点赞率</span>
                </div>
                <span className="font-bold text-red-700 bg-red-100 px-3 py-1 rounded-lg text-sm">
                  {platform.avgLikeRate}%
                </span>
              </div>
              
              {/* 评论率 */}
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100/50">
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">评论率</span>
                </div>
                <span className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg text-sm">
                  {platform.avgCommentRate}%
                </span>
              </div>
              
              {/* 分享率 */}
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100/50">
                <div className="flex items-center">
                  <Share className="w-4 h-4 mr-2 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">分享率</span>
                </div>
                <span className="font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-lg text-sm">
                  {platform.avgShareRate}%
                </span>
              </div>
              
              {/* 收藏率 */}
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100/50">
                <div className="flex items-center">
                  <Bookmark className="w-4 h-4 mr-2 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">收藏率</span>
                </div>
                <span className="font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg text-sm">
                  {platform.avgBookmarkRate}%
                </span>
              </div>
            </div>
            
            {/* 底部装饰线 */}
            <div className="mt-4 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EngagementAnalysis;