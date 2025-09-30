import { UnifiedData, AnalyticsData, PlatformMetrics, TimeSeriesPoint, ContentTypeMetrics, PerformanceMetrics, TopContentItem } from '../types';
import { format, parseISO, startOfDay, eachDayOfInterval, min, max } from 'date-fns';

export class AnalyticsProcessor {
  static generateAnalytics(data: UnifiedData[]): AnalyticsData {
    return {
      platformComparison: this.generatePlatformComparison(data),
      timeSeriesData: this.generateTimeSeriesData(data),
      contentTypeAnalysis: this.generateContentTypeAnalysis(data),
      performanceMetrics: this.generatePerformanceMetrics(data),
      topContent: this.generateTopContent(data),
    };
  }

  private static generatePlatformComparison(data: UnifiedData[]): PlatformMetrics[] {
    const platformGroups = data.reduce((acc, item) => {
      const platform = item.来源平台;
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(item);
      return acc;
    }, {} as Record<string, UnifiedData[]>);

    return Object.entries(platformGroups).map(([platform, items]) => {
      const stats = this.calculateBasicStats(items);
      
      // 计算平均完播率，需要根据平台进行不同的处理
      const completionRates = items.map(item => {
        const rate = item.完播率;
        const rateStr = String(rate);
        
        if (platform === '抖音') {
          // 抖音：小数格式转换为百分比
          const parsed = typeof rate === 'number' ? rate : parseFloat(rateStr);
          return isNaN(parsed) ? 0 : parsed * 100;
        } else if (platform === '视频号' && rateStr.includes('%')) {
          // 视频号：百分比字符串格式
          const parsed = parseFloat(rateStr.replace('%', ''));
          return isNaN(parsed) ? 0 : parsed;
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
      });
      
      const avgCompletionRate = completionRates.length > 0 ? 
        completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length : 0;

      return {
        platform,
        totalContent: items.length,
        ...stats,
        avgEngagementRate: stats.avgEngagementRate,
        avgCompletionRate,
      };
    });
  }

  private static calculateBasicStats(items: UnifiedData[]) {
    const totalViews = items.reduce((sum, item) => sum + item.播放量, 0);
    const totalLikes = items.reduce((sum, item) => sum + item.点赞量, 0);
    const totalComments = items.reduce((sum, item) => sum + item.评论量, 0);
    const totalShares = items.reduce((sum, item) => sum + item.分享量, 0);
    const totalBookmarks = items.reduce((sum, item) => sum + (item.收藏量 || 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares + totalBookmarks;
    const avgEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalBookmarks,
      totalEngagement,
      avgEngagementRate,
    };
  }

  private static generateTimeSeriesData(data: UnifiedData[]): TimeSeriesPoint[] {
    // 按日期分组数据 - 添加日期验证
    const dateGroups = data.reduce((acc, item) => {
      try {
        // 验证日期格式
        if (!item.发布时间 || item.发布时间.trim() === '') {
          console.warn('跳过空发布时间的数据:', item);
          return acc;
        }
        
        const parsedDate = parseISO(item.发布时间);
        if (isNaN(parsedDate.getTime())) {
          console.warn('跳过无效发布时间的数据:', item.发布时间, item);
          return acc;
        }
        
        const date = format(startOfDay(parsedDate), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { 抖音: [], 视频号: [], 小红书: [] };
        }
        acc[date][item.来源平台].push(item);
      } catch (error) {
        console.warn('处理日期时出错:', error, item);
      }
      return acc;
    }, {} as Record<string, Record<string, UnifiedData[]>>);

    // 获取日期范围
    const dates = Object.keys(dateGroups).sort();
    if (dates.length === 0) return [];

    try {
      const startDate = parseISO(dates[0]);
      const endDate = parseISO(dates[dates.length - 1]);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('无效的开始或结束日期');
        return [];
      }
      
      const allDates = eachDayOfInterval({ start: startDate, end: endDate });

      return allDates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = dateGroups[dateStr] || { 抖音: [], 视频号: [], 小红书: [] };

        const result: TimeSeriesPoint = { date: dateStr };

        // 计算每个平台的播放量、点赞量、评论量、分享量、收藏量
        Object.entries(dayData).forEach(([platform, items]) => {
          if (items.length > 0) {
            const stats = this.calculateBasicStats(items);
            
            // 使用类型断言来设置动态平台字段
            if (platform === '抖音') {
              result.抖音播放量 = stats.totalViews;
              result.抖音点赞量 = stats.totalLikes;
              result.抖音评论量 = stats.totalComments;
              result.抖音分享量 = stats.totalShares;
              result.抖音收藏量 = stats.totalBookmarks;
            } else if (platform === '视频号') {
              result.视频号播放量 = stats.totalViews;
              result.视频号点赞量 = stats.totalLikes;
              result.视频号评论量 = stats.totalComments;
              result.视频号分享量 = stats.totalShares;
              result.视频号收藏量 = stats.totalBookmarks;
            } else if (platform === '小红书') {
              result.小红书播放量 = stats.totalViews;
              result.小红书点赞量 = stats.totalLikes;
              result.小红书评论量 = stats.totalComments;
              result.小红书分享量 = stats.totalShares;
              result.小红书收藏量 = stats.totalBookmarks;
            }
          }
        });

        return result;
      });
    } catch (error) {
      console.error('生成时间序列数据时出错:', error);
      return [];
    }
  }

  private static generateContentTypeAnalysis(data: UnifiedData[]): ContentTypeMetrics[] {
    // 只分析抖音平台的数据，因为其他平台的内容分发都是相同的
    const douyinData = data.filter(item => item.来源平台 === '抖音');
    
    const typeGroups = douyinData.reduce((acc, item) => {
      const type = item.体裁类型 || '未分类';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {} as Record<string, UnifiedData[]>);

    return Object.entries(typeGroups).map(([type, items]) => {
      const stats = this.calculateBasicStats(items);
      const engagementRate = stats.totalViews > 0 ? (stats.totalEngagement / stats.totalViews) * 100 : 0;
      const avgEngagement = Math.round(stats.totalEngagement / items.length);

      return {
        type,
        count: items.length,
        avgViews: Math.round(stats.totalViews / items.length),
        avgLikes: Math.round(stats.totalLikes / items.length),
        avgComments: Math.round(stats.totalComments / items.length),
        engagementRate,
        avgEngagement,
      };
    }).sort((a, b) => b.count - a.count);
  }

  private static generatePerformanceMetrics(data: UnifiedData[]): PerformanceMetrics {
    const stats = this.calculateBasicStats(data);
    const totalContent = data.length;

    // 计算平均完播率 - 简化逻辑
    const validCompletionRates = data.filter(item => item.完播率 > 0).map(item => {
      const rate = item.完播率;
      const rateStr = String(rate);
      
      if (item.来源平台 === '抖音') {
        // 抖音：小数格式转换为百分比
        const parsed = typeof rate === 'number' ? rate : parseFloat(rateStr);
        return isNaN(parsed) ? 0 : parsed * 100;
      } else if (item.来源平台 === '视频号' && rateStr.includes('%')) {
        // 视频号：百分比字符串格式
        const parsed = parseFloat(rateStr.replace('%', ''));
        return isNaN(parsed) ? 0 : parsed;
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
    });
    const avgCompletionRate = validCompletionRates.length > 0 ? 
      validCompletionRates.reduce((sum, rate) => sum + rate, 0) / validCompletionRates.length : 0;

    // 计算爆款数量（播放量≥5万）
    const viralContentCount = data.filter(item => item.播放量 >= 50000).length;

    // 找出表现最好的平台 - 基于总互动量
    const platformPerformance = this.generatePlatformComparison(data);
    const bestPerformingPlatform = platformPerformance.length > 0 ? 
      platformPerformance.reduce((best, current) => {
        // 计算每个平台的总互动量（点赞+评论+分享+收藏）
        const currentTotalEngagement = current.totalLikes + current.totalComments + current.totalShares + (current.totalBookmarks || 0);
        const bestTotalEngagement = best.totalLikes + best.totalComments + best.totalShares + (best.totalBookmarks || 0);
        return currentTotalEngagement > bestTotalEngagement ? current : best;
      }).platform : '无数据';

    // 计算内容增长率（简化版，基于时间分布）
    let contentGrowthRate = 0;
    try {
      // 过滤掉无效日期的数据
      const validDateData = data.filter(item => {
        if (!item.发布时间 || item.发布时间.trim() === '') return false;
        const date = new Date(item.发布时间);
        return !isNaN(date.getTime());
      });

      if (validDateData.length > 1) {
        const sortedData = validDateData.sort((a, b) => new Date(a.发布时间).getTime() - new Date(b.发布时间).getTime());
        const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
        const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
        
        const firstHalfAvgViews = firstHalf.length > 0 ? 
          firstHalf.reduce((sum, item) => sum + item.播放量, 0) / firstHalf.length : 0;
        const secondHalfAvgViews = secondHalf.length > 0 ? 
          secondHalf.reduce((sum, item) => sum + item.播放量, 0) / secondHalf.length : 0;
        
        contentGrowthRate = firstHalfAvgViews > 0 ? 
          ((secondHalfAvgViews - firstHalfAvgViews) / firstHalfAvgViews) * 100 : 0;
      }
    } catch (error) {
      console.warn('计算内容增长率时出错:', error);
      contentGrowthRate = 0;
    }

    return {
      ...stats,
      avgCompletionRate,
      bestPerformingPlatform,
      contentGrowthRate,
      totalContent,
      viralContentCount,
    };
  }

  private static generateTopContent(data: UnifiedData[]): TopContentItem[] {
    return data
      .map(item => {
        const totalEngagement = item.点赞量 + item.评论量 + item.分享量;
        const engagementRate = item.播放量 > 0 ? (totalEngagement / item.播放量) * 100 : 0;
        
        return {
          title: item.标题描述 || '无标题',
          platform: item.来源平台 || '未知平台',
          publishTime: item.发布时间 || '未知时间',
          views: item.播放量 || 0,
          likes: item.点赞量 || 0,
          comments: item.评论量 || 0,
          engagementRate,
        };
      })
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 10);
  }

  static formatNumber(num: number): string {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '亿';
    }
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  }

  static formatPercentage(num: number): string {
    return num.toFixed(2) + '%';
  }
}