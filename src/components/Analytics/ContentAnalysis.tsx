import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ContentTypeMetrics, TopContentItem, UnifiedData } from '../../types';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';
import { getTopNByScore } from '../../utils/contentScorer';
import { Trophy, TrendingUp, Eye, Heart, PieChart as PieChartIcon, FileText, Activity, MessageCircle, Tag, Star, BarChart3 } from 'lucide-react';

interface ContentAnalysisProps {
  contentTypes: ContentTypeMetrics[];
  topContent: TopContentItem[];
  rawData?: UnifiedData[];
}

// 关键词配置
const BRAND_KEYWORDS = ['广联达', 'Concetto', 'concetto', 'CONCETTO', '数维'];

const ContentAnalysis: React.FC<ContentAnalysisProps> = ({ contentTypes, topContent, rawData }) => {

  // 统一的图表主题色彩配置
  const chartThemeColors = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case '抖音':
        return 'bg-black text-white';
      case '视频号':
        return 'bg-green-600 text-white';
      case '小红书':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // 为圆环图定义颜色 - 使用统一的主题色彩
  const COLORS = [
    chartThemeColors.primary,
    chartThemeColors.secondary,
    chartThemeColors.success,
    chartThemeColors.warning,
    chartThemeColors.purple,
    chartThemeColors.accent,
    chartThemeColors.danger,
    chartThemeColors.pink
  ];

  // 转换数据格式以适配PieChart
  const pieData = contentTypes.map(item => ({
    name: item.type,
    value: item.count,
    type: item.type,
    count: item.count
  }));

  // 自定义Tooltip
  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200/50 rounded-xl shadow-xl">
          <p className="font-semibold text-gray-900 mb-1">{data.type}</p>
          <p className="text-sm text-gray-600">数量: <span className="font-medium text-blue-600">{data.count}</span></p>
          <p className="text-sm text-gray-600">占比: <span className="font-medium text-purple-600">{((data.count / contentTypes.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  // 自定义标签渲染函数
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / pieData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className="space-y-8">
      {/* 内容类型分析 */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-100/50 to-blue-100/50 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative mb-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 animate-pulse">
              <PieChartIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-purple-700 bg-clip-text text-transparent">
                内容类型分析
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                基于抖音平台数据分析（其他平台内容分发相同，类型一致）
              </p>
            </div>
          </div>
        </div>
        
        <div className="relative mb-6 p-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl border border-blue-200/30">
          <div className="flex items-center">
            <Activity className="w-4 h-4 text-blue-600 mr-2" />
            <p className="text-sm text-blue-700">
              <strong>说明：</strong>内容类型分析基于抖音平台数据，因为其他平台的内容分发都是相同的。
            </p>
          </div>
        </div>
        
        {contentTypes.length > 0 ? (
          <>
            <div className="relative h-96 mb-8 p-6 bg-gradient-to-br from-gray-50/50 to-blue-50/30 rounded-xl border border-gray-200/30">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {COLORS.map((color, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={140}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderLabel}
                    labelLine={false}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index % COLORS.length})`}
                        className="hover:opacity-80 transition-opacity duration-300"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderTooltip} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={50}
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                    formatter={(value: any, entry: any) => (
                      <span className="text-gray-700">
                        {entry.payload?.type || entry.value} ({entry.payload?.count || entry.value})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 内容类型详细数据 */}
            <div className="relative overflow-hidden rounded-xl border border-gray-200/50 bg-white/60 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center">
                          <FileText className="w-3 h-3 mr-2" />
                          内容类型
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-end">
                          <Eye className="w-3 h-3 mr-1" />
                          平均播放量
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-end">
                          <Heart className="w-3 h-3 mr-1" />
                          平均点赞量
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-end">
                          <Activity className="w-3 h-3 mr-1" />
                          平均互动量
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/40 backdrop-blur-sm divide-y divide-gray-200/30">
                    {contentTypes.map((type, index) => (
                      <tr key={index} className="hover:bg-white/60 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {type.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {type.count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {AnalyticsProcessor.formatNumber(type.avgViews)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {AnalyticsProcessor.formatNumber(type.avgLikes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {AnalyticsProcessor.formatNumber(type.avgEngagement)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <PieChartIcon className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-500 text-lg">暂无内容类型数据</p>
          </div>
        )}
      </div>

      {/* 热门内容排行 */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-yellow-100/50 to-orange-100/50 rounded-full -translate-y-14 translate-x-14"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-red-100/50 to-pink-100/50 rounded-full translate-y-10 -translate-x-10"></div>
        
        <div className="relative mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 animate-pulse">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-orange-700 bg-clip-text text-transparent">
              热门内容排行 (按互动量)
            </h3>
          </div>
        </div>
        
        {topContent.length > 0 ? (
          <div className="relative space-y-4">
            {topContent.map((content, index) => (
              <div key={index} className="group relative p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* 排名装饰 */}
                {index < 3 && (
                  <div className="absolute top-4 right-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                      'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                )}
                
                <div className="flex-1 min-w-0 pr-12">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(content.platform)}`}>
                      {content.platform}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {content.publishTime.slice(0, 10)}
                    </span>
                  </div>
                  
                  <h4 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {content.title}
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-blue-50/50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">播放量</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {AnalyticsProcessor.formatNumber(content.views)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 bg-red-50/50 rounded-lg">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <Heart className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">点赞量</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {AnalyticsProcessor.formatNumber(content.likes)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 bg-green-50/50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">互动量</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {AnalyticsProcessor.formatNumber(content.engagementTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-500 text-lg">暂无热门内容数据</p>
          </div>
        )}
      </div>

      {/* 10万+播放量内容 */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-green-100/50 to-teal-100/50 rounded-full -translate-y-14 translate-x-14"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-100/50 to-cyan-100/50 rounded-full translate-y-10 -translate-x-10"></div>

        <div className="relative mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 animate-pulse">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-teal-700 bg-clip-text text-transparent">
              10万+播放量内容
            </h3>
          </div>
        </div>

        {(() => {
          const highViewContent = topContent.filter(item => (item.views || 0) >= 100000);
          if (highViewContent.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-500 text-lg">暂无播放量超过10万的内容</p>
              </div>
            );
          }

          return (
            <div className="relative space-y-4">
              {/* 统计信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50/60 border border-green-200 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">内容数量</p>
                  <p className="text-lg font-semibold text-green-700">{highViewContent.length}</p>
                </div>
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">平均播放量</p>
                  <p className="text-lg font-semibold text-blue-700">
                    {AnalyticsProcessor.formatNumber(Math.round(highViewContent.reduce((sum, c) => sum + (c.views || 0), 0) / highViewContent.length))}
                  </p>
                </div>
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
                  <p className="text-xs text-gray-600 mb-1">最高播放量</p>
                  <p className="text-lg font-semibold text-purple-700">
                    {AnalyticsProcessor.formatNumber(Math.max(...highViewContent.map(c => c.views || 0)))}
                  </p>
                </div>
              </div>

              {highViewContent.map((content, index) => (
                <div key={`high-${index}`} className="group relative p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(content.platform)}`}>
                        {content.platform}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {content.publishTime.slice(0, 10)}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        10万+
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-teal-700 transition-colors">
                      {content.title}
                    </h4>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2 p-3 bg-blue-50/50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">播放量</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {AnalyticsProcessor.formatNumber(content.views)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-red-50/50 rounded-lg">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <Heart className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">点赞量</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {AnalyticsProcessor.formatNumber(content.likes)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 p-3 bg-purple-50/50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">评论量</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {AnalyticsProcessor.formatNumber(content.comments)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* 品牌关键词内容统计 */}
      {rawData && rawData.length > 0 && (
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full -translate-y-14 translate-x-14"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-pink-100/50 to-rose-100/50 rounded-full translate-y-10 -translate-x-10"></div>

          <div className="relative mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 animate-pulse">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-purple-700 bg-clip-text text-transparent">
                  品牌关键词内容统计
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  标题包含：广联达、Concetto、数维
                </p>
              </div>
            </div>
          </div>

          {(() => {
            // 筛选包含关键词的内容（不区分大小写）
            const brandContent = rawData.filter(item => {
              const title = (item.标题描述 || '').toLowerCase();
              return BRAND_KEYWORDS.some(keyword => title.includes(keyword.toLowerCase()));
            });

            if (brandContent.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-lg">暂无包含品牌关键词的内容</p>
                </div>
              );
            }

            // 计算统计数据
            const totalViews = brandContent.reduce((sum, item) => sum + (item.播放量 || 0), 0);
            const totalLikes = brandContent.reduce((sum, item) => sum + (item.点赞量 || 0), 0);
            const totalComments = brandContent.reduce((sum, item) => sum + (item.评论量 || 0), 0);
            const totalShares = brandContent.reduce((sum, item) => sum + (item.分享量 || 0), 0);
            const totalBookmarks = brandContent.reduce((sum, item) => sum + (item.收藏量 || 0), 0);
            const totalInteractions = totalLikes + totalComments + totalShares + totalBookmarks;

            // 按关键词分组统计
            const keywordStats = BRAND_KEYWORDS.reduce((acc, keyword) => {
              const items = rawData.filter(item => 
                (item.标题描述 || '').toLowerCase().includes(keyword.toLowerCase())
              );
              if (items.length > 0) {
                acc[keyword] = {
                  count: items.length,
                  totalViews: items.reduce((sum, item) => sum + (item.播放量 || 0), 0),
                  avgViews: Math.round(items.reduce((sum, item) => sum + (item.播放量 || 0), 0) / items.length)
                };
              }
              return acc;
            }, {} as Record<string, { count: number; totalViews: number; avgViews: number }>);

            // 按播放量排序
            const sortedBrandContent = [...brandContent].sort((a, b) => (b.播放量 || 0) - (a.播放量 || 0));

            return (
              <div className="relative space-y-6">
                {/* 总体统计 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">内容数量</p>
                    <p className="text-lg font-semibold text-indigo-700">{brandContent.length}</p>
                  </div>
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">总播放量</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {AnalyticsProcessor.formatNumber(totalViews)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">总点赞量</p>
                    <p className="text-lg font-semibold text-red-700">
                      {AnalyticsProcessor.formatNumber(totalLikes)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50/60 border border-green-200 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">总评论量</p>
                    <p className="text-lg font-semibold text-green-700">
                      {AnalyticsProcessor.formatNumber(totalComments)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">总互动量</p>
                    <p className="text-lg font-semibold text-purple-700">
                      {AnalyticsProcessor.formatNumber(totalInteractions)}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl">
                    <p className="text-xs text-gray-600 mb-1">平均播放量</p>
                    <p className="text-lg font-semibold text-orange-700">
                      {AnalyticsProcessor.formatNumber(Math.round(totalViews / brandContent.length))}
                    </p>
                  </div>
                </div>

                {/* 关键词分布 */}
                <div className="p-4 bg-gradient-to-r from-gray-50/80 to-indigo-50/50 rounded-xl border border-gray-200/50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">关键词分布</h4>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(keywordStats).map(([keyword, stats]) => (
                      <div key={keyword} className="px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <span className="font-medium text-indigo-700">{keyword}</span>
                        <span className="text-gray-500 ml-2">
                          {stats.count}条 · 平均{AnalyticsProcessor.formatNumber(stats.avgViews)}播放
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 内容列表 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">内容详情（按播放量排序）</h4>
                  {sortedBrandContent.slice(0, 20).map((content, index) => (
                    <div key={`brand-${index}`} className="group relative p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(content.来源平台)}`}>
                            {content.来源平台}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {(content.发布时间 || '').slice(0, 10)}
                          </span>
                          {/* 显示匹配的关键词 */}
                          {BRAND_KEYWORDS.filter(kw => 
                            (content.标题描述 || '').toLowerCase().includes(kw.toLowerCase())
                          ).map(kw => (
                            <span key={kw} className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                              {kw}
                            </span>
                          ))}
                        </div>

                        <h4 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                          {content.标题描述}
                        </h4>

                        <div className="grid grid-cols-4 gap-4">
                          <div className="flex items-center space-x-2 p-3 bg-blue-50/50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">播放量</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {AnalyticsProcessor.formatNumber(content.播放量 || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 p-3 bg-red-50/50 rounded-lg">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <Heart className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">点赞量</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {AnalyticsProcessor.formatNumber(content.点赞量 || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 p-3 bg-green-50/50 rounded-lg">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">评论量</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {AnalyticsProcessor.formatNumber(content.评论量 || 0)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 p-3 bg-purple-50/50 rounded-lg">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">互动量</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {AnalyticsProcessor.formatNumber(
                                  (content.点赞量 || 0) + (content.评论量 || 0) + 
                                  (content.分享量 || 0) + (content.收藏量 || 0)
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sortedBrandContent.length > 20 && (
                    <p className="text-center text-sm text-gray-500">
                      仅显示前20条，共{sortedBrandContent.length}条内容
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 关键词/话题表现分析 */}
      {rawData && rawData.length > 0 && (() => {
        const kwStats: Record<string, { total: number; count: number }> = {};
        rawData.forEach(item => {
          const title = item.标题描述 || '';
          const views = item.播放量 || 0;
          // 提取#话题标签
          const tags = (title.match(/#([^#\s\uff03\u3000]+)/g) || []).map(t => t.replace(/^#/, '').trim()).filter(Boolean);
          // 提取中文单词（2-6字）
          const words = title
            .replace(/#[^\s]*/g, '')
            .split(/[\s\uff0c\u3002\uff01\uff1f\u3001\uff1b\uff1a\u201c\u201d\u2018\u2019\u300a\u300b\u3010\u3011\u2026\u2014\[\]\(\)\uff08\uff09,!?.;:'"]+/)
            .map(w => w.trim())
            .filter(w => w.length >= 2 && w.length <= 6 && /[\u4e00-\u9fa5]/.test(w));
          [...tags, ...words].forEach(kw => {
            if (!kwStats[kw]) kwStats[kw] = { total: 0, count: 0 };
            kwStats[kw].total += views;
            kwStats[kw].count++;
          });
        });
        const keywords = Object.entries(kwStats)
          .filter(([, s]) => s.count >= 2)
          .map(([kw, s]) => ({ keyword: kw, avgViews: s.total / s.count, count: s.count }))
          .sort((a, b) => b.avgViews - a.avgViews)
          .slice(0, 20);
        if (keywords.length === 0) return null;
        const maxAvg = keywords[0].avgViews;
        return (
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-cyan-100/50 to-blue-100/50 rounded-full -translate-y-14 translate-x-14"></div>
            <div className="relative mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                    关键词/话题表现分析
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">基于标题内容提取，出现≥ 2 次的关键词按平均播放量排列</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {keywords.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-xs font-bold text-gray-400 w-6 text-right">{idx + 1}</span>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    item.keyword.includes('#') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.keyword}
                  </span>
                  <span className="text-xs text-gray-400">×{item.count}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${(item.avgViews / maxAvg) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-700 w-20 text-right">
                    {item.avgViews >= 10000 ? `${(item.avgViews / 10000).toFixed(1)}万` : Math.round(item.avgViews).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 标题特征分析 */}
      {rawData && rawData.length > 0 && (() => {
        const buckets: Record<string, { views: number[]; engRates: number[] }> = {
          '<10字': { views: [], engRates: [] },
          '10-20字': { views: [], engRates: [] },
          '20-30字': { views: [], engRates: [] },
          '>30字': { views: [], engRates: [] },
        };
        rawData.forEach(item => {
          const len = (item['标题描述'] || '').length;
          const views = item['播放量'] || 0;
          const eng = (item['点赞量'] || 0) + (item['评论量'] || 0) + (item['收藏量'] || 0) + (item['分享量'] || 0);
          const engRate = views > 0 ? (eng / views) * 100 : 0;
          const key = len < 10 ? '<10字' : len < 20 ? '10-20字' : len < 30 ? '20-30字' : '>30字';
          buckets[key].views.push(views);
          buckets[key].engRates.push(engRate);
        });
        const bucketData = Object.entries(buckets).map(([label, d]) => ({
          label,
          avg播放: d.views.length ? Math.round(d.views.reduce((s, v) => s + v, 0) / d.views.length) : 0,
          avg互动率: d.engRates.length ? parseFloat((d.engRates.reduce((s, v) => s + v, 0) / d.engRates.length).toFixed(2)) : 0,
          count: d.views.length,
        }));
        const hasData = bucketData.some(b => b.count > 0);
        if (!hasData) return null;
        return (
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-amber-100/50 to-orange-100/50 rounded-full -translate-y-14 translate-x-14"></div>
            <div className="relative mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-amber-700 bg-clip-text text-transparent">标题特征分析</h3>
                  <p className="text-sm text-gray-600 mt-1">按标题字数分组，比较平均播放量与互动率</p>
                </div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="titleViewGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      name === 'avg互动率' ? `${v}%` : v.toLocaleString(),
                      name === 'avg互动率' ? '平均互动率' : '平均播放量',
                    ]}
                  />
                  <Bar yAxisId="left" dataKey="avg播放" fill="url(#titleViewGrad)" name="avg播放" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avg互动率" fill="#3b82f6" fillOpacity={0.7} name="avg互动率" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {bucketData.map(b => (
                <div key={b.label} className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{b.label}</span>
                  <span>{b.count}条内容</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 内容评分榜Top10 */}
      {rawData && rawData.length > 0 && (() => {
        const scored = getTopNByScore(rawData, 10);
        if (scored.length === 0) return null;
        return (
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-yellow-100/50 to-amber-100/50 rounded-full -translate-y-14 translate-x-14"></div>
            <div className="relative mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mr-4">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-yellow-700 bg-clip-text text-transparent">内容评分榜 Top 10</h3>
                  <p className="text-sm text-gray-600 mt-1">综合播放量、互动率、完播率、粉效比评分排名</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {scored.map((item, i) => {
                const score = Math.round(item.score);
                const scoreColor = score >= 70 ? 'text-green-600 bg-green-50' : score >= 40 ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 bg-gray-50';
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-yellow-50/30 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold text-white ${
                        i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'
                      }`}>{i + 1}</span>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${getPlatformBadgeColor(item['来源平台'])}`}>
                        {item['来源平台']}
                      </span>
                      <span className="text-sm text-gray-800 truncate">{item['标题描述'] || '无标题'}</span>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0 ml-3">
                      <span className="text-xs text-gray-400">{(item['播放量'] || 0).toLocaleString()}播放</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-lg ${scoreColor}`}>{score}分</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ContentAnalysis;
