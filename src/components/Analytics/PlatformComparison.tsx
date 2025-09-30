import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { PlatformMetrics } from '../../types';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';

interface PlatformComparisonProps {
  data: PlatformMetrics[];
}

const PlatformComparison: React.FC<PlatformComparisonProps> = ({ data }) => {
  
  // 自定义标签格式化函数
  const formatBarLabel = (value: any) => {
    if (typeof value === 'number') {
      return AnalyticsProcessor.formatNumber(value);
    }
    return value;
  };

  const formatPieLabel = (entry: any) => {
    const total = data.reduce((sum, item) => sum + item.totalViews, 0);
    const percent = ((entry.totalViews / total) * 100).toFixed(1);
    return `${entry.platform}\n${percent}%`;
  };

  // 统一的平台颜色配置 - 使用品牌色
  const colors = {
    '抖音': '#000000',
    '视频号': '#07C160', 
    '小红书': '#FF2442',
  };

  // 统一的渐变色配置 - 保持品牌一致性
  const gradientColors = {
    '抖音': ['#1f2937', '#374151'],     // 深灰色系
    '视频号': ['#10b981', '#059669'],   // 绿色系
    '小红书': ['#ef4444', '#dc2626'],   // 红色系
  };

  // 统一的图表主题色配置 - 使用协调的色彩体系
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

  const formatTooltip = (value: any, name: string) => {
    if (name && typeof name === 'string' && name.includes('率')) {
      return [AnalyticsProcessor.formatPercentage(value), name];
    }
    return [AnalyticsProcessor.formatNumber(value), name];
  };

  // 自定义Tooltip样式
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{`平台: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatTooltip(entry.value, entry.name)[0]}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 计算总互动数
  const dataWithEngagement = data.map(item => ({
    ...item,
    totalEngagement: item.totalLikes + item.totalComments + item.totalShares + (item.totalBookmarks || 0)
  }));

  return (
    <div className="space-y-8">
      {/* 第一行：播放量占比和播放量对比 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 平台播放量占比 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
            <h3 className="text-xl font-bold text-gray-900">播放量占比</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {Object.entries(gradientColors).map(([platform, [start, end]], index) => (
                    <linearGradient key={platform} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={start} />
                      <stop offset="100%" stopColor={end} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="totalViews"
                  label={formatPieLabel}
                  labelLine={false}
                  stroke="#fff"
                  strokeWidth={3}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 平台播放量对比 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-teal-600 rounded-full mr-3"></div>
            <h3 className="text-xl font-bold text-gray-900">平台播放量对比</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={AnalyticsProcessor.formatNumber}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="totalViews" 
                  name="总播放量"
                  fill="url(#viewsGradient)"
                  radius={[12, 12, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 第二行：内容数量对比和平均互动率对比 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 平台内容数量对比 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></div>
            <h3 className="text-xl font-bold text-gray-900">平台内容数量对比</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="contentCountGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.primary[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.primary[1]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={AnalyticsProcessor.formatNumber}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="totalContent" 
                  name="内容数量"
                  fill="url(#contentCountGradient)"
                  radius={[12, 12, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 平台平均互动率对比 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-3"></div>
            <h3 className="text-xl font-bold text-gray-900">平台平均互动率对比</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="engagementRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.pink[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.pink[1]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={AnalyticsProcessor.formatPercentage}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="avgEngagementRate" 
                  name="平均互动率"
                  fill="url(#engagementRateGradient)"
                  radius={[12, 12, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 第三行：平均完播率对比和收藏量对比 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 平台平均完播率对比 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-3"></div>
            <h3 className="text-xl font-bold text-gray-900">平台平均完播率对比</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="completionRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.success[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.success[1]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={AnalyticsProcessor.formatPercentage}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="avgCompletionRate" 
                  name="平均完播率"
                  fill="url(#completionRateGradient)"
                  radius={[12, 12, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 平台收藏量对比 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full mr-3"></div>
            <h3 className="text-xl font-bold text-gray-900">平台收藏量对比</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="bookmarksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartThemeColors.warning[0]} />
                    <stop offset="100%" stopColor={chartThemeColors.warning[1]} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  tickFormatter={AnalyticsProcessor.formatNumber}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="totalBookmarks" 
                  name="总收藏量"
                  fill="url(#bookmarksGradient)"
                  radius={[12, 12, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 平台互动数据对比 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-3"></div>
          <h3 className="text-xl font-bold text-gray-900">平台互动数据对比</h3>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartThemeColors.danger[0]} />
                  <stop offset="100%" stopColor={chartThemeColors.danger[1]} />
                </linearGradient>
                <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartThemeColors.secondary[0]} />
                  <stop offset="100%" stopColor={chartThemeColors.secondary[1]} />
                </linearGradient>
                <linearGradient id="sharesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartThemeColors.purple[0]} />
                  <stop offset="100%" stopColor={chartThemeColors.purple[1]} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis 
                dataKey="platform" 
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tickFormatter={AnalyticsProcessor.formatNumber}
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="totalLikes" 
                name="点赞量" 
                fill="url(#likesGradient)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={60}
              />
              <Bar 
                dataKey="totalComments" 
                name="评论量" 
                fill="url(#commentsGradient)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={60}
              />
              <Bar 
                dataKey="totalShares" 
                name="分享量" 
                fill="url(#sharesGradient)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 平台总互动数对比 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full mr-3"></div>
          <h3 className="text-xl font-bold text-gray-900">平台总互动数对比</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataWithEngagement} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartThemeColors.accent[0]} />
                  <stop offset="100%" stopColor={chartThemeColors.accent[1]} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis 
                dataKey="platform" 
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tickFormatter={AnalyticsProcessor.formatNumber}
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="totalEngagement"
                name="总互动数"
                fill="url(#engagementGradient)"
                radius={[12, 12, 0, 0]}
                maxBarSize={100}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PlatformComparison;