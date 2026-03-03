import type { AnalyticsData, ContentGroup, UnifiedData } from '../types';
import { normalizeCompletionRate, formatCompletionRate, supportCompletionRate } from './completionRateUtils';

const STORAGE_KEY = 'deepseek_api_key';
const API_URL = 'https://api.deepseek.com/chat/completions';

export function getDeepSeekApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setDeepSeekApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasDeepSeekApiKey(): boolean {
  return !!getDeepSeekApiKey();
}

/**
 * 流式调用 DeepSeek chat completions
 * @param prompt 用户 prompt
 * @param onChunk 每收到一段文本时回调
 * @param onDone 完成时回调
 * @param onError 出错时回调
 * @returns AbortController 用于取消请求
 */
export function streamChat(
  prompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): AbortController {
  const controller = new AbortController();
  const apiKey = getDeepSeekApiKey();

  if (!apiKey) {
    onError('请先设置 DeepSeek API Key');
    onDone();
    return controller;
  }

  const body = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content:
          '你是一位专业的自媒体数据分析师。你善于从数据中发现规律，用简洁有力的中文给出可执行的建议。输出使用 Markdown 格式。',
      },
      { role: 'user', content: prompt },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
  };

  (async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        let msg = `API 请求失败 (${response.status})`;
        try {
          const errJson = JSON.parse(errText);
          msg = errJson.error?.message || msg;
        } catch {
          // ignore parse error
        }
        onError(msg);
        onDone();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('无法读取响应流');
        onDone();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }

      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        onDone();
        return;
      }
      onError(err.message || '请求失败');
      onDone();
    }
  })();

  return controller;
}

/**
 * 构建单条内容分析的 prompt
 */
export function buildContentAnalysisPrompt(group: ContentGroup): string {
  const platforms = Object.entries(group.platforms);
  let prompt = `请分析以下自媒体内容在各平台的表现，并给出优化建议。\n\n`;
  prompt += `## 内容标题\n${group.title}\n\n`;
  prompt += `## 发布日期\n${group.publishDate?.slice(0, 10) || '未知'}\n\n`;
  prompt += `## 覆盖平台\n${group.platformCount} 个平台\n\n`;

  for (const [platform, item] of platforms) {
    prompt += `### ${platform}\n`;
    prompt += `- 播放量: ${item.播放量 || 0}\n`;
    prompt += `- 点赞量: ${item.点赞量 || 0}\n`;
    prompt += `- 评论量: ${item.评论量 || 0}\n`;
    prompt += `- 收藏量: ${item.收藏量 || 0}\n`;
    prompt += `- 分享量: ${item.分享量 || 0}\n`;
    prompt += `- 粉丝增量: ${item.粉丝增量 || 0}\n`;
    prompt += `- 曝光量: ${item.曝光量 || 0}\n`;
    if (supportCompletionRate(platform)) {
      const rate = normalizeCompletionRate(item.完播率, platform);
      prompt += `- 完播率: ${formatCompletionRate(rate)}\n`;
    }
    if (item.平均播放时长 > 0) {
      prompt += `- 平均播放时长: ${item.平均播放时长.toFixed(2)} 秒\n`;
    }
    // 扩展字段
    const extKeys = Object.keys(item.扩展字段 || {});
    if (extKeys.length > 0) {
      prompt += `- 扩展字段:\n`;
      for (const key of extKeys) {
        const val = item.扩展字段[key];
        if (val !== null && val !== undefined && val !== '') {
          prompt += `  - ${key}: ${val}\n`;
        }
      }
    }
    // 互动率
    const views = item.播放量 || 0;
    if (views > 0) {
      const interactions = (item.点赞量 || 0) + (item.评论量 || 0) + (item.分享量 || 0) + (item.收藏量 || 0);
      const engRate = ((interactions / views) * 100).toFixed(2);
      prompt += `- 互动率: ${engRate}%\n`;
    }
    prompt += '\n';
  }

  prompt += `## 请从以下维度进行分析：
1. **表现总评**：这条内容整体表现如何？用一句话概括
2. **各平台对比**：在哪个平台表现最好？各平台的亮点和短板分别是什么？
3. **数据洞察**：从互动率、完播率、粉丝转化等角度分析数据背后的含义
4. **内容优化建议**：标题、封面、内容结构方面有什么可以改进的？
5. **发布策略建议**：时间、频率、平台侧重方面有什么建议？

请用简洁有力的语言回答，给出可执行的建议。`;

  return prompt;
}

/**
 * 构建 AI 周报 prompt（全局）
 */
export function buildWeeklyReportPrompt(
  analytics: AnalyticsData,
  rawData?: UnifiedData[],
  summary?: any,
): string {
  const { performanceMetrics, platformComparison, topContent, timeSeriesData } = analytics;
  const dateRange = summary?.时间范围
    ? `${summary.时间范围.最早 || '-'} ~ ${summary.时间范围.最晚 || '-'}`
    : '-';

  // 趋势：后半段 vs 前半段
  let trendText = '样本不足，无法判断趋势';
  if (timeSeriesData.length >= 6) {
    const half = Math.floor(timeSeriesData.length / 2);
    const keys = ['抖音播放量', '视频号播放量', '小红书播放量'];
    const sumViews = (arr: typeof timeSeriesData) =>
      arr.reduce((sum, d) => sum + keys.reduce((s, k) => s + ((d as any)[k] || 0), 0), 0);
    const earlyAvg = sumViews(timeSeriesData.slice(0, half)) / Math.max(1, half);
    const laterAvg = sumViews(timeSeriesData.slice(half)) / Math.max(1, timeSeriesData.length - half);
    const trend = earlyAvg > 0 ? ((laterAvg - earlyAvg) / earlyAvg) * 100 : 0;
    trendText = `后半周期较前半周期 ${trend >= 0 ? '增长' : '下降'} ${Math.abs(trend).toFixed(1)}%`;
  }

  // 发布日建议
  let bestDayText = '暂无';
  if (rawData && rawData.length > 0) {
    const dayStats: Record<number, { views: number; count: number }> = {};
    for (const item of rawData) {
      const day = new Date(item.发布时间).getDay();
      if (!dayStats[day]) dayStats[day] = { views: 0, count: 0 };
      dayStats[day].views += item.播放量 || 0;
      dayStats[day].count += 1;
    }
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const ranked = Object.entries(dayStats)
      .map(([d, s]) => ({ day: dayNames[Number(d)], avg: s.count > 0 ? s.views / s.count : 0 }))
      .sort((a, b) => b.avg - a.avg);
    if (ranked.length > 0) {
      bestDayText = `${ranked[0].day}（平均播放 ${Math.round(ranked[0].avg).toLocaleString()}）`;
    }
  }

  let prompt = `请基于以下数据生成一份“中文周报”，输出使用 Markdown。\n\n`;
  prompt += `## 基础信息\n`;
  prompt += `- 时间范围：${dateRange}\n`;
  prompt += `- 总内容数：${performanceMetrics.totalContent}\n`;
  prompt += `- 总播放量：${performanceMetrics.totalViews.toLocaleString()}\n`;
  prompt += `- 总点赞量：${performanceMetrics.totalLikes.toLocaleString()}\n`;
  prompt += `- 总评论量：${performanceMetrics.totalComments.toLocaleString()}\n`;
  prompt += `- 总分享量：${performanceMetrics.totalShares.toLocaleString()}\n`;
  prompt += `- 平均互动率：${(performanceMetrics.avgEngagementRate * 100).toFixed(2)}%\n`;
  prompt += `- 最佳平台：${performanceMetrics.bestPerformingPlatform}\n`;
  prompt += `- 播放趋势：${trendText}\n`;
  prompt += `- 最佳发布日：${bestDayText}\n\n`;

  prompt += `## 各平台表现\n`;
  platformComparison.forEach((p) => {
    prompt += `- ${p.platform}：内容 ${p.totalContent} 条，播放 ${p.totalViews.toLocaleString()}，点赞 ${p.totalLikes.toLocaleString()}，互动率 ${(p.avgEngagementRate * 100).toFixed(2)}%\n`;
  });
  prompt += `\n`;

  if (topContent?.length) {
    prompt += `## Top 内容（按表现）\n`;
    topContent.slice(0, 5).forEach((item, idx) => {
      prompt += `${idx + 1}. [${item.platform}] ${item.title}（播放 ${item.views.toLocaleString()}，互动率 ${(item.engagementRate * 100).toFixed(2)}%）\n`;
    });
    prompt += `\n`;
  }

  prompt += `请按以下结构输出：\n`;
  prompt += `1. 本周总体结论（3-5条）\n`;
  prompt += `2. 各平台诊断（每个平台 2 条：亮点 + 问题）\n`;
  prompt += `3. 下周执行建议（不少于 5 条，必须可执行）\n`;
  prompt += `4. 风险提醒（2-3条）\n`;
  prompt += `要求：不要空话，避免“建议多发内容”这种泛化建议。`;

  return prompt;
}

/**
 * 构建 AI 概览 prompt（overview）
 */
export function buildOverviewSummaryPrompt(
  analytics: AnalyticsData,
  summary?: any,
): string {
  const { performanceMetrics, platformComparison } = analytics;
  const range = summary?.时间范围
    ? `${summary.时间范围.最早 || '-'} ~ ${summary.时间范围.最晚 || '-'}`
    : '-';

  let prompt = `请基于以下数据生成“数据概览 AI 总结”，输出中文 Markdown。\n\n`;
  prompt += `## 核心数据\n`;
  prompt += `- 时间范围：${range}\n`;
  prompt += `- 内容总数：${performanceMetrics.totalContent}\n`;
  prompt += `- 总播放量：${performanceMetrics.totalViews.toLocaleString()}\n`;
  prompt += `- 总点赞量：${performanceMetrics.totalLikes.toLocaleString()}\n`;
  prompt += `- 总评论量：${performanceMetrics.totalComments.toLocaleString()}\n`;
  prompt += `- 总分享量：${performanceMetrics.totalShares.toLocaleString()}\n`;
  prompt += `- 平均互动率：${(performanceMetrics.avgEngagementRate * 100).toFixed(2)}%\n`;
  prompt += `- 最佳平台：${performanceMetrics.bestPerformingPlatform}\n\n`;

  prompt += `## 平台明细\n`;
  platformComparison.forEach((p) => {
    prompt += `- ${p.platform}：内容 ${p.totalContent} 条，播放 ${p.totalViews.toLocaleString()}，互动率 ${(p.avgEngagementRate * 100).toFixed(2)}%\n`;
  });
  prompt += `\n`;

  prompt += `请输出以下 3 个部分：\n`;
  prompt += `1. 一句话总评\n`;
  prompt += `2. 三条关键洞察（必须引用具体数据）\n`;
  prompt += `3. 三条优先级最高的执行建议（按 P0/P1/P2 标注）`;

  return prompt;
}
