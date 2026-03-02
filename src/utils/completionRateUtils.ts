/**
 * 完播率数据处理工具函数
 * 统一处理不同平台的完播率数据格式
 */

/**
 * 标准化完播率数据
 * @param rate 原始完播率数据
 * @param platform 平台名称
 * @returns 标准化后的完播率数值（百分比形式，如 12.5 表示 12.5%）
 */
export function normalizeCompletionRate(rate: any, platform: string): number {
  if (!rate || rate === 0) return 0;
  
  const rateStr = String(rate);
  
  if (platform === '抖音') {
    // 抖音：原始数据是小数形式（如0.15表示15%），需要转换为百分比
    const parsed = typeof rate === 'number' ? rate : parseFloat(rateStr);
    return isNaN(parsed) ? 0 : parsed * 100;
  } else if (platform === '视频号') {
    // 视频号：统一处理，无论是否包含%符号
    if (rateStr.includes('%')) {
      const parsed = parseFloat(rateStr.replace('%', ''));
      return isNaN(parsed) ? 0 : parsed;
    } else {
      const parsed = parseFloat(rateStr);
      return isNaN(parsed) ? 0 : parsed;
    }
  } else {
    // 其他平台：默认处理
    if (rateStr.includes('%')) {
      const parsed = parseFloat(rateStr.replace('%', ''));
      return isNaN(parsed) ? 0 : parsed;
    } else {
      const parsed = parseFloat(rateStr);
      return isNaN(parsed) ? 0 : parsed;
    }
  }
}

/**
 * 格式化完播率显示
 * @param rate 完播率数值
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的完播率字符串（如 "12.50%"）
 */
export function formatCompletionRate(rate: number, decimals: number = 2): string {
  if (!rate || rate === 0) return '0.00%';
  return rate.toFixed(decimals) + '%';
}

/**
 * 计算平均完播率
 * @param data 数据数组
 * @param platform 平台名称（可选，如果提供则只计算该平台的数据）
 * @returns 平均完播率
 */
export function calculateAverageCompletionRate(data: any[], platform?: string): number {
  const filteredData = data.filter(item => {
    // 排除小红书（没有完播率数据）
    if (item.来源平台 === '小红书') return false;
    // 如果指定了平台，只计算该平台的数据
    if (platform && item.来源平台 !== platform) return false;
    // 只计算完播率大于0的数据
    return item.完播率 > 0;
  });

  if (filteredData.length === 0) return 0;

  const rates = filteredData.map(item => 
    normalizeCompletionRate(item.完播率, item.来源平台)
  );

  return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
}

/**
 * 检查平台是否支持完播率
 * @param platform 平台名称
 * @returns 是否支持完播率
 */
export function supportCompletionRate(platform: string): boolean {
  return platform !== '小红书';
}