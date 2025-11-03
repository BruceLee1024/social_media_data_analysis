import React from 'react';
import { Eye, Heart, MessageCircle, Share2, Users, Trophy, TrendingUp, Calendar, Database, Target, BarChart3 } from 'lucide-react';
import { PerformanceMetrics } from '../../types';

interface PlatformStat {
  count: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks: number;
  totalFollowers: number;
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
  avgBookmarks?: number;
  avgCompletionRate: number;
  avgInteractions?: number;
  hasShares: boolean;
  hasBookmarks: boolean;
}

interface OverviewCardsProps {
  metrics: PerformanceMetrics;
  totalDataCount?: number;
  totalPlatforms?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  totalFollowers?: number;
  platformStats?: Record<string, PlatformStat>;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ 
  metrics, 
  totalDataCount, 
  totalPlatforms, 
  dateRange, 
  totalFollowers,
  platformStats 
}) => {
  // 格式化数字
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) {
      return '0';
    }
    return num.toLocaleString();
  };

  const formatCompletionRate = (rate: number, platform: string, isProcessed = false) => {
    if (isProcessed) {
      return rate.toFixed(2) + '%';
    } else {
      // 所有平台都直接使用原始数据，不再对抖音进行特殊处理
      return rate.toFixed(2) + '%';
    }
  };

  // 平台配置：颜色主题和图标
  const platformConfig = {
    '抖音': {
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.6-5.75-.16-2.38 1.14-4.7 3.27-5.64 2.13-.94 4.65-.26 6.2 1.66.55.68.85 1.52.85 2.38 0 .86-.3 1.7-.85 2.38-1.55 1.92-4.07 2.6-6.2 1.66-2.13-.94-3.43-3.26-3.27-5.64.16-2.38 1.58-4.56 3.6-5.75 1.22-.72 2.65-1.11 4.08-1.03 2.33.04 4.6 1.29 5.91 3.21.81 1.15 1.27 2.54 1.35 3.94.03 2.91.01 5.83.02 8.75.52.34 1.05.67 1.62.93 1.31.62 2.76.92 4.2.97v-4.03c-1.54-.17-3.12-.68-4.24-1.79-1.12-1.08-1.67-2.64-1.75-4.17z"/>
        </svg>
      )
    },
    '小红书': {
      gradient: 'from-red-600 to-rose-500',
      bgGradient: 'from-red-50 to-rose-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.234-.4-.393-.656-.45-.256-.057-.522.01-.754.19l-1.35.96c-.191.136-.307.35-.325.58-.018.23.062.457.223.634.322.354.49.82.46 1.295-.03.475-.25.92-.61 1.235-.36.315-.82.46-1.295.4-.475-.06-.92-.31-1.235-.67-.315-.36-.46-.82-.4-1.295.06-.475.31-.92.67-1.235.36-.315.82-.46 1.295-.4.158.02.31-.04.42-.17.11-.13.16-.3.14-.47-.02-.17-.1-.32-.22-.43-.36-.32-.82-.49-1.295-.46-.475.03-.92.25-1.235.61-.315.36-.46.82-.4 1.295.06.475.31.92.67 1.235.36.315.82.46 1.295.4.475-.06.92-.31 1.235-.67.315-.36.46-.82.4-1.295-.06-.475-.31-.92-.67-1.235z"/>
        </svg>
      )
    },
    '视频号': {
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-.776-.776c-.434-.434-.434-1.138 0-1.572.434-.434 1.138-.434 1.572 0L9.333 4.72c.434.434.434 1.138 0 1.572L6.903 8.72c-.434.434-1.138.434-1.572 0-.434-.434-.434-1.138 0-1.572l.776-.776h-.774c-.896.032-1.738.372-2.36.994-.622.622-.962 1.464-.994 2.36v7.36c.032.896.372 1.738.994 2.36.622.622 1.464.962 2.36.994h13.334c.896-.032 1.738-.372 2.36-.994.622-.622.962-1.464.994-2.36v-7.36c-.032-.896-.372-1.738-.994-2.36-.622-.622-1.464-.962-2.36-.994h-.854l.854-.854c.434-.434.434-1.138 0-1.572-.434-.434-1.138-.434-1.572 0l-2.427 2.427c-.434.434-.434 1.138 0 1.572l2.427 2.427c.434.434 1.138.434 1.572 0 .434-.434.434-1.138 0-1.572l-.854-.854z"/>
        </svg>
      )
    }
  };

  // 获取平台配置，如果没有配置则使用默认样式
  const getPlatformConfig = (platform: string) => {
    return platformConfig[platform as keyof typeof platformConfig] || {
      gradient: 'from-gray-500 to-slate-500',
      bgGradient: 'from-gray-50 to-slate-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      )
    };
  };

  // 格式化日期范围
  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return `${formatDate(startDate)} 至 ${formatDate(endDate)}`;
  };

  return (
    <div className="space-y-8">
      {/* 数据概览卡片 */}
      {(totalDataCount || totalPlatforms || dateRange || totalFollowers) && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              数据概览
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 1. 总涨粉数 */}
            {totalFollowers && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium mb-1">总涨粉数</p>
                    <p className="text-3xl font-bold text-orange-700">{formatNumber(totalFollowers)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* 2. 总内容数 */}
            {totalDataCount && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium mb-1">总内容数</p>
                    <p className="text-3xl font-bold text-blue-700">{formatNumber(totalDataCount)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* 3. 覆盖平台 */}
            {totalPlatforms && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium mb-1">覆盖平台</p>
                    <p className="text-3xl font-bold text-green-700">{totalPlatforms}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* 4. 时间跨度 */}
            {dateRange && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium mb-1">时间跨度</p>
                    <p className="text-lg font-bold text-purple-700">{formatDateRange(dateRange.start, dateRange.end)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 整体数据卡片 */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            整体数据
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium mb-1">总观看量</p>
                <p className="text-3xl font-bold text-blue-700">{formatNumber(metrics.totalViews)}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium mb-1">平均播放量（抖音+视频号）</p>
                <p className="text-3xl font-bold text-indigo-700">{formatNumber(metrics.avgViewsDouyinShipinhao || 0)}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium mb-1">总点赞量</p>
                <p className="text-3xl font-bold text-red-700">{formatNumber(metrics.totalLikes)}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium mb-1">总评论量</p>
                <p className="text-3xl font-bold text-green-700">{formatNumber(metrics.totalComments)}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium mb-1">总分享量</p>
                <p className="text-3xl font-bold text-purple-700">{formatNumber(metrics.totalShares)}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                <Share2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-yellow-600 text-sm font-medium mb-1">总互动量</p>
                 <p className="text-3xl font-bold text-yellow-700">{formatNumber(metrics.totalLikes + metrics.totalComments + metrics.totalShares + (metrics.totalBookmarks || 0))}</p>
               </div>
               <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                 <Users className="w-6 h-6 text-white" />
               </div>
             </div>
           </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 text-sm font-medium mb-1">最佳表现平台</p>
                <p className="text-xl font-bold text-teal-700">{metrics.bestPerformingPlatform}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 平台统计卡片 */}
      {platformStats && Object.keys(platformStats).length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              平台统计
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(platformStats).map(([platform, stats]) => {
              const config = getPlatformConfig(platform);
              return (
                <div key={platform} className={`bg-gradient-to-br ${config.bgGradient} rounded-2xl border ${config.borderColor} shadow-lg overflow-hidden`}>
                  {/* 卡片头部 */}
                  <div className={`bg-gradient-to-r ${config.gradient} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-white mr-3">
                          {config.icon}
                        </div>
                        <h4 className="text-lg font-bold text-white">{platform}</h4>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-full px-3 py-1">
                        <span className="text-white text-sm font-medium">{stats.count} 条</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 卡片内容 */}
                  <div className="p-6">
                    {/* 总数据区域 */}
                    <div className="mb-6">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">总数据</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl p-3 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">总播放量</div>
                          <div className={`text-lg font-bold ${config.textColor}`}>{formatNumber(stats.totalViews)}</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">总点赞数</div>
                          <div className={`text-lg font-bold ${config.textColor}`}>{formatNumber(stats.totalLikes)}</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">总评论数</div>
                          <div className={`text-lg font-bold ${config.textColor}`}>{formatNumber(stats.totalComments)}</div>
                        </div>
                        {stats.hasShares && (
                          <div className="bg-white rounded-xl p-3 shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">总分享数</div>
                            <div className={`text-lg font-bold ${config.textColor}`}>{formatNumber(stats.totalShares)}</div>
                          </div>
                        )}
                        {stats.hasBookmarks && (
                          <div className="bg-white rounded-xl p-3 shadow-sm">
                            <div className="text-xs text-gray-500 mb-1">总收藏数</div>
                            <div className={`text-lg font-bold ${config.textColor}`}>{formatNumber(stats.totalBookmarks)}</div>
                          </div>
                        )}
                        <div className="bg-white rounded-xl p-3 shadow-sm">
                          <div className="text-xs text-gray-500 mb-1">总涨粉数</div>
                          <div className={`text-lg font-bold ${config.textColor}`}>{formatNumber(stats.totalFollowers)}</div>
                        </div>
                      </div>
                    </div>

                    {/* 平均数据区域 */}
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">平均数据</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-600">平均播放量</span>
                          <span className={`font-semibold ${config.textColor}`}>{formatNumber(stats.avgViews)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-600">平均点赞数</span>
                          <span className={`font-semibold ${config.textColor}`}>{formatNumber(stats.avgLikes)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-600">平均评论数</span>
                          <span className={`font-semibold ${config.textColor}`}>{formatNumber(stats.avgComments)}</span>
                        </div>
                        {stats.hasShares && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">平均分享数</span>
                            <span className={`font-semibold ${config.textColor}`}>{formatNumber(stats.avgShares)}</span>
                          </div>
                        )}
                        {stats.hasBookmarks && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-600">平均收藏数</span>
                            <span className={`font-semibold ${config.textColor}`}>{formatNumber(stats.avgBookmarks)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-600">平均完播率</span>
                          <span className={`font-semibold ${config.textColor}`}>
                            {platform === '小红书' ? '-' : formatCompletionRate(stats.avgCompletionRate, platform, true)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-600">平均互动数</span>
                          <span className={`font-semibold ${config.textColor}`}>{formatNumber(stats.avgInteractions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewCards;