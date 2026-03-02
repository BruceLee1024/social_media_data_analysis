import React, { useState, useMemo, useRef } from 'react';
import { UnifiedData, PlatformStat, TotalStats } from '../types';
import { Eye, Download, BarChart3, UserPlus, Search, ChevronUp, ChevronDown, ChevronsUpDown, Flame, TrendingDown as TrendDown, SlidersHorizontal, Star, ChevronDown as Caret, X as ClearIcon } from 'lucide-react';
import { normalizeCompletionRate, formatCompletionRate, supportCompletionRate } from '../utils/completionRateUtils';
import { scoreContents } from '../utils/contentScorer';
import { DataExporter } from '../utils/exporter';
import { getPlatformStyle } from '../utils/platformStyle';

interface DataPreviewProps {
  data: UnifiedData[];
  onExport: () => void;
  summary: any;
}

type SortField = '播放量' | '点赞量' | '评论量' | '评分' | null;

const DataPreview: React.FC<DataPreviewProps> = ({ data, onExport, summary }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // 高级筛选状态
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advDateFrom, setAdvDateFrom] = useState('');
  const [advDateTo, setAdvDateTo] = useState('');
  const [advMinViews, setAdvMinViews] = useState('');
  const [advMaxViews, setAdvMaxViews] = useState('');
  const [onlyViral, setOnlyViral] = useState(false);
  const [onlyLow, setOnlyLow] = useState(false);

  // 导出下拉
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const hasAdvFilter = !!(advDateFrom || advDateTo || advMinViews || advMaxViews || onlyViral || onlyLow);
  const resetAdv = () => { setAdvDateFrom(''); setAdvDateTo(''); setAdvMinViews(''); setAdvMaxViews(''); setOnlyViral(false); setOnlyLow(false); };

  const allPlatforms = useMemo(() => Array.from(new Set(data.map(r => r.来源平台))).sort(), [data]);

  // 评分计算
  const scoredMap = useMemo(() => {
    const scored = scoreContents(data);
    const m = new Map<UnifiedData, number>();
    scored.forEach(s => m.set(s.data, s.score));
    return m;
  }, [data]);

  // 异常检测：计算播放量均值（必须在 filteredAndSortedData 之前声明）
  const anomalyInfo = useMemo(() => {
    const views = data.map(r => r.播放量 || 0).filter(v => v > 0);
    if (views.length === 0) return { viralThreshold: Infinity, lowThreshold: 0 };
    const mean = views.reduce((s, v) => s + v, 0) / views.length;
    return { viralThreshold: mean * 2, lowThreshold: mean * 0.5 };
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let result = data;
    if (platformFilter !== 'all') result = result.filter(r => r.来源平台 === platformFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => r.标题描述?.toLowerCase().includes(q));
    }
    // 高级筛选
    if (advDateFrom) result = result.filter(r => (r.发布时间?.slice(0,10) || '') >= advDateFrom);
    if (advDateTo) result = result.filter(r => (r.发布时间?.slice(0,10) || '') <= advDateTo);
    const minV = advMinViews ? Number(advMinViews) : 0;
    const maxV = advMaxViews ? Number(advMaxViews) : Infinity;
    if (advMinViews || advMaxViews) result = result.filter(r => { const v = r.播放量||0; return v >= minV && v <= maxV; });
    if (onlyViral) result = result.filter(r => (r.播放量||0) > anomalyInfo.viralThreshold);
    if (onlyLow) result = result.filter(r => { const v = r.播放量||0; return v > 0 && v < anomalyInfo.lowThreshold; });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const av = sortField === '评分'
          ? (scoredMap.get(a) ?? 0)
          : ((a[sortField as keyof UnifiedData] as number) || 0);
        const bv = sortField === '评分'
          ? (scoredMap.get(b) ?? 0)
          : ((b[sortField as keyof UnifiedData] as number) || 0);
        return sortDir === 'desc' ? bv - av : av - bv;
      });
    }
    return result;
  }, [data, platformFilter, searchQuery, sortField, sortDir, advDateFrom, advDateTo, advMinViews, advMaxViews, onlyViral, onlyLow, anomalyInfo, scoredMap]);

  const handleSort = (field: '播放量' | '点赞量' | '评论量' | '评分') => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: '播放量' | '点赞量' | '评论量' | '评分' }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 ml-1 text-blue-500" />
      : <ChevronUp className="w-3 h-3 ml-1 text-blue-500" />;
  };

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  // 计算平台统计数据
  const platformStats = useMemo<Record<string, PlatformStat>>(() => {
    const statsByPlatform = data.reduce((acc, row) => {
      const platform = row.来源平台;
      if (!acc[platform]) {
        acc[platform] = {
          count: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalBookmarks: 0,
          totalFollowers: 0,
          avgCompletionRate: 0,
          hasShares: false,
          hasBookmarks: false,
        };
      }
      
      acc[platform].count++;
      acc[platform].totalViews += row.播放量;
      acc[platform].totalLikes += row.点赞量;
      acc[platform].totalComments += row.评论量;
      acc[platform].totalFollowers += row.粉丝增量;
      
      // 处理可能缺失的字段
      if (typeof row.分享量 === 'number') {
        acc[platform].totalShares += row.分享量;
        acc[platform].hasShares = true;
      }
      
      if (typeof row.收藏量 === 'number') {
        acc[platform].totalBookmarks += row.收藏量;
        acc[platform].hasBookmarks = true;
      }
      
      // 使用已处理过的完播率数据，排除小红书
      if (supportCompletionRate(platform) && row.完播率 > 0) {
        const processedRate = normalizeCompletionRate(row.完播率, platform);
        acc[platform].avgCompletionRate += processedRate;
      }
      
      return acc;
    }, {} as Record<string, PlatformStat>);

    // 计算平均值
    Object.entries(statsByPlatform).forEach(([platform, stats]) => {
      stats.avgViews = stats.totalViews / stats.count;
      stats.avgLikes = stats.totalLikes / stats.count;
      stats.avgComments = stats.totalComments / stats.count;
      stats.avgShares = stats.hasShares ? stats.totalShares / stats.count : 0;
      stats.avgBookmarks = stats.hasBookmarks ? stats.totalBookmarks / stats.count : 0;
      
      // 计算完播率平均值，排除小红书
      if (supportCompletionRate(platform)) {
        const validCompletionRateCount = data.filter(row => 
          row.来源平台 === platform && row.完播率 > 0
        ).length;
        stats.avgCompletionRate = validCompletionRateCount > 0 ? 
          stats.avgCompletionRate / validCompletionRateCount : 0;
      } else {
        stats.avgCompletionRate = 0;
      }
      
      // 计算平均互动数
      const interactionComponents = [
        stats.totalLikes,
        stats.totalComments,
        stats.hasShares ? stats.totalShares : 0,
        stats.hasBookmarks ? stats.totalBookmarks : 0
      ];
      
      const totalInteractions = interactionComponents.reduce((sum, val) => sum + val, 0);
      stats.avgInteractions = totalInteractions / stats.count;
    });

    return statsByPlatform;
  }, [data]);

  // 计算总体统计数据
  const totalStats = useMemo((): TotalStats => {
    // 计算总涨粉数
    const totalFollowers = data.reduce((sum, row) => sum + row.粉丝增量, 0);
    
    return {
      totalCount: data.length,
      totalPlatforms: Object.keys(platformStats).length,
      totalFollowers, // 总涨粉数
      dateRange: {
        start: data.reduce((min, row) => row.发布时间 < min ? row.发布时间 : min, data[0]?.发布时间 || ''),
        end: data.reduce((max, row) => row.发布时间 > max ? row.发布时间 : max, data[0]?.发布时间 || ''),
      }
    };
  }, [data, platformStats]);

  // 计算全平台平均值
  const overallAverageStats = useMemo(() => {
    const platformCount = Object.keys(platformStats).length;
    if (platformCount === 0) return null;

    // 初始化统计数据
    const stats: PlatformStat = {
      count: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalBookmarks: 0,
      totalFollowers: 0,
      avgViews: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      avgBookmarks: 0,
      avgCompletionRate: 0,
      avgInteractions: 0,
      hasShares: false,
      hasBookmarks: false
    };

    // 累加各平台的平均值
    Object.values(platformStats).forEach((platformStat: PlatformStat) => {
      stats.avgViews += platformStat.avgViews ?? 0;
      stats.avgLikes += platformStat.avgLikes ?? 0;
      stats.avgComments += platformStat.avgComments ?? 0;
      stats.avgCompletionRate += platformStat.avgCompletionRate ?? 0;
      
      // 只有当平台有分享数据时才累加
      if (platformStat.hasShares) {
        stats.avgShares += platformStat.avgShares ?? 0;
        stats.hasShares = true;
      }
      
      // 只有当平台有收藏数据时才累加
      if (platformStat.hasBookmarks) {
        stats.avgBookmarks += platformStat.avgBookmarks ?? 0;
        stats.hasBookmarks = true;
      }
      
      // 累加平均互动数
      stats.avgInteractions += platformStat.avgInteractions ?? 0;
    });

    // 计算最终的平均值
    stats.avgViews! /= platformCount;
    stats.avgLikes! /= platformCount;
    stats.avgComments! /= platformCount;
    stats.avgCompletionRate! /= platformCount;
    stats.avgInteractions! /= platformCount;
    
    // 只有当至少有一个平台有分享数据时才计算平均值
    if (stats.hasShares) {
      stats.avgShares! /= platformCount;
    }
    
    // 只有当至少有一个平台有收藏数据时才计算平均值
    if (stats.hasBookmarks) {
      stats.avgBookmarks! /= platformCount;
    }

    return stats;
  }, [platformStats]);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) {
      return '0';
    }
    return num.toLocaleString();
  };

  const formatCompletionRateDisplay = (rate: number, platform: string) => {
    return formatCompletionRate(rate);
  };

  return (
    <div className="space-y-6">
      {/* 数据预览表格 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <Eye className="w-5 h-5 text-white" />
              </div>
              数据预览
              <span className="ml-3 text-sm font-normal text-gray-500">
                {filteredAndSortedData.length !== data.length
                  ? `已筛选 ${filteredAndSortedData.length} / ${data.length} 条`
                  : `共 ${data.length} 条`}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              {/* 高级筛选按钮 */}
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showAdvanced || hasAdvFilter ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                高级筛选{hasAdvFilter && <span className="ml-1 w-2 h-2 bg-amber-500 rounded-full" />}
              </button>
              {/* 导出下拉 */}
              <div ref={exportRef} className="relative">
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  导出<Caret className="w-3 h-3 ml-1" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
                    {[
                      { label: '全部数据', action: () => { onExport(); setShowExportMenu(false); } },
                      { label: '当前筛选结果', action: () => { DataExporter.exportToExcel(filteredAndSortedData, `筛选数据_${Date.now()}.xlsx`); setShowExportMenu(false); } },
                      { label: 'Top 20（按评分）', action: () => { const top = [...data].sort((a,b)=>(scoredMap.get(b)??0)-(scoredMap.get(a)??0)).slice(0,20); DataExporter.exportToExcel(top, `Top20评分_${Date.now()}.xlsx`); setShowExportMenu(false); } },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 高级筛选面板 */}
          {showAdvanced && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">发布日期从</label>
                  <input type="date" value={advDateFrom} onChange={e => { setAdvDateFrom(e.target.value); setCurrentPage(1); }} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">至</label>
                  <input type="date" value={advDateTo} onChange={e => { setAdvDateTo(e.target.value); setCurrentPage(1); }} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">播放量 ≥</label>
                  <input type="number" min="0" placeholder="不限" value={advMinViews} onChange={e => { setAdvMinViews(e.target.value); setCurrentPage(1); }} className="w-28 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">播放量 ≤</label>
                  <input type="number" min="0" placeholder="不限" value={advMaxViews} onChange={e => { setAdvMaxViews(e.target.value); setCurrentPage(1); }} className="w-28 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white" />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
                  <input type="checkbox" checked={onlyViral} onChange={e => { setOnlyViral(e.target.checked); if(e.target.checked) setOnlyLow(false); setCurrentPage(1); }} />
                  <Flame className="w-3.5 h-3.5 text-orange-500" />仅爆款
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
                  <input type="checkbox" checked={onlyLow} onChange={e => { setOnlyLow(e.target.checked); if(e.target.checked) setOnlyViral(false); setCurrentPage(1); }} />
                  <TrendDown className="w-3.5 h-3.5 text-gray-400" />仅低效
                </label>
                {hasAdvFilter && (
                  <button onClick={() => { resetAdv(); setCurrentPage(1); }} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                    <ClearIcon className="w-3.5 h-3.5" />清除筛选
                  </button>
                )}
              </div>
            </div>
          )}
          {/* 搜索 + 平台筛选 */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索标题关键词..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setPlatformFilter('all'); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  platformFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                全部
              </button>
              {allPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => { setPlatformFilter(p); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    platformFilter === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平台
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发布时间
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSort('播放量')}
                >
                  <span className="inline-flex items-center justify-end">播放量<SortIcon field="播放量" /></span>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSort('点赞量')}
                >
                  <span className="inline-flex items-center justify-end">点赞量<SortIcon field="点赞量" /></span>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSort('评论量')}
                >
                  <span className="inline-flex items-center justify-end">评论量<SortIcon field="评论量" /></span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  转发量
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  收藏量
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  完播率
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  涨粉数
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600 select-none"
                  onClick={() => handleSort('评分')}
                >
                  <span className="inline-flex items-center justify-end"><Star className="w-3 h-3 mr-0.5" />评分<SortIcon field="评分" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((row, index) => {
                const views = row.播放量 || 0;
                const isViral = views > anomalyInfo.viralThreshold;
                const isLow = views > 0 && views < anomalyInfo.lowThreshold;
                return (
                <tr key={index} className={`transition-colors duration-200 ${
                  isViral ? 'bg-orange-50/40 hover:bg-orange-50/60' :
                  isLow ? 'bg-gray-50/60 hover:bg-gray-100/60 opacity-80' :
                  'hover:bg-gray-50'
                }`}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm bg-gradient-to-r ${getPlatformStyle(row.来源平台).gradient} text-white`}>
                      {row.来源平台}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate font-medium">
                    {row.标题描述}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {row.发布时间.slice(0, 10)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-blue-700 text-right">
                    <span className="inline-flex items-center justify-end gap-1">
                      {isViral && <Flame className="w-3.5 h-3.5 text-orange-500" title="爆款内容：播放量超均值2倍" />}
                      {isLow && <TrendDown className="w-3.5 h-3.5 text-gray-400" title="表现较差：播放量低于均值50%" />}
                      {formatNumber(row.播放量)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                    {formatNumber(row.点赞量)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                    {formatNumber(row.评论量)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-purple-600 text-right">
                    {formatNumber(row.分享量)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-amber-600 text-right">
                    {row.来源平台 === '视频号' ? '-' : formatNumber(row.收藏量)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-indigo-600 text-right">
                    {supportCompletionRate(row.来源平台) ? 
                      (row.完播率 > 0 ? formatCompletionRate(normalizeCompletionRate(row.完播率, row.来源平台)) : '-') 
                      : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                    {formatNumber(row.粉丝增量)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    {(() => {
                      const sc = scoredMap.get(row) ?? 0;
                      const color = sc >= 70 ? 'text-green-600' : sc >= 40 ? 'text-amber-600' : 'text-gray-400';
                      return <span className={`text-sm font-bold ${color}`}>{sc}</span>;
                    })()}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between">
            <div className="text-sm text-gray-700 font-medium">
              显示第 <span className="font-bold text-gray-900">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)}</span> 条，
              共 <span className="font-bold text-gray-900">{filteredAndSortedData.length}</span> 条数据
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreview;