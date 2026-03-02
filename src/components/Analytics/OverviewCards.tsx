import React from 'react';
import { Eye, Heart, MessageCircle, Share2, Users, Trophy, TrendingUp, Calendar, Database, Target, BarChart3 } from 'lucide-react';
import { PerformanceMetrics } from '../../types';
import { formatCompletionRate, supportCompletionRate } from '../../utils/completionRateUtils';
import { getPlatformStyle } from '../../utils/platformStyle';

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
            {(() => {
              const totalAllViews = Object.values(platformStats).reduce((sum, s) => sum + s.totalViews, 0);
              return Object.entries(platformStats).map(([platform, stats]) => {
              const config = getPlatformStyle(platform);
              const viewsSharePct = totalAllViews > 0 ? Math.round((stats.totalViews / totalAllViews) * 100) : 0;
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
                          <div className="mt-1.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs text-gray-400">占全平台</span>
                              <span className="text-xs font-medium text-gray-500">{viewsSharePct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                                style={{ width: `${viewsSharePct}%` }}
                              />
                            </div>
                          </div>
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
                            {supportCompletionRate(platform) ? formatCompletionRate(stats.avgCompletionRate) : '-'}
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
            });
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewCards;