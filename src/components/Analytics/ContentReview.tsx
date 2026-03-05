import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  Star,
  CheckSquare,
  Square,
  X,
  BarChart3,
  Clock,
  ListChecks,
  Sparkles,
  Settings,
  StopCircle,
  Loader2,
  Minus,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { UnifiedData, ContentGroup } from '../../types';
import { matchContent, normalizeTitle } from '../../utils/contentMatcher';
import { scoreContents, buildScoreMap } from '../../utils/contentScorer';
import { AnalyticsProcessor } from '../../utils/analyticsProcessor';
import { normalizeCompletionRate, formatCompletionRate, supportCompletionRate } from '../../utils/completionRateUtils';
import { streamChat, buildContentAnalysisPrompt, hasDeepSeekApiKey } from '../../utils/deepseekApi';
import AISettingsModal from '../AISettingsModal';

interface ContentReviewProps {
  data: UnifiedData[];
}

const PLATFORM_ORDER: Array<'抖音' | '视频号' | '小红书'> = ['抖音', '视频号', '小红书'];

const PLATFORM_COLORS: Record<string, string> = {
  抖音: 'bg-gray-900 text-white',
  视频号: 'bg-green-600 text-white',
  小红书: 'bg-red-500 text-white',
};

const METRIC_LABELS: Record<string, string> = {
  播放量: '播放量',
  点赞量: '点赞量',
  评论量: '评论量',
  收藏量: '收藏量',
  分享量: '分享量',
  粉丝增量: '粉丝增量',
  曝光量: '曝光量',
  完播率: '完播率',
  平均播放时长: '平均播放时长',
};

// 各平台不支持（导出中不包含）的指标
const PLATFORM_UNSUPPORTED_METRICS: Record<string, Set<string>> = {
  抖音: new Set(['曝光量']),
  视频号: new Set(['收藏量', '体裁类型']),
  小红书: new Set(['完播率']),
};

function isMetricSupported(platform: string, metric: string): boolean {
  return !PLATFORM_UNSUPPORTED_METRICS[platform]?.has(metric);
}

const COMPARE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

type SortKey = 'views' | 'score' | 'date' | 'engagement';

const ContentReview: React.FC<ContentReviewProps> = ({ data }) => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'全部' | '抖音' | '视频号' | '小红书'>('全部');
  const [sortKey, setSortKey] = useState<SortKey>('views');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  // AI 分析状态
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // group.id
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);
  const aiEndRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => matchContent(data), [data]);
  const scoreMap = useMemo(() => buildScoreMap(scoreContents(data)), [data]);

  const groupStats = useMemo(() => {
    return groups.map(group => {
      const platformItems = Object.values(group.platforms);
      const totalEngagement = group.totalLikes + group.totalComments + group.totalShares + group.totalBookmarks;
      const completionRates = platformItems
        .filter(d => supportCompletionRate(d.来源平台) && d.完播率 > 0)
        .map(d => normalizeCompletionRate(d.完播率, d.来源平台));
      const avgCompletionRate = completionRates.length > 0
        ? completionRates.reduce((s, v) => s + v, 0) / completionRates.length
        : 0;
      const maxScore = platformItems.reduce((max, item) => {
        const score = scoreMap.get(item) ?? 0;
        return Math.max(max, score);
      }, 0);
      return {
        group,
        totalEngagement,
        avgCompletionRate,
        maxScore,
      };
    });
  }, [groups, scoreMap]);

  const filteredGroups = useMemo(() => {
    const keyword = search.trim();
    const normalizedKeyword = normalizeTitle(keyword);
    const filtered = groupStats.filter(({ group }) => {
      if (platformFilter !== '全部' && !group.platforms[platformFilter]) return false;
      if (!keyword) return true;
      const title = group.title || '';
      const titleLower = title.toLowerCase();
      return (
        titleLower.includes(keyword.toLowerCase()) ||
        (normalizedKeyword && normalizeTitle(title).includes(normalizedKeyword))
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      switch (sortKey) {
        case 'views':
          return (b.group.totalViews - a.group.totalViews) * dir;
        case 'score':
          return (b.maxScore - a.maxScore) * dir;
        case 'engagement':
          return (b.totalEngagement - a.totalEngagement) * dir;
        case 'date': {
          const ad = new Date(a.group.publishDate).getTime() || 0;
          const bd = new Date(b.group.publishDate).getTime() || 0;
          return (bd - ad) * dir;
        }
        default:
          return 0;
      }
    });
    return sorted;
  }, [groupStats, platformFilter, search, sortKey, sortDir]);

  const selectedGroups = useMemo(
    () => filteredGroups.filter(({ group }) => selectedIds.includes(group.id)),
    [filteredGroups, selectedIds]
  );

  const canSelectMore = selectedIds.length < 4;

  const toggleSelect = (groupId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(groupId)) return prev.filter(id => id !== groupId);
      if (prev.length >= 4) return prev;
      return [...prev, groupId];
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const getBestPlatformByMetric = (group: ContentGroup, metric: keyof typeof METRIC_LABELS) => {
    let bestPlatform: string | null = null;
    let bestValue = -Infinity;
    for (const [platform, item] of Object.entries(group.platforms)) {
      if (!isMetricSupported(platform, metric as string)) continue;
      let value = 0;
      if (metric === '完播率') {
        value = supportCompletionRate(item.来源平台)
          ? normalizeCompletionRate(item.完播率, item.来源平台)
          : 0;
      } else {
        value = (item as any)[metric] || 0;
      }
      if (value > bestValue) {
        bestValue = value;
        bestPlatform = platform;
      }
    }
    return bestValue > 0 ? bestPlatform : null;
  };

  const formatMetricValue = (item: UnifiedData, metric: keyof typeof METRIC_LABELS): string | null => {
    // 该平台不支持的指标返回 null（调用方显示为 —）
    if (!isMetricSupported(item.来源平台, metric as string)) return null;
    if (metric === '完播率') {
      return formatCompletionRate(normalizeCompletionRate(item.完播率, item.来源平台));
    }
    if (metric === '平均播放时长') {
      const val = item.平均播放时长 || 0;
      return `${val.toFixed(2)} 秒`;
    }
    const value = (item as any)[metric] || 0;
    return AnalyticsProcessor.formatNumber(value);
  };

  // AI 分析
  const handleAiAnalysis = useCallback((group: ContentGroup) => {
    if (!hasDeepSeekApiKey()) {
      setAiSettingsOpen(true);
      return;
    }
    // 如果正在加载，取消
    if (aiLoading === group.id) {
      abortRef.current?.abort();
      setAiLoading(null);
      return;
    }
    // 开始流式分析
    setAiLoading(group.id);
    setAiResults(prev => ({ ...prev, [group.id]: '' }));
    setAiErrors(prev => ({ ...prev, [group.id]: '' }));
    const prompt = buildContentAnalysisPrompt(group);
    abortRef.current = streamChat(
      prompt,
      (chunk) => {
        setAiResults(prev => ({ ...prev, [group.id]: (prev[group.id] || '') + chunk }));
      },
      () => setAiLoading(null),
      (err) => setAiErrors(prev => ({ ...prev, [group.id]: err })),
    );
  }, [aiLoading]);

  // 自动滚动到 AI 结果底部
  useEffect(() => {
    if (aiLoading) {
      aiEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [aiResults, aiLoading]);

  const truncate = (text: string, max = 18) => {
    if (!text) return '无标题';
    return text.length > max ? text.slice(0, max) + '…' : text;
  };

  const compareRadarData = useMemo(() => {
    if (selectedGroups.length < 2) return [];
    const metrics = [
      { key: 'views', label: '播放量', getter: (g: ContentGroup) => g.totalViews },
      { key: 'likes', label: '点赞量', getter: (g: ContentGroup) => g.totalLikes },
      { key: 'comments', label: '评论量', getter: (g: ContentGroup) => g.totalComments },
      { key: 'shares', label: '分享量', getter: (g: ContentGroup) => g.totalShares },
      { key: 'bookmarks', label: '收藏量', getter: (g: ContentGroup) => g.totalBookmarks },
      {
        key: 'completion',
        label: '完播率',
        getter: (g: ContentGroup) => {
          const items = Object.values(g.platforms);
          const rates = items
            .filter(d => supportCompletionRate(d.来源平台) && d.完播率 > 0)
            .map(d => normalizeCompletionRate(d.完播率, d.来源平台));
          if (rates.length === 0) return 0;
          return rates.reduce((s, v) => s + v, 0) / rates.length;
        },
      },
    ];
    const maxByMetric: Record<string, number> = {};
    metrics.forEach(m => {
      maxByMetric[m.key] = Math.max(...selectedGroups.map(({ group }) => m.getter(group)));
    });
    return metrics.map(m => {
      const row: Record<string, any> = { metric: m.label };
      selectedGroups.forEach(({ group }) => {
        const maxVal = maxByMetric[m.key] || 0;
        const rawVal = m.getter(group);
        row[group.id] = maxVal > 0 ? Math.round((rawVal / maxVal) * 100) : 0;
      });
      return row;
    });
  }, [selectedGroups]);

  return (
    <div className="space-y-6 pb-36">
      {/* 工具栏 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索内容标题…"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部">全部平台</option>
              <option value="抖音">抖音</option>
              <option value="视频号">视频号</option>
              <option value="小红书">小红书</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-gray-400" />
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="views">按播放量</option>
              <option value="engagement">按互动量</option>
              <option value="score">按综合评分</option>
              <option value="date">按发布时间</option>
            </select>
            <button
              onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50"
              title="切换排序方向"
            >
              {sortDir === 'desc' ? '降序' : '升序'}
            </button>
          </div>
          <button
            onClick={() => setAiSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50"
            title="AI 设置"
          >
            <Settings className="w-4 h-4" />
            AI
          </button>
          <div className="ml-auto text-xs text-gray-500">
            共 {filteredGroups.length} 条内容组
          </div>
        </div>
      </div>

      {/* 内容列表 */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
          暂无匹配内容
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(({ group, totalEngagement, avgCompletionRate, maxScore }) => {
            const isExpanded = expandedId === group.id;
            const isSelected = selectedIds.includes(group.id);
            const checkboxDisabled = !isSelected && !canSelectMore;
            return (
              <div
                key={group.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden"
              >
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-blue-50/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : group.id)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(group.id); }}
                    disabled={checkboxDisabled}
                    className={`w-6 h-6 flex items-center justify-center rounded border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'} ${checkboxDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-400'}`}
                    title={checkboxDisabled ? '最多选择 4 条内容' : '加入对比'}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {group.title || '无标题'}
                      </h4>
                      <span className="text-xs text-gray-400">{group.publishDate?.slice(0, 10) || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      {PLATFORM_ORDER.map(p => (
                        group.platforms[p] ? (
                          <span key={p} className={`px-2 py-0.5 text-xs rounded-full ${PLATFORM_COLORS[p]}`}>
                            {p}
                          </span>
                        ) : (
                          <span key={p} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-400">
                            {p}
                          </span>
                        )
                      ))}
                      <span className="ml-2 text-xs text-gray-400">覆盖 {group.platformCount} 平台</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {AnalyticsProcessor.formatNumber(group.totalViews)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" />
                      {AnalyticsProcessor.formatNumber(totalEngagement)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatCompletionRate(avgCompletionRate)}
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star className="w-3.5 h-3.5" />
                      {maxScore}
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (() => {
                  const activePlatforms = PLATFORM_ORDER.filter(p => group.platforms[p]);
                  const bestPlatformFor: Record<string, string | null> = {};
                  (Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).forEach(metric => {
                    bestPlatformFor[metric] = getBestPlatformByMetric(group, metric);
                  });
                  const aiResult = aiResults[group.id] || '';
                  const aiError = aiErrors[group.id] || '';
                  const isAiLoading = aiLoading === group.id;
                  return (
                    <div className="border-t border-gray-100 bg-white/60 p-4 space-y-4">
                      {/* 汇总条 */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <span className="text-blue-500">播放量</span>
                          <span className="ml-2 font-bold text-blue-800">{AnalyticsProcessor.formatNumber(group.totalViews)}</span>
                        </div>
                        <div className="bg-pink-50 border border-pink-100 rounded-lg px-3 py-2">
                          <span className="text-pink-500">互动量</span>
                          <span className="ml-2 font-bold text-pink-800">{AnalyticsProcessor.formatNumber(totalEngagement)}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                          <span className="text-emerald-500">完播率</span>
                          <span className="ml-2 font-bold text-emerald-800">{formatCompletionRate(avgCompletionRate)}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          <span className="text-amber-500">评分</span>
                          <span className="ml-2 font-bold text-amber-800">{maxScore}</span>
                        </div>
                        <div className="ml-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAiAnalysis(group); }}
                            disabled={isAiLoading && aiLoading !== group.id}
                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isAiLoading
                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                          >
                            {isAiLoading ? (
                              <><StopCircle className="w-4 h-4" />停止分析</>
                            ) : (
                              <><Sparkles className="w-4 h-4" />AI 分析</>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 横向指标对比表 */}
                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-gray-500">
                              <th className="py-2.5 px-3 text-left font-medium w-24">指标</th>
                              {activePlatforms.map(p => (
                                <th key={p} className="py-2.5 px-3 text-center font-medium">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${PLATFORM_COLORS[p]}`}>{p}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map(metric => (
                              <tr key={metric} className="border-t border-gray-50 hover:bg-blue-50/20">
                                <td className="py-2 px-3 text-gray-600 font-medium">{METRIC_LABELS[metric]}</td>
                                {activePlatforms.map(platform => {
                                  const item = group.platforms[platform];
                                  const value = formatMetricValue(item, metric);
                                  const isBest = bestPlatformFor[metric] === platform;
                                  const isUnsupported = value === null;
                                  return (
                                    <td key={platform} className="py-2 px-3 text-center">
                                      {isUnsupported ? (
                                        <span className="inline-flex items-center gap-1 text-gray-300" title="该平台不提供此指标">
                                          <Minus className="w-3 h-3" />
                                        </span>
                                      ) : (
                                        <span className={`font-semibold ${
                                          isBest ? 'text-green-700 bg-green-50 px-2 py-0.5 rounded' : 'text-gray-800'
                                        }`}>
                                          {value}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 扩展字段折叠 */}
                      {activePlatforms.some(p => Object.keys(group.platforms[p].扩展字段 || {}).length > 0) && (() => {
                        const allExtKeys = Array.from(new Set(
                          activePlatforms.flatMap(p => Object.keys(group.platforms[p]?.扩展字段 || {}))
                        )).sort((a, b) => a.localeCompare(b, 'zh-CN'));
                        const extFieldCount = allExtKeys.length;
                        const formatExtValue = (value: any, key: string): { display: string; isRate: boolean } => {
                          const isRate = /率$/.test(key);
                          if (value === null || value === undefined || value === '') return { display: '-', isRate };
                          if (isRate) {
                            const num = typeof value === 'number' ? value : parseFloat(String(value).replace('%', ''));
                            if (!isNaN(num)) {
                              const pct = String(value).includes('%') ? num : (num <= 1 && num > 0 ? num * 100 : num);
                              return { display: pct.toFixed(2) + '%', isRate: true };
                            }
                            return { display: String(value), isRate: true };
                          }
                          if (typeof value === 'number' && value >= 1000) {
                            return { display: AnalyticsProcessor.formatNumber(value), isRate: false };
                          }
                          return { display: String(value), isRate: false };
                        };
                        return (
                          <details className="rounded-xl border border-gray-200 bg-white">
                            <summary className="px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50/80 select-none flex items-center gap-2">
                              <span className="bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 text-[10px] font-mono">EXT</span>
                              扩展字段
                              <span className="text-[10px] text-gray-400 font-normal ml-1">（{extFieldCount} 项）</span>
                            </summary>
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="bg-gray-50 text-gray-500">
                                    <th className="py-2.5 px-4 text-left font-medium w-36 sticky left-0 bg-gray-50 z-10">字段</th>
                                    {activePlatforms.map(p => (
                                      <th key={p} className="py-2.5 px-4 text-center font-medium">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${PLATFORM_COLORS[p]}`}>{p}</span>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {allExtKeys.map((key, idx) => (
                                    <tr key={key} className={`border-t border-gray-50 hover:bg-blue-50/20 ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                                      <td className="py-2 px-4 text-gray-600 font-medium sticky left-0 bg-white z-10 whitespace-nowrap">{key}</td>
                                      {activePlatforms.map(platform => {
                                        const extObj = group.platforms[platform]?.扩展字段 || {};
                                        const rawVal = extObj[key];
                                        const hasField = key in extObj;
                                        const { display, isRate } = formatExtValue(rawVal, key);
                                        return (
                                          <td key={platform} className="py-2 px-4 text-center">
                                            {!hasField ? (
                                              <span className="inline-flex items-center gap-1 text-gray-300" title="该平台无此字段">
                                                <Minus className="w-3 h-3" />
                                              </span>
                                            ) : (
                                              <span className={`font-medium tabular-nums ${
                                                isRate && display !== '-'
                                                  ? 'text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded'
                                                  : 'text-gray-800'
                                              }`}>
                                                {display}
                                              </span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        );
                      })()}

                      {/* AI 分析结果 */}
                      {(aiResult || aiError || isAiLoading) && (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-900">AI 分析</span>
                            {isAiLoading && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
                          </div>
                          {aiError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                              {aiError}
                            </div>
                          )}
                          {aiResult && (
                            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                              <ReactMarkdown>{aiResult}</ReactMarkdown>
                            </div>
                          )}
                          <div ref={aiEndRef} />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* 底部对比面板 */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(1200px,calc(100%-2rem))] z-40">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4">
            <div className="flex items-center flex-wrap gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">
                已选择 {selectedIds.length} 条内容
              </span>
              <div className="flex flex-wrap gap-2 ml-2">
                {selectedGroups.map(({ group }) => (
                  <span key={group.id} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full flex items-center gap-1">
                    {truncate(group.title, 12)}
                    <button
                      onClick={() => toggleSelect(group.id)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清空
                </button>
                <button
                  onClick={() => setCompareOpen(v => !v)}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {compareOpen ? '收起对比' : '展开对比'}
                </button>
              </div>
            </div>

            {compareOpen && (
              <div className="mt-4 space-y-4">
                {selectedGroups.length < 2 ? (
                  <div className="text-sm text-gray-500">请选择至少 2 条内容进行对比</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">多内容指标对比</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-2 pr-4">内容</th>
                                <th className="py-2 pr-4">平台数</th>
                                <th className="py-2 pr-4">播放量</th>
                                <th className="py-2 pr-4">互动量</th>
                                <th className="py-2 pr-4">完播率</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedGroups.map(({ group, totalEngagement, avgCompletionRate }) => (
                                <tr key={group.id} className="border-t border-gray-100">
                                  <td className="py-2 pr-4 text-gray-800 font-medium">{truncate(group.title, 18)}</td>
                                  <td className="py-2 pr-4 text-gray-600">{group.platformCount}</td>
                                  <td className="py-2 pr-4 text-gray-600">{AnalyticsProcessor.formatNumber(group.totalViews)}</td>
                                  <td className="py-2 pr-4 text-gray-600">{AnalyticsProcessor.formatNumber(totalEngagement)}</td>
                                  <td className="py-2 pr-4 text-gray-600">{formatCompletionRate(avgCompletionRate)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">对比雷达图（归一化）</div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={compareRadarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="metric" />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              {selectedGroups.map(({ group }, idx) => (
                                <Radar
                                  key={group.id}
                                  name={truncate(group.title, 10)}
                                  dataKey={group.id}
                                  stroke={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                                  fill={COMPARE_COLORS[idx % COMPARE_COLORS.length]}
                                  fillOpacity={0.2}
                                />
                              ))}
                              <Tooltip />
                              <Legend />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 设置弹窗 */}
      <AISettingsModal open={aiSettingsOpen} onClose={() => setAiSettingsOpen(false)} />
    </div>
  );
};

export default ContentReview;
