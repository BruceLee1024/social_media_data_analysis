import { UnifiedData, ContentGroup } from '../types';

/**
 * 跨平台内容匹配工具
 * 将同一内容在不同平台的数据关联到一组
 */

/**
 * 标题规范化：去空格、统一全角半角、移除 emoji/特殊符号/话题标签
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';

  let normalized = title.trim();

  // 统一全角字符为半角
  normalized = normalized.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );

  // 移除话题标签 #xxx# 和 #xxx（末尾）
  normalized = normalized.replace(/#[^#\s]+#?/g, '');

  // 移除 @提及
  normalized = normalized.replace(/@\S+/g, '');

  // 移除 emoji（Unicode emoji 范围）
  normalized = normalized.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu,
    ''
  );

  // 移除常见标点和特殊符号，只保留中文、字母、数字
  normalized = normalized.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

  // 转小写
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * 计算两个字符串的 Dice 相似系数（基于 bigram）
 * 返回 0~1，1 表示完全相同
 */
export function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.substring(i, i + 2);
    bigramsA.set(bigram, (bigramsA.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.substring(i, i + 2);
    const count = bigramsA.get(bigram) || 0;
    if (count > 0) {
      bigramsA.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2 * intersectionSize) / (a.length - 1 + (b.length - 1));
}

/**
 * 计算两个日期之间的天数差（绝对值）
 */
function dateDiffDays(dateA: string, dateB: string): number {
  try {
    const a = new Date(dateA.slice(0, 10));
    const b = new Date(dateB.slice(0, 10));
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return Infinity;
    return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
  } catch {
    return Infinity;
  }
}

/**
 * 核心匹配函数：将 UnifiedData[] 按内容分组
 */
export function matchContent(data: UnifiedData[]): ContentGroup[] {
  if (!data || data.length === 0) return [];

  // 预处理：给每条数据计算规范化标题
  const items = data.map((item, index) => ({
    index,
    item,
    normalizedTitle: normalizeTitle(item.标题描述),
  }));

  // 已分配到组的 index 集合
  const assigned = new Set<number>();
  const groups: ContentGroup[] = [];
  let groupId = 0;

  // 第一轮：精确匹配（规范化标题完全一致）
  const exactMap = new Map<string, number[]>();
  for (const { index, normalizedTitle } of items) {
    if (!normalizedTitle) continue;
    if (!exactMap.has(normalizedTitle)) {
      exactMap.set(normalizedTitle, []);
    }
    exactMap.get(normalizedTitle)!.push(index);
  }

  for (const [, indices] of exactMap) {
    if (indices.length < 2) continue;

    // 按平台分组，同平台取播放量最大的
    const byPlatform = new Map<string, number>();
    for (const idx of indices) {
      const platform = items[idx].item.来源平台;
      const existing = byPlatform.get(platform);
      if (existing === undefined || items[idx].item.播放量 > items[existing].item.播放量) {
        byPlatform.set(platform, idx);
      }
    }

    // 只有跨平台才建组（同平台重复不算）
    if (byPlatform.size >= 2) {
      const selectedIndices = Array.from(byPlatform.values());
      const group = buildGroup(groupId++, selectedIndices.map(i => items[i].item));
      groups.push(group);
      selectedIndices.forEach(i => assigned.add(i));
    }
  }

  // 第二轮：模糊匹配（未分配的 + 相似度 ≥ 0.8 + 日期差 ≤ 3 天）
  const unassigned = items.filter(({ index }) => !assigned.has(index));

  // 按平台分桶，方便跨平台匹配
  const byPlatformBuckets = new Map<string, typeof unassigned>();
  for (const entry of unassigned) {
    const platform = entry.item.来源平台;
    if (!byPlatformBuckets.has(platform)) {
      byPlatformBuckets.set(platform, []);
    }
    byPlatformBuckets.get(platform)!.push(entry);
  }

  const platformNames = Array.from(byPlatformBuckets.keys());

  // 对每个未分配的项，尝试在其他平台中找匹配
  const fuzzyAssigned = new Set<number>();

  for (const entry of unassigned) {
    if (fuzzyAssigned.has(entry.index)) continue;
    if (!entry.normalizedTitle || entry.normalizedTitle.length < 2) continue;

    const matchedItems: UnifiedData[] = [entry.item];
    const matchedIndices: number[] = [entry.index];
    fuzzyAssigned.add(entry.index);

    // 在其他平台中寻找匹配
    for (const platformName of platformNames) {
      if (platformName === entry.item.来源平台) continue;
      // 该平台中已有匹配就跳过
      if (matchedItems.some(m => m.来源平台 === platformName)) continue;

      const bucket = byPlatformBuckets.get(platformName) || [];
      let bestMatch: typeof entry | null = null;
      let bestSimilarity = 0;

      for (const candidate of bucket) {
        if (fuzzyAssigned.has(candidate.index)) continue;
        if (!candidate.normalizedTitle || candidate.normalizedTitle.length < 2) continue;

        // 日期差检查
        if (dateDiffDays(entry.item.发布时间, candidate.item.发布时间) > 3) continue;

        const similarity = diceSimilarity(entry.normalizedTitle, candidate.normalizedTitle);
        if (similarity >= 0.8 && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = candidate;
        }
      }

      if (bestMatch) {
        matchedItems.push(bestMatch.item);
        matchedIndices.push(bestMatch.index);
        fuzzyAssigned.add(bestMatch.index);
      }
    }

    // 只有匹配到跨平台的才建组
    if (matchedItems.length >= 2) {
      const group = buildGroup(groupId++, matchedItems);
      groups.push(group);
      matchedIndices.forEach(i => assigned.add(i));
    }
  }

  // 第三轮：未匹配的内容作为单平台组
  for (const { index, item } of items) {
    if (assigned.has(index) || fuzzyAssigned.has(index)) continue;
    const group = buildGroup(groupId++, [item]);
    groups.push(group);
  }

  // 按总播放量降序排序
  groups.sort((a, b) => b.totalViews - a.totalViews);

  return groups;
}

/**
 * 根据匹配到的 items 构建一个 ContentGroup
 */
function buildGroup(id: number, items: UnifiedData[]): ContentGroup {
  const platforms: Record<string, UnifiedData> = {};
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalBookmarks = 0;

  for (const item of items) {
    platforms[item.来源平台] = item;
    totalViews += item.播放量 || 0;
    totalLikes += item.点赞量 || 0;
    totalComments += item.评论量 || 0;
    totalShares += item.分享量 || 0;
    totalBookmarks += item.收藏量 || 0;
  }

  // 取最长标题作为代表标题
  const title = items.reduce((longest, item) =>
    (item.标题描述 || '').length > longest.length ? (item.标题描述 || '') : longest
  , '');

  // 取最早发布日期
  const publishDate = items
    .map(item => item.发布时间)
    .filter(d => d && d.trim() !== '')
    .sort()[0] || '';

  return {
    id: `group_${id}`,
    title: title || '无标题',
    publishDate,
    platforms,
    platformCount: Object.keys(platforms).length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalBookmarks,
  };
}
