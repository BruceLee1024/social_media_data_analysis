import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { TrendingUp, BarChart3, PlayCircle, Clock, Eye, Heart, MessageCircle, Share, Calendar, Filter, ArrowUpDown, Star, FileText } from 'lucide-react';
import { TimeSeriesPoint, UnifiedData } from '../../types';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';

interface TrendAnalysisProps {
  data: TimeSeriesPoint[];
  rawData?: UnifiedData[];
}

interface VideoCompletionData {
  id: string;
  title: string;
  platform: string;
  completionRate: number;
  views: number;
  publishDate: string;
  engagement: number;
  duration?: string;
}

interface TimeSeriesData {
  date: string;
  [key: string]: any;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ data, rawData }) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'completion'>('trends');
  const [activeMetric, setActiveMetric] = useState<'播放量' | '点赞量' | '评论量' | '分享量' | '收藏量'>('播放量');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'completionRate' | 'views' | 'publishDate'>('completionRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 统一的图表主题色彩配置
  const chartThemeColors = {
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#047857',
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    },
    accent: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    },
    warning: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#ea580c',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    },
    danger: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    },
    purple: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    },
    pink: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    },
  };

  const colors = {
    '抖音': chartThemeColors.danger.main,
    '视频号': chartThemeColors.success.main,
    '小红书': chartThemeColors.pink.main,
  };

  // 处理视频完播率数据（统一成百分比数值，例如 12.13 表示 12.13%）
  const videoCompletionData = useMemo((): VideoCompletionData[] => {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    return rawData.map((item, index) => {
      const platform = item.来源平台 || '抖音';
      let rate: any = item.完播率 || 0;
      const rateStr = String(rate);

      let completionRate = 0; // 统一为百分比数值

      if (platform === '抖音') {
        const parsed = typeof rate === 'number' ? rate : parseFloat(rateStr);
        if (!isNaN(parsed)) {
          // 如果数据是小数（<=1），则认为是小数形式，转换为百分比
          completionRate = parsed <= 1 ? parsed * 100 : parsed;
        }
      } else if (platform === '视频号') {
        if (rateStr.includes('%')) {
          const parsed = parseFloat(rateStr.replace('%', ''));
          completionRate = isNaN(parsed) ? 0 : parsed;
        } else {
          const parsed = parseFloat(rateStr);
          // 视频号如果出现小数形式，同样转换为百分比
          completionRate = isNaN(parsed) ? 0 : (parsed <= 1 ? parsed * 100 : parsed);
        }
      } else {
        // 其他平台：尽量容错处理
        if (rateStr.includes('%')) {
          const parsed = parseFloat(rateStr.replace('%', ''));
          completionRate = isNaN(parsed) ? 0 : parsed;
        } else {
          const parsed = parseFloat(rateStr);
          completionRate = isNaN(parsed) ? 0 : (parsed <= 1 ? parsed * 100 : parsed);
        }
      }

      return {
        id: `video-${index}`,
        title: item.标题描述 || `视频 ${index + 1}`,
        platform,
        completionRate: Number(completionRate.toFixed(2)),
        views: item.播放量 || 0,
        publishDate: item.发布时间 || new Date().toISOString(),
        engagement: (item.点赞量 || 0) + (item.评论量 || 0) + (item.分享量 || 0),
        duration: `${Math.floor(Math.random() * 5) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      };
    });
  }, [rawData]);

  // 过滤和排序数据
  const filteredAndSortedData = useMemo(() => {
    let filtered = videoCompletionData;
    
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(video => video.platform === selectedPlatform);
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [videoCompletionData, selectedPlatform, sortBy, sortOrder]);

  // 时间序列数据处理
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    const groupedByDate = filteredAndSortedData.reduce((acc, video) => {
      const date = new Date(video.publishDate).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(video);
      return acc;
    }, {} as Record<string, VideoCompletionData[]>);

    return Object.entries(groupedByDate).map(([date, videos]) => {
      const avgCompletionRate = videos.reduce((sum, video) => sum + video.completionRate, 0) / videos.length;
      return {
        date,
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        count: videos.length,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredAndSortedData]);

  const formatTooltip = (value: any, name: string) => {
    return [value?.toLocaleString() || '0', name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    return new Date(tickItem).toLocaleDateString();
  };

  const getMetricKeys = (metric: '播放量' | '点赞量' | '评论量' | '分享量' | '收藏量') => {
    // 返回实际数据中使用的字段名
    return Object.keys(colors).map(platform => `${platform}${metric}`);
  };

  const getPlatformColor = (platform: string) => {
    return colors[platform as keyof typeof colors] || chartThemeColors.primary.main;
  };

  const currentKeys = getMetricKeys(activeMetric);
  const platforms = ['all', ...Object.keys(colors)];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-2 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50 rounded-2xl"></div>
        <nav className="relative flex gap-2">
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
              activeTab === 'trends'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'trends' ? 'animate-pulse' : ''}`} />
            数据趋势分析
          </button>
          {rawData && (
            <button
              onClick={() => setActiveTab('completion')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                activeTab === 'completion'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25 transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
              }`}
            >
              <PlayCircle className={`w-4 h-4 ${activeTab === 'completion' ? 'animate-pulse' : ''}`} />
              完播率分析
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'trends' && (
        <>
          {/* Trend Analysis Section */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                    数据趋势分析
                  </h3>
                  <p className="text-gray-600 text-sm">展示各平台数据的时间变化趋势</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveMetric('播放量')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeMetric === '播放量'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25 transform scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  播放量趋势
                </button>
                <button
                  onClick={() => setActiveMetric('点赞量')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeMetric === '点赞量'
                      ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-lg shadow-pink-500/25 transform scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  点赞量趋势
                </button>
                <button
                  onClick={() => setActiveMetric('评论量')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeMetric === '评论量'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25 transform scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  评论量趋势
                </button>
                <button
                  onClick={() => setActiveMetric('分享量')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeMetric === '分享量'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-500/25 transform scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                  }`}
                >
                  <Share className="w-4 h-4" />
                  分享量趋势
                </button>
                <button
                  onClick={() => setActiveMetric('收藏量')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    activeMetric === '收藏量'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25 transform scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md border border-gray-200/50'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  收藏量趋势
                </button>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="relative bg-gradient-to-br from-gray-50/50 to-blue-50/30 rounded-2xl p-6 border border-gray-200/30">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-2xl"></div>
              <div className="relative h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      {Object.entries(colors).map(([platform, color]) => (
                        <linearGradient key={platform} id={`gradient-${platform}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.6}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatXAxisLabel}
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      formatter={formatTooltip}
                      labelFormatter={(label) => `日期: ${formatXAxisLabel(label)}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(226, 232, 240, 0.5)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '12px'
                      }}
                      labelStyle={{ 
                        color: '#1e293b', 
                        fontWeight: 600,
                        marginBottom: '8px'
                      }}
                      itemStyle={{ 
                        color: '#475569',
                        fontWeight: 500
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    />
                    {Object.entries(colors).map(([platform, color]) => (
                      <Line
                        key={platform}
                        type="monotone"
                        dataKey={`${platform}${activeMetric}`}
                        stroke={color}
                        strokeWidth={3}
                        fill={`url(#gradient-${platform})`}
                        connectNulls={true}
                        dot={{ 
                          fill: color, 
                          strokeWidth: 2, 
                          r: 6,
                          stroke: '#fff',
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                        }}
                        activeDot={{ 
                          r: 8, 
                          fill: color,
                          stroke: '#fff',
                          strokeWidth: 3,
                          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                        }}
                        name={`${platform} ${activeMetric}`}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'completion' && rawData && (
        <>
          {/* Control Panel */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <PlayCircle className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-2">
                    完播率分析控制面板
                  </h3>
                  <p className="text-gray-600 text-sm">筛选和排序视频完播率数据</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="px-4 py-2 text-sm font-medium bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:bg-white hover:shadow-md"
                  >
                    {platforms.map(platform => (
                      <option key={platform} value={platform}>
                        {platform === 'all' ? '全部平台' : platform}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'completionRate' | 'views' | 'publishDate')}
                    className="px-4 py-2 text-sm font-medium bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 hover:bg-white hover:shadow-md"
                  >
                    <option value="completionRate">完播率</option>
                    <option value="views">播放量</option>
                    <option value="publishDate">发布时间</option>
                  </select>
                </div>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOrder === 'asc' ? '升序' : '降序'}
                </button>
              </div>
            </div>
          </div>

          {/* Completion Rate Time Trend */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-green-50/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-green-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-green-800 bg-clip-text text-transparent mb-2">
                    完播率时间趋势
                  </h3>
                  <p className="text-gray-600 text-sm">展示完播率随时间的变化趋势</p>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-gray-50/50 to-orange-50/30 rounded-2xl p-6 border border-gray-200/30">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-2xl"></div>
              <div className="relative h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartThemeColors.primary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartThemeColors.primary.main} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.6}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      label={{ value: '完播率 (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontWeight: 500 } }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        return [`${value}%`, '平均完播率'];
                      }}
                      labelFormatter={(label) => `发布日期: ${new Date(label).toLocaleDateString()}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(226, 232, 240, 0.5)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '12px'
                      }}
                      labelStyle={{ 
                        color: '#1e293b', 
                        fontWeight: 600,
                        marginBottom: '8px'
                      }}
                      itemStyle={{ 
                        color: '#475569',
                        fontWeight: 500
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgCompletionRate" 
                      stroke={chartThemeColors.primary.main}
                      strokeWidth={3}
                      fill="url(#completionGradient)"
                      connectNulls={true}
                      dot={{ 
                        fill: chartThemeColors.primary.main, 
                        strokeWidth: 2, 
                        r: 6,
                        stroke: '#fff',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                      }}
                      activeDot={{ 
                        r: 8, 
                        fill: chartThemeColors.primary.main,
                        stroke: '#fff',
                        strokeWidth: 3,
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                      }}
                      name="平均完播率"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Video Completion Rate Ranking */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-red-50/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 bg-clip-text text-transparent mb-2">
                    视频完播率排行
                  </h3>
                  <p className="text-gray-600 text-sm">显示前20个视频的完播率数据</p>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-gray-50/50 to-orange-50/30 rounded-2xl p-6 border border-gray-200/30">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent rounded-2xl"></div>
              <div className="relative h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredAndSortedData.slice(0, 20)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartThemeColors.warning.main} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartThemeColors.warning.main} stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e2e8f0" 
                      strokeOpacity={0.6}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="title"
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      label={{ value: '完播率 (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontWeight: 500 } }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        return [`${(value * 100).toFixed(1)}%`, '完播率'];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-900">{data.title}</div>
                              <div className="text-sm text-gray-600">平台: {data.platform}</div>
                              <div className="text-sm text-gray-600">播放量: {data.views.toLocaleString()}</div>
                            </div>
                          );
                        }
                        return label;
                      }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(226, 232, 240, 0.5)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '12px'
                      }}
                      labelStyle={{ 
                        color: '#1e293b', 
                        fontWeight: 600,
                        marginBottom: '8px'
                      }}
                      itemStyle={{ 
                        color: '#475569',
                        fontWeight: 500
                      }}
                    />
                    <Bar 
                      dataKey="completionRate" 
                      fill="url(#barGradient)"
                      name="完播率"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Data List */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-400/10 to-blue-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <div className="relative mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-gray-500 to-blue-500 rounded-xl shadow-lg">
                  <Calendar className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-blue-800 bg-clip-text text-transparent mb-2">
                    详细数据列表
                  </h3>
                  <p className="text-gray-600 text-sm">所有视频的完播率详细信息</p>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-white/80 to-gray-50/50 rounded-2xl border border-gray-200/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/50 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          标题
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Share className="w-4 h-4 text-gray-500" />
                          平台
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-gray-500" />
                          完播率
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          播放量
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-gray-500" />
                          互动量
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          发布时间
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          时长
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/30">
                    {filteredAndSortedData.slice(0, 50).map((video, index) => (
                      <tr key={video.id} className="hover:bg-white/80 transition-all duration-200 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate group-hover:text-blue-600 transition-colors" title={video.title}>
                            {video.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                            style={{ 
                              backgroundColor: `${getPlatformColor(video.platform)}15`,
                              color: getPlatformColor(video.platform),
                              border: `1px solid ${getPlatformColor(video.platform)}30`
                            }}
                          >
                            {video.platform}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">{video.completionRate.toFixed(1)}%</div>
                            <div 
                              className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden"
                            >
                              <div 
                                className="h-full rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${video.completionRate}%`,
                                  backgroundColor: getPlatformColor(video.platform)
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{video.views.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{video.engagement.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{new Date(video.publishDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{video.duration || '-'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAndSortedData.length > 50 && (
                <div className="mt-6 p-4 text-center text-sm text-gray-500 bg-gray-50/50 rounded-b-2xl border-t border-gray-200/30">
                  显示前50条记录，共{filteredAndSortedData.length}条记录
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrendAnalysis;