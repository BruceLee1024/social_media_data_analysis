import { ContentGroup } from '../types';
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
