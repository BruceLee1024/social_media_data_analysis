import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UnifiedData } from '../../types';

interface CompletionRateAnalysisProps {
  data: UnifiedData[];
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
  [key: string]: any; // 动态的视频完播率数据
}

const CompletionRateAnalysis: React.FC<CompletionRateAnalysisProps> = ({ data }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'completionRate' | 'views' | 'publishDate'>('completionRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 处理视频完播率数据
  const videoCompletionData = useMemo((): VideoCompletionData[] => {
    return data
      .filter(item => {
        if (item.来源平台 === '小红书') return false; // 小红书没有完播率数据
        return item.完播率 > 0;
      })
      .map((item, index) => {
        let completionRate = item.完播率;
        const rateStr = String(completionRate);
        
        if (item.来源平台 === '抖音') {
          // 抖音：直接使用原始数据，不再乘以100
          const parsed = typeof completionRate === 'number' ? completionRate : parseFloat(rateStr);
          completionRate = isNaN(parsed) ? 0 : parsed;
        } else if (item.来源平台 === '视频号') {
          // 视频号：统一处理，无论是否包含%符号
          if (rateStr.includes('%')) {
            const parsed = parseFloat(rateStr.replace('%', ''));
            completionRate = isNaN(parsed) ? 0 : parsed;
          } else {
            const parsed = parseFloat(rateStr);
            completionRate = isNaN(parsed) ? 0 : parsed;
          }
        }

        return {
          id: `video_${index}`,
          title: item.标题描述,
          platform: item.来源平台,
          completionRate: Number(completionRate.toFixed(2)),
          views: item.播放量,
          publishDate: item.发布时间 || new Date().toISOString().split('T')[0],
          engagement: item.点赞量 + item.评论量 + item.分享量,
          duration: item.平均播放时长 ? `${item.平均播放时长}s` : undefined,
        };
      });
  }, [data]);

  // 筛选和排序数据
  const filteredAndSortedData = useMemo(() => {
    let filtered = videoCompletionData;
    
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(item => item.platform === selectedPlatform);
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortBy === 'publishDate') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
      }
      
      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;
      return sortOrder === 'desc' ? bNum - aNum : aNum - bNum;
    });
  }, [videoCompletionData, selectedPlatform, sortBy, sortOrder]);

  // 时间序列数据（按发布日期分组）
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    const dateGroups = filteredAndSortedData.reduce((acc, video) => {
      const date = video.publishDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(video);
      return acc;
    }, {} as Record<string, VideoCompletionData[]>);

    return Object.entries(dateGroups)
      .map(([date, videos]) => {
        const avgCompletionRate = videos.reduce((sum, v) => sum + v.completionRate, 0) / videos.length;
        const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
        
        return {
          date,
          avgCompletionRate: Number(avgCompletionRate.toFixed(2)),
          totalViews,
          videoCount: videos.length,
          videos: videos.slice(0, 5), // 只显示前5个视频的详细信息
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredAndSortedData]);

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case '抖音': return '#ff6b6b';
      case '视频号': return '#4ecdc4';
      case '小红书': return '#ff8a80';
      default: return '#95a5a6';
    }
  };

  const platforms = ['all', ...Array.from(new Set(videoCompletionData.map(v => v.platform)))];

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">视频完播率动态分析</h3>
            <p className="text-gray-600 text-sm">展示每个视频的完播率变化趋势和详细数据</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* 平台筛选 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">平台:</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {platform === 'all' ? '全部平台' : platform}
                  </option>
                ))}
              </select>
            </div>

            {/* 排序方式 */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">排序:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'completionRate' | 'views' | 'publishDate')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="completionRate">完播率</option>
                <option value="views">播放量</option>
                <option value="publishDate">发布时间</option>
              </select>
            </div>

            {/* 排序顺序 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
              >
                {sortOrder === 'desc' ? '↓ 降序' : '↑ 升序'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 时间趋势图 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">完播率时间趋势</h3>
          <p className="text-gray-600 text-sm">按发布日期展示平均完播率变化</p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                label={{ value: '完播率 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'avgCompletionRate') return [`${value}%`, '平均完播率'];
                  if (name === 'totalViews') return [value.toLocaleString(), '总播放量'];
                  if (name === 'videoCount') return [value, '视频数量'];
                  return [value, name];
                }}
                labelFormatter={(label) => `发布日期: ${new Date(label).toLocaleDateString()}`}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgCompletionRate" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                name="平均完播率"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 视频完播率排行 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">视频完播率排行</h3>
          <p className="text-gray-600 text-sm">显示前20个视频的完播率数据</p>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredAndSortedData.slice(0, 20)}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="title"
                tick={{ fontSize: 10, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={100}
                tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                label={{ value: '完播率 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  if (name === 'completionRate') return [`${value}%`, '完播率'];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div>
                        <p className="font-medium">{data.title}</p>
                        <p className="text-sm text-gray-600">平台: {data.platform}</p>
                        <p className="text-sm text-gray-600">播放量: {data.views.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">互动量: {data.engagement.toLocaleString()}</p>
                        {data.duration && <p className="text-sm text-gray-600">时长: {data.duration}</p>}
                      </div>
                    );
                  }
                  return label;
                }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="completionRate" 
                fill="#3b82f6"
                name="完播率"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 详细数据表格 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">详细数据列表</h3>
          <p className="text-gray-600 text-sm">所有视频的完播率详细信息</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">完播率</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">播放量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">互动量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时长</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.slice(0, 50).map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={video.title}>
                      {video.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${getPlatformColor(video.platform)}20`,
                        color: getPlatformColor(video.platform)
                      }}
                    >
                      {video.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{video.completionRate}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{video.views.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{video.engagement.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(video.publishDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{video.duration || '-'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedData.length > 50 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            显示前50条记录，共{filteredAndSortedData.length}条记录
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletionRateAnalysis;