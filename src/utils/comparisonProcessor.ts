import { UnifiedData, AggregatedMetrics, PeriodComparisonPoint, ComparisonSummary } from '../types';
import { calculateAverageCompletionRate } from './completionRateUtils';

export type PeriodType = 'week' | 'month' | 'quarter';

const EMPTY_METRICS: AggregatedMetrics = {
  count: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  totalShares: 0,
  totalBookmarks: 0,
  totalFollowers: 0,
  avgCompletionRate: 0,
  avgPlayDuration: 0,
};

/**
 * 从发布时间获取与年份无关的 period key
 */
function getPeriodKey(dateStr: string, periodType: PeriodType): string | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const month = d.getMonth() + 1; // 1-12

  switch (periodType) {
    case 'month':
      return `M${String(month).padStart(2, '0')}`;
    case 'quarter':
      return `Q${Math.ceil(month / 3)}`;
    case 'week': {
      // ISO week number
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
      const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
      return `W${String(weekNum).padStart(2, '0')}`;
    }
    default:
      return null;
  }
}

/**
 * 获取 period 的中文展示标签
 */
function getPeriodLabel(period: string): string {
  if (period.startsWith('M')) {
    const m = parseInt(period.slice(1));
    return `${m}月`;
  }
  if (period.startsWith('Q')) {
    return `第${period.slice(1)}季度`;
  }
  if (period.startsWith('W')) {
    const w = parseInt(period.slice(1));
    return `第${w}周`;
  }
  return period;
}

/**
 * 将一组 UnifiedData 聚合为 AggregatedMetrics
 */
function aggregate(items: UnifiedData[]): AggregatedMetrics {
  if (items.length === 0) return { ...EMPTY_METRICS };

  const count = items.length;
  const totalViews = items.reduce((s, i) => s + (i.播放量 || 0), 0);
  const totalLikes = items.reduce((s, i) => s + (i.点赞量 || 0), 0);
  const totalComments = items.reduce((s, i) => s + (i.评论量 || 0), 0);
  const totalShares = items.reduce((s, i) => s + (i.分享量 || 0), 0);
  const totalBookmarks = items.reduce((s, i) => s + (i.收藏量 || 0), 0);
  const totalFollowers = items.reduce((s, i) => s + (i.粉丝增量 || 0), 0);
  const avgCompletionRate = calculateAverageCompletionRate(items);
  const avgPlayDuration = items.reduce((s, i) => s + (i.平均播放时长 || 0), 0) / count;

  return {
    count,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalBookmarks,
    totalFollowers,
    avgCompletionRate,
    avgPlayDuration,
  };
}

/**
 * 计算两组指标之间的变化率
 */
function calcChangeRates(current: AggregatedMetrics, historical: AggregatedMetrics): Record<string, number> {
  const keys: (keyof AggregatedMetrics)[] = [
    'count', 'totalViews', 'totalLikes', 'totalComments',
    'totalShares', 'totalBookmarks', 'totalFollowers',
    'avgCompletionRate', 'avgPlayDuration',
  ];
  const rates: Record<string, number> = {};
  for (const key of keys) {
    const cur = current[key] as number;
    const hist = historical[key] as number;
    rates[key] = hist !== 0 ? ((cur - hist) / Math.abs(hist)) * 100 : (cur > 0 ? 100 : 0);
  }
  return rates;
}

export class ComparisonProcessor {
  /**
   * 按周期聚合数据，返回 Map<periodKey, AggregatedMetrics>
   */
  static aggregateByPeriod(
    data: UnifiedData[],
    periodType: PeriodType,
    platform?: string,
  ): Map<string, AggregatedMetrics> {
    const filtered = platform ? data.filter(d => d.来源平台 === platform) : data;
    const groups = new Map<string, UnifiedData[]>();

    for (const item of filtered) {
      const key = getPeriodKey(item.发布时间, periodType);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }

    const result = new Map<string, AggregatedMetrics>();
    for (const [key, items] of groups) {
      result.set(key, aggregate(items));
    }
    return result;
  }

  /**
   * 生成逐期对比数据
   */
  static generateComparison(
    currentData: UnifiedData[],
    historicalData: UnifiedData[],
    periodType: PeriodType,
    platform?: string,
  ): PeriodComparisonPoint[] {
    const currentMap = this.aggregateByPeriod(currentData, periodType, platform);
    const historicalMap = this.aggregateByPeriod(historicalData, periodType, platform);

    // 合并所有 period keys
    const allKeys = new Set<string>([...currentMap.keys(), ...historicalMap.keys()]);
    const sortedKeys = [...allKeys].sort();

    return sortedKeys.map(period => {
      const current = currentMap.get(period) || { ...EMPTY_METRICS };
      const historical = historicalMap.get(period) || { ...EMPTY_METRICS };
      return {
        period,
        periodLabel: getPeriodLabel(period),
        current,
        historical,
        changeRates: calcChangeRates(current, historical),
      };
    });
  }

  /**
   * 生成整体对比摘要
   */
  static generateSummaryComparison(
    currentData: UnifiedData[],
    historicalData: UnifiedData[],
  ): ComparisonSummary {
    const currentTotal = aggregate(currentData);
    const historicalTotal = aggregate(historicalData);
    const overallChangeRates = calcChangeRates(currentTotal, historicalTotal);

    // 按平台分别对比
    const platforms = new Set<string>([
      ...currentData.map(d => d.来源平台),
      ...historicalData.map(d => d.来源平台),
    ]);

    const byPlatform: ComparisonSummary['byPlatform'] = {};
    for (const p of platforms) {
      const curPlatform = aggregate(currentData.filter(d => d.来源平台 === p));
      const histPlatform = aggregate(historicalData.filter(d => d.来源平台 === p));
      byPlatform[p] = {
        current: curPlatform,
        historical: histPlatform,
        changeRates: calcChangeRates(curPlatform, histPlatform),
      };
    }

    return { currentTotal, historicalTotal, overallChangeRates, byPlatform };
  }
}
