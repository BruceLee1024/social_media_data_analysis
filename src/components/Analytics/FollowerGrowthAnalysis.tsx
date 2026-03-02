import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UnifiedData } from '../../types';
import { format, parseISO, startOfDay, eachDayOfInterval, min, max } from 'date-fns';
import { Users, TrendingUp, BarChart3, Award, Target, Zap } from 'lucide-react';

interface FollowerGrowthAnalysisProps {
  data: UnifiedData[];
}

interface DailyGrowthData {
  date: string;
  抖音粉丝增量: number;
  视频号粉丝增量: number;
  小红书粉丝增量: number;
  总粉丝增量: number;
}

interface PlatformGrowthSummary {
  platform: string;
  totalGrowth: number;
  avgDailyGrowth: number;
  maxDailyGrowth: number;
  contentCount: number;
  growthPerContent: number;
}

const FollowerGrowthAnalysis: React.FC<FollowerGrowthAnalysisProps> = ({ data }) => {
  const [growthMode, setGrowthMode] = useState<'daily' | 'cumulative'>('daily');

  // 统一的图表主题色彩配置
  const chartThemeColors = {
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      bg: 'from-blue-50 to-indigo-50'
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bg: 'from-emerald-50 to-green-50'
    },
    accent: {
      main: '#f59e0b',
      light: '#fbbf24',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      bg: 'from-amber-50 to-orange-50'
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bg: 'from-emerald-50 to-green-50'
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      bg: 'from-amber-50 to-orange-50'
    },
    danger: {
      main: '#ef4444',
      light: '#f87171',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      bg: 'from-red-50 to-rose-50'
    },
    purple: {
      main: '#8b5cf6',
      light: '#a78bfa',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      bg: 'from-purple-50 to-violet-50'
    },
    pink: {
      main: '#ec4899',
      light: '#f472b6',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      bg: 'from-pink-50 to-rose-50'
    }
  };
  const dailyGrowthData = useMemo((): DailyGrowthData[] => {
    try {
      // 过滤掉无效日期的数据
      const validDateData = data.filter(item => {
        if (!item.发布时间 || item.发布时间.trim() === '') return false;
        const date = new Date(item.发布时间);
        return !isNaN(date.getTime());
      });

      if (validDateData.length === 0) return [];

      // 按日期分组
      const dateGroups = validDateData.reduce((acc, item) => {
        const dateStr = format(startOfDay(parseISO(item.发布时间)), 'yyyy-MM-dd');
        if (!acc[dateStr]) {
          acc[dateStr] = { 抖音: [], 视频号: [], 小红书: [] };
        }
        acc[dateStr][item.来源平台].push(item);
        return acc;
      }, {} as Record<string, Record<string, UnifiedData[]>>);

      // 获取日期范围
      const dates = validDateData.map(item => parseISO(item.发布时间));
      const startDate = min(dates);
      const endDate = max(dates);
      const allDates = eachDayOfInterval({ start: startDate, end: endDate });

      return allDates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = dateGroups[dateStr] || { 抖音: [], 视频号: [], 小红书: [] };

        const 抖音粉丝增量 = dayData.抖音.reduce((sum, item) => sum + (item.粉丝增量 || 0), 0);
        const 视频号粉丝增量 = dayData.视频号.reduce((sum, item) => sum + (item.粉丝增量 || 0), 0);
        const 小红书粉丝增量 = dayData.小红书.reduce((sum, item) => sum + (item.粉丝增量 || 0), 0);

        return {
          date: dateStr,
          抖音粉丝增量,
          视频号粉丝增量,
          小红书粉丝增量,
          总粉丝增量: 抖音粉丝增量 + 视频号粉丝增量 + 小红书粉丝增量,
        };
      });
    } catch (error) {
      console.error('生成粉丝增长数据时出错:', error);
      return [];
    }
  }, [data]);

  const platformGrowthSummary = useMemo((): PlatformGrowthSummary[] => {
    const platformGroups = data.reduce((acc, item) => {
      if (!acc[item.来源平台]) {
        acc[item.来源平台] = [];
      }
      acc[item.来源平台].push(item);
      return acc;
    }, {} as Record<string, UnifiedData[]>);

    return Object.entries(platformGroups).map(([platform, items]) => {
      const totalGrowth = items.reduce((sum, item) => sum + (item.粉丝增量 || 0), 0);
      const contentCount = items.length;
      
      // 计算每日增长数据
      const dailyGrowths = items.map(item => item.粉丝增量 || 0).filter(growth => growth > 0);
      const avgDailyGrowth = dailyGrowths.length > 0 ? 
        dailyGrowths.reduce((sum, growth) => sum + growth, 0) / dailyGrowths.length : 0;
      const maxDailyGrowth = dailyGrowths.length > 0 ? Math.max(...dailyGrowths) : 0;
      
      const growthPerContent = contentCount > 0 ? totalGrowth / contentCount : 0;

      return {
        platform,
        totalGrowth,
        avgDailyGrowth: Number(avgDailyGrowth.toFixed(0)),
        maxDailyGrowth,
        contentCount,
        growthPerContent: Number(growthPerContent.toFixed(1)),
      };
    }).sort((a, b) => b.totalGrowth - a.totalGrowth);
  }, [data]);

  // 累计模式计算
  const displayGrowthData = useMemo(() => {
    if (growthMode === 'daily') return dailyGrowthData;
    let s抖 = 0, s视 = 0, s小 = 0, s总 = 0;
    return dailyGrowthData.map(d => {
      s抖 += d.抖音粉丝增量;
      s视 += d.视频号粉丝增量;
      s小 += d.小红书粉丝增量;
      s总 += d.总粉丝增量;
      return { date: d.date, 抖音粉丝增量: s抖, 视频号粉丝增量: s视, 小红书粉丝增量: s小, 总粉丝增量: s总 };
    });
  }, [dailyGrowthData, growthMode]);

  const formatTooltip = (value: number, name: string) => {
    const nameMap: Record<string, string> = {
      抖音粉丝增量: '抖音粉丝增量',
      视频号粉丝增量: '视频号粉丝增量',
      小红书粉丝增量: '小红书粉丝增量',
      总粉丝增量: '总粉丝增量',
    };
    return [`${value.toLocaleString()}`, nameMap[name] || name];
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case '抖音': return '#ff6b6b';
      case '视频号': return '#4ecdc4';
      case '小红书': return '#ff8a80';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="space-y-8">
      {/* 粉丝增长趋势图 */}
      <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full blur-2xl"></div>
        
        {/* 标题区域 */}
        <div className="relative mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                粉丝增长趋势
              </h3>
              <p className="text-gray-600 text-sm font-medium">
                {growthMode === 'daily' ? '各平台每日粉丝增长情况' : '各平台累计粉丝增长走势'}
              </p>
            </div>
          </div>
          {/* 日/累计切换 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setGrowthMode('daily')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                growthMode === 'daily'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              日增量
            </button>
            <button
              onClick={() => setGrowthMode('cumulative')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                growthMode === 'cumulative'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              累计增长
            </button>
          </div>
        </div>

        <div className="relative h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={displayGrowthData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="douyinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColors.danger.main} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartThemeColors.danger.main} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="shipinhaoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColors.success.main} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartThemeColors.success.main} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="xiaohongshuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColors.pink.main} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartThemeColors.pink.main} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                tickLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(value) => format(parseISO(value), 'MM/dd')}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                tickLine={{ stroke: '#cbd5e1' }}
                label={{ value: '粉丝增量', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontWeight: 600 } }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(label) => format(parseISO(label), 'yyyy年MM月dd日')}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(10px)',
                  fontSize: '14px',
                  fontWeight: 500
                }}
                cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="抖音粉丝增量"
                stackId="1"
                stroke={chartThemeColors.danger.main}
                fill="url(#douyinGradient)"
                strokeWidth={3}
                dot={{ fill: chartThemeColors.danger.main, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartThemeColors.danger.main, strokeWidth: 2, fill: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="视频号粉丝增量"
                stackId="1"
                stroke={chartThemeColors.success.main}
                fill="url(#shipinhaoGradient)"
                strokeWidth={3}
                dot={{ fill: chartThemeColors.success.main, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartThemeColors.success.main, strokeWidth: 2, fill: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="小红书粉丝增量"
                stackId="1"
                stroke={chartThemeColors.pink.main}
                fill="url(#xiaohongshuGradient)"
                strokeWidth={3}
                dot={{ fill: chartThemeColors.pink.main, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartThemeColors.pink.main, strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 平台粉丝增长对比 */}
      <div className="relative bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/10 to-green-400/10 rounded-full blur-2xl"></div>
        
        {/* 标题区域 */}
        <div className="relative mb-8 flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg animate-pulse">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
              平台粉丝增长对比
            </h3>
            <p className="text-gray-600 text-sm font-medium">各平台总粉丝增长量和平均增长效率</p>
          </div>
        </div>

        <div className="relative h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={platformGrowthSummary}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="totalGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColors.primary.main} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={chartThemeColors.primary.light} stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="avgGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartThemeColors.success.main} stopOpacity={0.9}/>
                  <stop offset="95%" stopColor={chartThemeColors.success.light} stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis 
                dataKey="platform" 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                tickLine={{ stroke: '#cbd5e1' }}
                label={{ value: '粉丝增量', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontWeight: 600 } }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'totalGrowth') return [`${value.toLocaleString()}`, '总粉丝增长'];
                  if (name === 'avgDailyGrowth') return [`${value.toLocaleString()}`, '平均单条增长'];
                  return [value, name];
                }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(10px)',
                  fontSize: '14px',
                  fontWeight: 500
                }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 600 }}
              />
              <Bar 
                dataKey="totalGrowth" 
                fill="url(#totalGrowthGradient)" 
                name="总粉丝增长" 
                radius={[4, 4, 0, 0]}
                stroke={chartThemeColors.primary.main}
                strokeWidth={1}
              />
              <Bar 
                dataKey="avgDailyGrowth" 
                fill="url(#avgGrowthGradient)" 
                name="平均单条增长" 
                radius={[4, 4, 0, 0]}
                stroke={chartThemeColors.success.main}
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {platformGrowthSummary.map((platform, index) => {
            const getIconAndColor = (platformName: string) => {
              switch (platformName) {
                case '抖音':
                  return { 
                    icon: Zap, 
                    color: chartThemeColors.danger.main,
                    bgGradient: chartThemeColors.danger.bg,
                    iconBg: 'from-red-500 to-rose-600'
                  };
                case '视频号':
                  return { 
                    icon: Users, 
                    color: chartThemeColors.success.main,
                    bgGradient: chartThemeColors.success.bg,
                    iconBg: 'from-green-500 to-emerald-600'
                  };
                case '小红书':
                  return { 
                    icon: Target, 
                    color: chartThemeColors.pink.main,
                    bgGradient: chartThemeColors.pink.bg,
                    iconBg: 'from-pink-500 to-rose-600'
                  };
                default:
                  return { 
                    icon: Award, 
                    color: chartThemeColors.purple.main,
                    bgGradient: chartThemeColors.purple.bg,
                    iconBg: 'from-purple-500 to-violet-600'
                  };
              }
            };

            const { icon: Icon, color, bgGradient, iconBg } = getIconAndColor(platform.platform);

            return (
              <div 
                key={platform.platform} 
                className={`relative bg-gradient-to-br ${bgGradient} backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-white/10 rounded-full blur-lg"></div>
                
                {/* 平台标题 */}
                <div className="relative flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-10 h-10 bg-gradient-to-br ${iconBg} rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                      {platform.platform}
                    </h4>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                </div>

                {/* 数据指标 */}
                <div className="relative space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                    <span className="text-sm font-medium text-gray-700">总增长</span>
                    <span className="text-lg font-bold text-blue-600">{platform.totalGrowth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                    <span className="text-sm font-medium text-gray-700">平均单条</span>
                    <span className="text-lg font-bold text-green-600">{platform.avgDailyGrowth}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                    <span className="text-sm font-medium text-gray-700">最高单条</span>
                    <span className="text-lg font-bold text-purple-600">{platform.maxDailyGrowth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20">
                    <span className="text-sm font-medium text-gray-700">内容数量</span>
                    <span className="text-lg font-bold text-gray-800">{platform.contentCount}</span>
                  </div>
                </div>

                {/* 悬停效果指示器 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 粉效比分析 */}
      <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">粉效比分析</h3>
              <p className="text-sm text-gray-500">粉丝增量 / 播放量 × 1000，衡量内容吸粉转化效率</p>
            </div>
          </div>
        </div>

        {/* 平台粉效比柱图 */}
        {(() => {
          const fanEffData = platformGrowthSummary.map(p => {
            const items = data.filter(d => d['来源平台'] === p.platform && (d['播放量'] || 0) > 0);
            const totalViews = items.reduce((s, d) => s + (d['播放量'] || 0), 0);
            const totalFans = items.reduce((s, d) => s + (d['粉丝增量'] || 0), 0);
            const fanEff = totalViews > 0 ? (totalFans / totalViews) * 1000 : 0;
            return { platform: p.platform, 粉效比: parseFloat(fanEff.toFixed(2)) };
          }).filter(d => d['粉效比'] > 0);

          if (fanEffData.length === 0) return (
            <div className="text-center py-8 text-gray-400"><TrendingUp className="w-8 h-8 mx-auto mb-2" /><p>暂无粉帷增量数据</p></div>
          );

          return (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fanEffData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="fanEffGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)}`, '粉效比(千播增粉)']} />
                  <Bar dataKey="粉效比" fill="url(#fanEffGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Top 10 粉效比内容列表 */}
        {(() => {
          const topFanEff = data
            .filter(d => (d['播放量'] || 0) > 0 && (d['粉丝增量'] || 0) > 0)
            .map(d => ({
              ...d,
              _fanEff: ((d['粉丝增量'] || 0) / (d['播放量'] || 1)) * 1000,
            }))
            .sort((a, b) => b._fanEff - a._fanEff)
            .slice(0, 10);

          if (topFanEff.length === 0) return null;

          return (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">🏆 Top 10 高粉效比内容</h4>
              <div className="space-y-2">
                {topFanEff.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white/30 hover:bg-white/80 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${
                        i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'
                      }`}>{i + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">{item['来源平台']}</span>
                      <span className="text-sm text-gray-700 truncate">{item['标题描述'] || '无标题'}</span>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0 ml-3">
                      <span className="text-xs text-gray-500">{(item['播放量'] || 0).toLocaleString()} 播放</span>
                      <span className="text-sm font-bold text-purple-600">{item._fanEff.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default FollowerGrowthAnalysis;
