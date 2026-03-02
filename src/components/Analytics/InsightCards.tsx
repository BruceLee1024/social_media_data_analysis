import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Star, Clock, Zap, AlertTriangle } from 'lucide-react';
import { AnalyticsData, UnifiedData } from '../../types';

interface InsightCardsProps {
  analytics: AnalyticsData;
  rawData?: UnifiedData[];
}

type InsightType = 'success' | 'info' | 'warning' | 'highlight';

interface Insight {
  type: InsightType;
  icon: React.ReactNode;
  title: string;
  description: string;
  metric?: string;
}

const InsightCards: React.FC<InsightCardsProps> = ({ analytics, rawData }) => {
  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];
    const { platformComparison, timeSeriesData } = analytics;

    // 1. 最佳互动率平台
    if (platformComparison.length >= 2) {
      const sorted = [...platformComparison].sort((a, b) => (b.avgEngagementRate || 0) - (a.avgEngagementRate || 0));
      const best = sorted[0];
      const second = sorted[1];
      const denominator = Math.max(second.avgEngagementRate || 0, 0.0001);
      const diff = best.avgEngagementRate > 0
        ? Math.round(((best.avgEngagementRate - (second.avgEngagementRate || 0)) / denominator) * 100)
        : 0;
      result.push({
        type: 'success',
        icon: <Star />,
        title: `${best.platform} 互动率最高`,
        description: `平均互动率比 ${second.platform} 高 ${diff}%，建议优先在此平台投入内容资源`,
        metric: `${(best.avgEngagementRate * 100).toFixed(2)}%`,
      });
    }

    // 2. 整体播放量趋势
    if (timeSeriesData.length >= 4) {
      const half = Math.floor(timeSeriesData.length / 2);
      const platforms = ['抖音', '视频号', '小红书'] as const;
      const sumViews = (arr: typeof timeSeriesData) =>
        arr.reduce((s, d) => s + platforms.reduce((ps, p) => ps + ((d as any)[`${p}播放量`] ?? 0), 0), 0);
      const earlyAvg = sumViews(timeSeriesData.slice(0, half)) / half;
      const recentAvg = sumViews(timeSeriesData.slice(half)) / (timeSeriesData.length - half);
      const trend = earlyAvg > 0 ? ((recentAvg - earlyAvg) / earlyAvg) * 100 : 0;
      result.push({
        type: trend >= 0 ? 'success' : 'warning',
        icon: trend >= 0 ? <TrendingUp /> : <TrendingDown />,
        title: `播放量整体${trend >= 0 ? '上升' : '下降'}趋势`,
        description: `与前期相比近期平均播放量${trend >= 0 ? '增长' : '下降'}了 ${Math.abs(Math.round(trend))}%`,
        metric: `${trend >= 0 ? '+' : ''}${Math.round(trend)}%`,
      });
    }

    // 3. 最佳发布星期
    if (rawData && rawData.length > 0) {
      const dayStats: Record<number, { total: number; count: number }> = {};
      rawData.forEach(item => {
        if (item.发布时间) {
          const d = new Date(item.发布时间).getDay();
          if (!dayStats[d]) dayStats[d] = { total: 0, count: 0 };
          dayStats[d].total += item.播放量 || 0;
          dayStats[d].count++;
        }
      });
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayAvgs = Object.entries(dayStats)
        .filter(([, s]) => s.count >= 1)
        .map(([d, s]) => ({ day: dayNames[+d], avg: s.total / s.count, count: s.count }))
        .sort((a, b) => b.avg - a.avg);
      if (dayAvgs.length > 0) {
        const best = dayAvgs[0];
        const avgStr = best.avg >= 10000
          ? `${(best.avg / 10000).toFixed(1)}万`
          : Math.round(best.avg).toLocaleString();
        result.push({
          type: 'info',
          icon: <Clock />,
          title: `${best.day} 是最佳发布日`,
          description: `历史数据显示 ${best.day} 发布的内容平均播放量最高（共 ${best.count} 条），建议优先安排重要内容在此日发布`,
          metric: avgStr,
        });
      }
    }

    // 4. 各平台内容量差异
    if (platformComparison.length >= 2) {
      const sorted = [...platformComparison].sort((a, b) => b.totalContent - a.totalContent);
      const max = sorted[0];
      const min = sorted[sorted.length - 1];
      if (min.totalContent > 0 && max.totalContent > min.totalContent * 2) {
        result.push({
          type: 'warning',
          icon: <AlertTriangle />,
          title: '各平台内容量差异较大',
          description: `${max.platform}内容数(${max.totalContent})是${min.platform}(${min.totalContent})的${Math.round(max.totalContent / min.totalContent)}倍，建议均衡分配发布频次`,
          metric: `${Math.round(max.totalContent / min.totalContent)}x`,
        });
      }
    }

    // 5. 抖音完播率突出内容
    if (rawData) {
      const douyinWithRate = rawData.filter(d => d.来源平台 === '抖音' && d.完播率 > 0);
      if (douyinWithRate.length >= 3) {
        const avgRate = douyinWithRate.reduce((s, d) => s + d.完播率, 0) / douyinWithRate.length;
        const highCount = douyinWithRate.filter(d => d.完播率 > avgRate * 1.5).length;
        if (highCount > 0) {
          result.push({
            type: 'highlight',
            icon: <Zap />,
            title: `${highCount} 条内容完播率突出`,
            description: '这些抖音视频完播率超平均值50%以上，建议分析其内容特征以提升整体留存率',
            metric: `${highCount} 条`,
          });
        }
      }
    }

    return result.slice(0, 5);
  }, [analytics, rawData]);

  const typeConfig: Record<InsightType, { bg: string; iconBg: string; titleColor: string; metricColor: string }> = {
    success: { bg: 'bg-green-50 border-green-200', iconBg: 'bg-green-500', titleColor: 'text-green-800', metricColor: 'text-green-600' },
    info: { bg: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-500', titleColor: 'text-blue-800', metricColor: 'text-blue-600' },
    warning: { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-500', titleColor: 'text-amber-800', metricColor: 'text-amber-600' },
    highlight: { bg: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-500', titleColor: 'text-purple-800', metricColor: 'text-purple-600' },
  };

  if (insights.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">智能洞察</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">基于数据自动生成</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, i) => {
          const config = typeConfig[insight.type];
          return (
            <div key={i} className={`rounded-xl border p-4 ${config.bg} flex flex-col gap-2`}>
              <div className="flex items-start justify-between">
                <div className={`w-8 h-8 ${config.iconBg} rounded-lg flex items-center justify-center text-white shrink-0`}>
                  {React.cloneElement(insight.icon as React.ReactElement, { className: 'w-4 h-4' })}
                </div>
                {insight.metric && (
                  <span className={`text-lg font-bold ${config.metricColor}`}>{insight.metric}</span>
                )}
              </div>
              <p className={`text-sm font-semibold ${config.titleColor}`}>{insight.title}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightCards;
