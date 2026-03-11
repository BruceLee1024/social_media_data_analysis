import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { UnifiedData, AggregatedMetrics } from '../../types';
import { ComparisonProcessor, PeriodType } from '../../utils/comparisonProcessor';

interface HistoricalComparisonProps {
  currentData: UnifiedData[];
  historicalData: UnifiedData[];
}

type MetricKey = 'totalViews' | 'totalLikes' | 'totalComments' | 'totalShares' | 'totalBookmarks' | 'totalFollowers' | 'count';

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: 'totalViews', label: '播放量' },
  { key: 'totalLikes', label: '点赞量' },
  { key: 'totalComments', label: '评论量' },
  { key: 'totalShares', label: '分享量' },
  { key: 'totalBookmarks', label: '收藏量' },
  { key: 'totalFollowers', label: '粉丝增量' },
  { key: 'count', label: '发布数量' },
];

const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = [
  { key: 'month', label: '按月' },
  { key: 'quarter', label: '按季度' },
  { key: 'week', label: '按周' },
];

function formatNum(n: number): string {
  if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

function ChangeBadge({ rate }: { rate: number }) {
  if (rate > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
        <ArrowUpRight className="w-3 h-3" />
        +{rate.toFixed(1)}%
      </span>
    );
  }
  if (rate < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">
        <ArrowDownRight className="w-3 h-3" />
        {rate.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
}

const HistoricalComparison: React.FC<HistoricalComparisonProps> = ({
  currentData,
  historicalData,
}) => {
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(''); // '' = 全部
  const [platform, setPlatform] = useState<string>('');
  const [metric, setMetric] = useState<MetricKey>('totalViews');

  const platforms = useMemo(() => {
    const all = new Set([
      ...currentData.map(d => d.来源平台),
      ...historicalData.map(d => d.来源平台),
    ]);
    return [...all];
  }, [currentData, historicalData]);

  // 逐期对比
  const periodData = useMemo(
    () => ComparisonProcessor.generateComparison(currentData, historicalData, periodType, platform || undefined),
    [currentData, historicalData, periodType, platform],
  );

  // 切换周期类型时重置具体时段选择
  const handlePeriodTypeChange = (pt: PeriodType) => {
    setPeriodType(pt);
    setSelectedPeriod('');
  };

  // KPI 卡片数据源：根据是否选了具体时段
  const kpiSource = useMemo(() => {
    if (selectedPeriod) {
      const found = periodData.find(p => p.period === selectedPeriod);
      if (found) {
        return {
          current: found.current,
          historical: found.historical,
          changeRates: found.changeRates,
        };
      }
    }
    // 全部：汇总
    const summary = ComparisonProcessor.generateSummaryComparison(
      platform ? currentData.filter(d => d.来源平台 === platform) : currentData,
      platform ? historicalData.filter(d => d.来源平台 === platform) : historicalData,
    );
    return {
      current: summary.currentTotal,
      historical: summary.historicalTotal,
      changeRates: summary.overallChangeRates,
    };
  }, [selectedPeriod, periodData, currentData, historicalData, platform]);

  // 全量汇总（用于平台对比表）
  const fullSummary = useMemo(
    () => ComparisonProcessor.generateSummaryComparison(
      platform ? currentData.filter(d => d.来源平台 === platform) : currentData,
      platform ? historicalData.filter(d => d.来源平台 === platform) : historicalData,
    ),
    [currentData, historicalData, platform],
  );

  // 图表数据
  const chartData = useMemo(() => {
    return periodData.map(p => ({
      name: p.periodLabel,
      period: p.period,
      当前: (p.current as any)[metric] as number,
      历史: (p.historical as any)[metric] as number,
      变化率: p.changeRates[metric] || 0,
    }));
  }, [periodData, metric]);

  const metricLabel = METRIC_OPTIONS.find(m => m.key === metric)?.label || '';

  // 推算历史数据年份
  const histYears = useMemo(() => {
    const years = new Set(historicalData.map(d => {
      const y = new Date(d.发布时间).getFullYear();
      return isNaN(y) ? null : y;
    }).filter(Boolean));
    return [...years].sort();
  }, [historicalData]);
  const curYears = useMemo(() => {
    const years = new Set(currentData.map(d => {
      const y = new Date(d.发布时间).getFullYear();
      return isNaN(y) ? null : y;
    }).filter(Boolean));
    return [...years].sort();
  }, [currentData]);
  const histLabel = histYears.length > 0 ? histYears.join('/') + '年' : '历史';
  const curLabel = curYears.length > 0 ? curYears.join('/') + '年' : '当前';

  // KPI 摘要卡片定义
  const kpiCards: { label: string; key: keyof AggregatedMetrics }[] = [
    { label: '播放量', key: 'totalViews' },
    { label: '点赞量', key: 'totalLikes' },
    { label: '评论量', key: 'totalComments' },
    { label: '分享量', key: 'totalShares' },
    { label: '粉丝增量', key: 'totalFollowers' },
    { label: '发布数量', key: 'count' },
  ];

  const kpiTitle = selectedPeriod
    ? periodData.find(p => p.period === selectedPeriod)?.periodLabel || ''
    : '全部';

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        {/* 周期类型 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => handlePeriodTypeChange(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                periodType === opt.key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 具体时段选择 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 overflow-x-auto max-w-md">
          <button
            onClick={() => setSelectedPeriod('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              !selectedPeriod ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            全部
          </button>
          {periodData.map(p => (
            <button
              key={p.period}
              onClick={() => setSelectedPeriod(p.period)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedPeriod === p.period
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.periodLabel}
            </button>
          ))}
        </div>

        {/* 平台 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setPlatform('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !platform ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            全部
          </button>
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                platform === p ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* 指标 */}
        <select
          value={metric}
          onChange={e => setMetric(e.target.value as MetricKey)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-1 focus:ring-blue-400 focus:outline-none"
        >
          {METRIC_OPTIONS.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* KPI 摘要卡片 */}
      <div>
        <div className="text-xs text-gray-400 mb-2 px-1">
          {kpiTitle} — {curLabel} vs {histLabel}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpiCards.map(card => {
            const cur = kpiSource.current[card.key] as number;
            const hist = kpiSource.historical[card.key] as number;
            const rate = kpiSource.changeRates[card.key] || 0;
            return (
              <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500 mb-1">{card.label}</div>
                <div className="text-lg font-bold text-gray-900">{formatNum(cur)}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{histLabel}: {formatNum(hist)}</span>
                  <ChangeBadge rate={rate} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 分组柱状图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          {metricLabel} — {curLabel} vs {histLabel}（{PERIOD_OPTIONS.find(p => p.key === periodType)?.label}）
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatNum(v)} />
            <Tooltip
              formatter={(value: number, name: string) => [formatNum(value), name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="当前" fill="#3b82f6" radius={[3, 3, 0, 0]} name={curLabel} />
            <Bar dataKey="历史" fill="#cbd5e1" radius={[3, 3, 0, 0]} name={histLabel} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 折线叠加图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          {metricLabel}趋势对比
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatNum(v)} />
            <Tooltip
              formatter={(value: number, name: string) => [formatNum(value), name]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="当前" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name={curLabel} />
            <Line type="monotone" dataKey="历史" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name={histLabel} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 变化率折线图 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          {metricLabel}同比变化率（%）
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, '变化率']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            <Bar
              dataKey="变化率"
              name="变化率"
              radius={[3, 3, 0, 0]}
              fill="#3b82f6"
              // 使用 cell 实现正负颜色区分
            >
              {chartData.map((entry, idx) => (
                <rect key={idx} fill={entry.变化率 >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 平台分别对比表格 */}
      {Object.keys(fullSummary.byPlatform).length > 0 && !platform && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">各平台对比汇总</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-3 text-left text-gray-500 font-medium">平台</th>
                  {METRIC_OPTIONS.map(m => (
                    <th key={m.key} className="py-2 px-3 text-right text-gray-500 font-medium" colSpan={1}>
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(fullSummary.byPlatform).map(([plat, data]) => (
                  <React.Fragment key={plat}>
                    {/* 当前行 */}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 px-3 font-semibold text-gray-800" rowSpan={3}>{plat}</td>
                      {METRIC_OPTIONS.map(m => (
                        <td key={m.key} className="py-1 px-3 text-right text-gray-900 font-medium">
                          {formatNum((data.current as any)[m.key])}
                        </td>
                      ))}
                    </tr>
                    {/* 历史行 */}
                    <tr className="border-b border-gray-100">
                      {METRIC_OPTIONS.map(m => (
                        <td key={m.key} className="py-1 px-3 text-right text-gray-400">
                          {formatNum((data.historical as any)[m.key])}
                        </td>
                      ))}
                    </tr>
                    {/* 变化率行 */}
                    <tr className="border-b border-gray-200">
                      {METRIC_OPTIONS.map(m => (
                        <td key={m.key} className="py-1 px-3 text-right">
                          <ChangeBadge rate={data.changeRates[m.key] || 0} />
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalComparison;
