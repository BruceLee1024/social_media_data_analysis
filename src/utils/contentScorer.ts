import { UnifiedData } from '../types';
import { normalizeCompletionRate, supportCompletionRate } from './completionRateUtils';

export interface ScoredContent {
  data: UnifiedData;
  score: number;           // 0-100综合评分
  scoreBreakdown: {
    views: number;         // 播放量得分 (0-40)
    engagement: number;    // 互动率得分 (0-30)
    completion: number;    // 完播率得分 (0-20)
    fanEfficiency: number; // 粉效比得分 (0-10)
  };
  engagementRate: number;  // 互动率 %
  fanEfficiency: number;   // 粉效比 = 粉丝增量 / 播放量 * 1000
}

/**
 * 对 UnifiedData 数组计算综合评分
 * - 播放量（40分）：当前数据集内的百分位数归一化
 * - 互动率（30分）：(点赞+评论+分享+收藏) / 播放量，百分位数归一化
 * - 完播率（20分）：仅抖音/视频号，百分位数归一化；不支持平台按有效内容平均分填充
 * - 粉效比（10分）：粉丝增量 / 播放量 * 1000，百分位数归一化
 */
export function scoreContents(data: UnifiedData[]): ScoredContent[] {
  if (data.length === 0) return [];

  // ---- 计算各原始指标 ----
  const raw = data.map(d => {
    const views = d.播放量 || 0;
    const interactions = (d.点赞量 || 0) + (d.评论量 || 0) + (d.分享量 || 0) + (d.收藏量 || 0);
    const engRate = views > 0 ? (interactions / views) * 100 : 0;
    const fans = d.粉丝增量 || 0;
    const fanEff = views > 0 ? (fans / views) * 1000 : 0;
    const rawCompletion = d.完播率 || 0;
    const completionRate = supportCompletionRate(d.来源平台) && rawCompletion > 0
      ? normalizeCompletionRate(rawCompletion, d.来源平台)
      : -1; // -1 表示该条数据不参与完播率评分
    return { views, engRate, completionRate, fanEff };
  });

  // ---- 百分位数归一化辅助 ----
  function percentileScore(arr: number[], val: number, hasMin = false): number {
    const validArr = hasMin ? arr.filter(v => v >= 0) : arr;
    if (validArr.length === 0) return 0;
    const sorted = [...validArr].sort((a, b) => a - b);
    // 找 val 在 sorted 里的位置
    let rank = 0;
    for (const v of sorted) { if (v <= val) rank++; }
    return (rank / sorted.length) * 100;
  }

  const viewsArr = raw.map(r => r.views);
  const engRateArr = raw.map(r => r.engRate);
  const fanEffArr = raw.map(r => r.fanEff);
  const completionArr = raw.filter(r => r.completionRate >= 0).map(r => r.completionRate);
  const avgCompletionScore = completionArr.length > 0 ? 50 : 0; // 不支持平台的默认分

  return data.map((d, i) => {
    const r = raw[i];

    const viewsScore  = percentileScore(viewsArr, r.views) * 0.40;
    const engScore    = percentileScore(engRateArr, r.engRate) * 0.30;
    const compScore   = r.completionRate >= 0
      ? percentileScore(completionArr, r.completionRate) * 0.20
      : avgCompletionScore * 0.20;
    const fanScore    = percentileScore(fanEffArr, r.fanEff) * 0.10;

    const total = Math.round(viewsScore + engScore + compScore + fanScore);

    return {
      data: d,
      score: Math.min(100, Math.max(0, total)),
      scoreBreakdown: {
        views: Math.round(viewsScore),
        engagement: Math.round(engScore),
        completion: Math.round(compScore),
        fanEfficiency: Math.round(fanScore),
      },
      engagementRate: Number(r.engRate.toFixed(2)),
      fanEfficiency: Number(r.fanEff.toFixed(2)),
    };
  });
}

/** 返回按评分降序排列的 Top N 条内容 */
export function getTopNByScore(data: UnifiedData[], n: number): ScoredContent[] {
  return scoreContents(data).sort((a, b) => b.score - a.score).slice(0, n);
}

/** 仅返回每条内容的 score 映射（index -> score），用于 DataPreview 快速查找 */
export function buildScoreMap(scored: ScoredContent[]): Map<UnifiedData, number> {
  const map = new Map<UnifiedData, number>();
  scored.forEach(s => map.set(s.data, s.score));
  return map;
}
