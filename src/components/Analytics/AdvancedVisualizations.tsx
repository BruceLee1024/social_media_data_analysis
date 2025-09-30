import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, Cell
} from 'recharts';
import { Download, BarChart3 as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, Activity as RadarIcon, AreaChart as AreaChartIcon, ChartScatter } from 'lucide-react';
import { AnalyticsData, PlatformMetrics, TimeSeriesPoint } from '../../types';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';

interface AdvancedVisualizationsProps {
  analytics: AnalyticsData;
}

const COLORS = ['#4f46e5', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d'];

const AdvancedVisualizations: React.FC<AdvancedVisualizationsProps> = ({ analytics }) => {
  const [activeChart, setActiveChart] = useState<'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar'>('bar');

  // 准备散点图数据
  const scatterData = analytics.platformComparison.map(platform => ({
    platform: platform.platform,
    views: platform.totalViews,
    engagement: platform.avgEngagementRate,
    content: platform.totalContent,
    likes: platform.totalLikes
  }));

  // 准备雷达图数据
  const radarData = analytics.platformComparison.map(platform => ({
    subject: platform.platform,
    views: platform.totalViews / 1000000, // 标准化
    engagement: platform.avgEngagementRate * 10,
    content: platform.totalContent / 100,
    likes: platform.totalLikes / 10000
  }));

  const chartTypes = [
    { id: 'bar', name: '柱状图', icon: BarChartIcon },
    { id: 'line', name: '折线图', icon: LineChartIcon },
    { id: 'pie', name: '饼图', icon: PieChartIcon },
    { id: 'area', name: '面积图', icon: AreaChartIcon },
    { id: 'scatter', name: '散点图', icon: ChartScatter },
    { id: 'radar', name: '雷达图', icon: RadarIcon }
  ];

  // 自定义标签格式化函数
  const formatBarLabel = (value: any, name: string) => {
    if (typeof value === 'number') {
      return AnalyticsProcessor.formatNumber(value);
    }
    return value;
  };

  const formatLineLabel = (value: any) => {
    if (typeof value === 'number') {
      return AnalyticsProcessor.formatNumber(value);
    }
    return value;
  };

  const formatAreaLabel = (value: any) => {
    if (typeof value === 'number') {
      return AnalyticsProcessor.formatNumber(value);
    }
    return value;
  };

  const formatPieLabel = (entry: any) => {
    const percent = ((entry.totalContent / analytics.platformComparison.reduce((sum, item) => sum + item.totalContent, 0)) * 100).toFixed(1);
    return `${entry.platform}\n${entry.totalContent}\n(${percent}%)`;
  };

  const formatScatterLabel = (entry: any) => {
    return `${entry.platform}\n${AnalyticsProcessor.formatNumber(entry.views)}`;
  };

  const formatRadarLabel = (value: any) => {
    return value.toFixed(1);
  };

  const renderChart = () => {
    switch (activeChart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.platformComparison} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#f5f5f5" />
              <XAxis dataKey="platform" />
              <YAxis tickFormatter={AnalyticsProcessor.formatNumber} />
              <Tooltip formatter={(value) => [AnalyticsProcessor.formatNumber(value as number), '数值']} />
              <Legend />
              <Bar dataKey="totalViews" name="播放量" fill="#4f46e5" radius={[8, 8, 0, 0]} label={{ position: 'top', fontSize: 11, formatter: formatBarLabel }} />
              <Bar dataKey="totalLikes" name="点赞量" fill="#dc2626" radius={[8, 8, 0, 0]} label={{ position: 'top', fontSize: 11, formatter: formatBarLabel }} />
              <Bar dataKey="totalComments" name="评论量" fill="#059669" radius={[8, 8, 0, 0]} label={{ position: 'top', fontSize: 11, formatter: formatBarLabel }} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tickFormatter={AnalyticsProcessor.formatNumber}
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip formatter={(value) => [AnalyticsProcessor.formatNumber(value as number), '数值']} />
              <Legend />
              <Line type="monotone" dataKey="views" name="播放量" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} label={{ position: 'top', fontSize: 11, formatter: formatLineLabel }} />
              <Line type="monotone" dataKey="likes" name="点赞量" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} label={{ position: 'top', fontSize: 11, formatter: formatLineLabel }} />
              <Line type="monotone" dataKey="comments" name="评论量" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} label={{ position: 'top', fontSize: 11, formatter: formatLineLabel }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analytics.platformComparison}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="totalContent"
                label={formatPieLabel}
                labelLine={false}
              >
                {analytics.platformComparison.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, '内容数量']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tickFormatter={AnalyticsProcessor.formatNumber}
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip formatter={(value) => [AnalyticsProcessor.formatNumber(value as number), '数值']} />
              <Legend />
              <Area type="monotone" dataKey="views" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="likes" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" dataKey="views" name="播放量" tickFormatter={AnalyticsProcessor.formatNumber} />
              <YAxis type="number" dataKey="engagement" name="互动量" tickFormatter={(value) => `${value}%`} />
              <ZAxis type="number" dataKey="content" name="内容数" />
              <Tooltip formatter={(value, name) => {
                if (name === 'engagement') return [`${value}%`, '互动量'];
                return [AnalyticsProcessor.formatNumber(value as number), name];
              }} />
              <Legend />
              <Scatter name="平台数据" data={scatterData} fill="#8884d8" label={{ position: 'top', fontSize: 11, formatter: formatScatterLabel }}>
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="平台指标" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} label={{ position: 'top', fontSize: 11, formatter: formatRadarLabel }} />
              <Radar name="互动指标" dataKey="engagement" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} label={{ position: 'top', fontSize: 11, formatter: formatRadarLabel }} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 图表类型选择 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">高级数据可视化</h3>
          <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            导出图表
          </button>
        </div>
        
        <nav className="flex flex-wrap gap-2">
          {chartTypes.map((chart) => {
            const Icon = chart.icon;
            return (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id as any)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeChart === chart.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {chart.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 图表容器 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-96">
          {renderChart()}
        </div>
      </div>

      {/* 数据统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800">总播放量</h4>
          <p className="text-2xl font-bold text-blue-900">
            {AnalyticsProcessor.formatNumber(
              analytics.platformComparison.reduce((sum, p) => sum + p.totalViews, 0)
            )}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800">总互动量</h4>
          <p className="text-2xl font-bold text-green-900">
            {AnalyticsProcessor.formatNumber(
              analytics.platformComparison.reduce((sum, p) => sum + p.totalLikes + p.totalComments + p.totalShares, 0)
            )}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-800">平均互动量</h4>
          <p className="text-2xl font-bold text-purple-900">
            {(
              analytics.platformComparison.reduce((sum, p) => sum + p.avgEngagementRate, 0) / 
              analytics.platformComparison.length
            ).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedVisualizations;