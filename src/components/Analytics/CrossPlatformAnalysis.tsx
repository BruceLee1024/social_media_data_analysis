import React, { useMemo, useState } from 'react';
import { Layers, Eye, Heart, MessageCircle, Share2, BookmarkPlus, TrendingUp, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UnifiedData } from '../../types';
import { matchContent } from '../../utils/contentMatcher';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';

interface CrossPlatformAnalysisProps {
  data: UnifiedData[];
}

const PLATFORM_COLORS: Record<string, string> = {
  '抖音': 'bg-gray-900 text-white',
  '视频号': 'bg-green-600 text-white',
  '小红书': 'bg-red-500 text-white',
};

const PLATFORM_TEXT: Record<string, string> = {
  '抖音': 'text-gray-900',
  '视频号': 'text-green-600',
  '小红书': 'text-red-500',
};

const ALL_PLATFORMS = ['抖音', '视频号', '小红书'];

type SortKey = 'totalViews' | 'totalLikes' | 'totalComments' | 'platformCount';

const CrossPlatformAnalysis: React.FC<CrossPlatformAnalysisProps> = ({ data }) => {
  const [sortKey, setSortKey] = useState<SortKey>('totalViews');
  const [showOnlyMulti, setShowOnlyMulti] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groups = useMemo(() => matchContent(data), [data]);

  const multiPlatformGroups = useMemo(
    () => groups.filter(g => g.platformCount >= 2),
    [groups]
  );

  const singlePlatformGroups = useMemo(
    () => groups.filter(g => g.platformCount === 1),
    [groups]
  );

  const displayGroups = useMemo(() => {
    const base = showOnlyMulti ? multiPlatformGroups : groups;
    return [...base].sort((a, b) => {
      if (sortKey === 'platformCount') return b.platformCount - a.platformCount;
      return b[sortKey] - a[sortKey];
    });
  }, [groups, multiPlatformGroups, showOnlyMulti, sortKey]);

  // 各平台在跨平台内容中的平均播放量对比
  const platformAvgStats = useMemo(() => {
    const stats: Record<string, { totalViews: number; totalEngagement: number; count: number }> = {};
    for (const group of multiPlatformGroups) {
      for (const [platform, item] of Object.entries(group.platforms)) {
        if (!stats[platform]) stats[platform] = { totalViews: 0, totalEngagement: 0, count: 0 };
        stats[platform].totalViews += item.播放量 || 0;
        stats[platform].totalEngagement += (item.点赞量 || 0) + (item.评论量 || 0) + (item.分享量 || 0) + (item.收藏量 || 0);
        stats[platform].count++;
      }
    }
    return Object.entries(stats).map(([platform, s]) => ({
      platform,
      avgViews: s.count > 0 ? Math.round(s.totalViews / s.count) : 0,
      avgEngagement: s.count > 0 ? Math.round(s.totalEngagement / s.count) : 0,
      count: s.count,
    })).sort((a, b) => b.avgViews - a.avgViews);
  }, [multiPlatformGroups]);

  const bestViewsPlatform = platformAvgStats[0]?.platform ?? '-';

  return (
    <div className="space-y-8">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full -translate-y-10 translate-x-10" />
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{multiPlatformGroups.length}</p>
          <p className="text-sm text-gray-500 mt-1">已跨平台分发内容</p>
          <p className="text-xs text-gray-400 mt-1">覆盖 2 个及以上平台</p>
        </div>

        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100/50 to-teal-100/50 rounded-full -translate-y-10 translate-x-10" />
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{singlePlatformGroups.length}</p>
          <p className="text-sm text-gray-500 mt-1">仅单平台内容</p>
          <p className="text-xs text-gray-400 mt-1">未在其他平台匹配到</p>
        </div>

        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-100/50 to-yellow-100/50 rounded-full -translate-y-10 translate-x-10" />
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mb-3">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{bestViewsPlatform}</p>
          <p className="text-sm text-gray-500 mt-1">同内容播放量最高平台</p>
          <p className="text-xs text-gray-400 mt-1">基于跨平台内容平均值</p>
        </div>
      </div>

      {/* 平台表现总结（仅跨平台内容） */}
      {platformAvgStats.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">同内容跨平台表现对比</h3>
          <p className="text-xs text-gray-500 mb-4">仅统计已在多平台分发的内容，排除仅在单平台发布的内容</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {platformAvgStats.map(({ platform, avgViews, avgEngagement, count }) => (
              <div key={platform} className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PLATFORM_COLORS[platform] ?? 'bg-gray-500 text-white'}`}>
                    {platform}
                  </span>
                  <span className="text-xs text-gray-400">{count} 条内容</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">平均播放量</p>
                    <p className={`text-lg font-bold ${PLATFORM_TEXT[platform] ?? 'text-gray-700'}`}>
                      {AnalyticsProcessor.formatNumber(avgViews)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">平均互动量</p>
                    <p className="text-base font-semibold text-gray-700">
                      {AnalyticsProcessor.formatNumber(avgEngagement)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 内容列表 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-lg">
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-bold text-gray-900">内容跨平台数据明细</h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* 过滤开关 */}
            <button
              onClick={() => setShowOnlyMulti(v => !v)}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                showOnlyMulti
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              {showOnlyMulti ? '显示跨平台' : '显示全部'}
            </button>

            {/* 排序 */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="totalViews">按总播放量</option>
              <option value="totalLikes">按总点赞量</option>
              <option value="totalComments">按总评论量</option>
              <option value="platformCount">按平台数量</option>
            </select>
          </div>
        </div>

        {displayGroups.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无跨平台内容数据</p>
            <p className="text-gray-400 text-sm mt-1">请上传多个平台的数据文件</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayGroups.map(group => {
              const isExpanded = expandedId === group.id;
              return (
                <div
                  key={group.id}
                  className="border border-gray-200/70 rounded-xl overflow-hidden hover:border-blue-200 transition-colors"
                >
                  {/* 行头 */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer bg-white/60 hover:bg-blue-50/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                  >
                    {/* 平台徽标 */}
                    <div className="flex items-center gap-1 min-w-[96px]">
                      {ALL_PLATFORMS.map(p => (
                        <span
                          key={p}
                          className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                            group.platforms[p]
                              ? (PLATFORM_COLORS[p] ?? 'bg-gray-500 text-white')
                              : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          {p === '抖音' ? '抖' : p === '视频号' ? '视' : '红'}
                        </span>
                      ))}
                    </div>

                    {/* 标题 */}
                    <p className="flex-1 text-sm font-medium text-gray-800 line-clamp-1 min-w-0">
                      {group.title}
                    </p>

                    {/* 汇总数据 */}
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        {AnalyticsProcessor.formatNumber(group.totalViews)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-red-400" />
                        {AnalyticsProcessor.formatNumber(group.totalLikes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                        {AnalyticsProcessor.formatNumber(group.totalComments)}
                      </span>
                    </div>

                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    }
                  </div>

                  {/* 展开详情：各平台数据横向对比 */}
                  {isExpanded && (() => {
                    const availablePlatforms = ALL_PLATFORMS.filter(p => group.platforms[p]);
                    const chartData = availablePlatforms.map(p => ({
                      platform: p,
                      播放量: group.platforms[p].播放量 || 0,
                      点赞量: group.platforms[p].点赞量 || 0,
                    }));
                    const maxViews = Math.max(...chartData.map(d => d.播放量));
                    const bestPlatform = chartData.find(d => d.播放量 === maxViews)?.platform ?? '';
                    const platformBarColors: Record<string, string> = {
                      '抖音': '#374151', '视频号': '#10b981', '小红书': '#ef4444',
                    };
                    return (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                      <p className="text-xs text-gray-400 mb-3">
                        发布时间：{group.publishDate ? group.publishDate.slice(0, 10) : '-'}
                      </p>

                      {/* 内嵌小型柱状图 */}
                      {availablePlatforms.length >= 2 && (
                        <div className="mb-4 bg-white/80 rounded-xl border border-gray-100 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-500">平台数据对比</p>
                            {bestPlatform && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3" />
                                {bestPlatform} 播放最佳
                              </span>
                            )}
                          </div>
                          <div className="h-28">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }} barCategoryGap="30%">
                                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={AnalyticsProcessor.formatNumber} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                  formatter={(v: number, name: string) => [AnalyticsProcessor.formatNumber(v), name]}
                                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                />
                                <Bar dataKey="播放量" name="播放量" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                  {chartData.map(entry => (
                                    <Cell
                                      key={entry.platform}
                                      fill={platformBarColors[entry.platform] ?? '#6b7280'}
                                      opacity={entry.platform === bestPlatform ? 1 : 0.45}
                                    />
                                  ))}
                                </Bar>
                                <Bar dataKey="点赞量" name="点赞量" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#f87171" opacity={0.7} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {ALL_PLATFORMS.map(platform => {
                          const item = group.platforms[platform];
                          if (!item) {
                            return (
                              <div key={platform} className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                                <span className="text-xs text-gray-400">{platform} — 未发布</span>
                              </div>
                            );
                          }
                          const engagement = (item.点赞量 || 0) + (item.评论量 || 0) + (item.分享量 || 0) + (item.收藏量 || 0);
                          const engagementRate = item.播放量 > 0 ? ((engagement / item.播放量) * 100).toFixed(1) : '0.0';
                          return (
                            <div key={platform} className="rounded-xl border border-gray-200 bg-white/80 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PLATFORM_COLORS[platform] ?? 'bg-gray-500 text-white'}`}>
                                  {platform}
                                </span>
                                <span className="text-xs text-gray-400">{item.发布时间 ? item.发布时间.slice(0, 10) : '-'}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1.5 p-2 bg-blue-50 rounded-lg">
                                  <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <div>
                                    <p className="text-gray-500">播放</p>
                                    <p className="font-semibold text-gray-800">{AnalyticsProcessor.formatNumber(item.播放量)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 p-2 bg-red-50 rounded-lg">
                                  <Heart className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                  <div>
                                    <p className="text-gray-500">点赞</p>
                                    <p className="font-semibold text-gray-800">{AnalyticsProcessor.formatNumber(item.点赞量)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 p-2 bg-green-50 rounded-lg">
                                  <MessageCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  <div>
                                    <p className="text-gray-500">评论</p>
                                    <p className="font-semibold text-gray-800">{AnalyticsProcessor.formatNumber(item.评论量)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 p-2 bg-purple-50 rounded-lg">
                                  <Share2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                  <div>
                                    <p className="text-gray-500">分享</p>
                                    <p className="font-semibold text-gray-800">{AnalyticsProcessor.formatNumber(item.分享量)}</p>
                                  </div>
                                </div>
                                {item.收藏量 > 0 && (
                                  <div className="flex items-center gap-1.5 p-2 bg-yellow-50 rounded-lg">
                                    <BookmarkPlus className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                    <div>
                                      <p className="text-gray-500">收藏</p>
                                      <p className="font-semibold text-gray-800">{AnalyticsProcessor.formatNumber(item.收藏量)}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 p-2 bg-orange-50 rounded-lg">
                                  <TrendingUp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  <div>
                                    <p className="text-gray-500">互动率</p>
                                    <p className="font-semibold text-gray-800">{engagementRate}%</p>
                                  </div>
                                </div>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossPlatformAnalysis;
