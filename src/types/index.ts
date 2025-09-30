export interface PlatformData {
  platform: '抖音' | '视频号' | '小红书';
  rawData: any[];
  processedData: UnifiedData[];
  fileName: string;
}

export interface UnifiedData {
  来源平台: '抖音' | '视频号' | '小红书';
  标题描述: string;
  发布时间: string;
  体裁类型: string;
  曝光量: number;
  播放量: number;
  点赞量: number;
  评论量: number;
  收藏量: number;
  分享量: number;
  粉丝增量: number;
  完播率: number;
  平均播放时长: number;
  扩展字段: Record<string, any>;
}

// 添加平台统计数据接口
export interface PlatformStat {
  count: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks: number;
  totalFollowers: number;
  avgCompletionRate: number;
  hasShares: boolean;
  hasBookmarks: boolean;
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
  avgBookmarks?: number;
  avgInteractions?: number;
}

export interface FieldMapping {
  [key: string]: string;
}

export interface ProcessingResult {
  success: boolean;
  data: UnifiedData[];
  errors: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export interface AnalyticsData {
  platformComparison: PlatformMetrics[];
  timeSeriesData: TimeSeriesPoint[];
  contentTypeAnalysis: ContentTypeMetrics[];
  performanceMetrics: PerformanceMetrics;
  topContent: TopContentItem[];
}

export interface PlatformMetrics {
  platform: string;
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks?: number;
  avgEngagementRate: number;
  avgCompletionRate: number;
  [key: string]: any; // 添加索引签名以解决类型不兼容问题
}

export interface TimeSeriesPoint {
  date: string;
  抖音播放量?: number;
  视频号播放量?: number;
  小红书播放量?: number;
  抖音点赞量?: number;
  视频号点赞量?: number;
  小红书点赞量?: number;
  抖音评论量?: number;
  视频号评论量?: number;
  小红书评论量?: number;
  抖音分享量?: number;
  视频号分享量?: number;
  小红书分享量?: number;
  抖音收藏量?: number;
  视频号收藏量?: number;
  小红书收藏量?: number;
}

export interface ContentTypeMetrics {
  type: string;
  count: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;
  avgEngagement: number; // 添加平均互动量字段
}

export interface PerformanceMetrics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks?: number;
  avgEngagementRate: number;
  avgCompletionRate?: number;
  bestPerformingPlatform: string;
  contentGrowthRate: number;
  totalContent: number;
  viralContentCount?: number;
}

export interface TopContentItem {
  title: string;
  platform: string;
  publishTime: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
}

// 添加总统计数据接口
export interface TotalStats {
  totalCount: number;
  totalPlatforms: number;
  totalFollowers: number;
  dateRange: {
    start: string;
    end: string;
  };
}