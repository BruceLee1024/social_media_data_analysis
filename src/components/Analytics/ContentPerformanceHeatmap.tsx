import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, TrendingUp, Eye, Heart, MessageCircle, Share2, BookmarkPlus } from 'lucide-react';
import { UnifiedData } from '../../types';
import { format, parseISO, getDate, getMonth, getYear, startOfYear, endOfYear, eachDayOfInterval, getDay, startOfWeek, addDays } from 'date-fns';

interface ContentPerformanceHeatmapProps {
  data: UnifiedData[];
}

interface HeatmapData {
  date: string;
  day: number;
  month: number;
  year: number;
  weekIndex: number;
  dayIndex: number;
  value: number;
  count: number;
  avgViews: number;
  avgEngagement: number;
  isCurrentYear: boolean;
}

const ContentPerformanceHeatmap: React.FC<ContentPerformanceHeatmapProps> = ({ data }) => {
  const [hoveredData, setHoveredData] = useState<HeatmapData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 获取当前年份或数据年份
    const currentYear = new Date().getFullYear();
    const dataYears = data.map(item => getYear(parseISO(item.发布时间)));
    const targetYear = dataYears.length > 0 ? Math.max(...dataYears) : currentYear;

    // 生成全年日历数据 (从周一开始的53周)
    const yearStart = startOfYear(new Date(targetYear, 0, 1));
    const yearEnd = endOfYear(new Date(targetYear, 11, 31));
    
    // 找到年初第一个周一
    const firstMonday = startOfWeek(yearStart, { weekStartsOn: 1 });
    
    // 生成53周的数据 (从周一开始)
    const weeks = [];
    for (let week = 0; week < 53; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = addDays(firstMonday, week * 7 + day);
        weekDays.push(currentDate);
      }
      weeks.push(weekDays);
    }

    // 按日期分组数据
    const dataByDate = data.reduce((acc, item) => {
      const date = format(parseISO(item.发布时间), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, UnifiedData[]>);

    // 生成热力图数据
    const heatmapGrid = weeks.map((week, weekIndex) => 
      week.map((date, dayIndex) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = dataByDate[dateStr] || [];
        
        const totalViews = dayData.reduce((sum, item) => sum + (item.播放量 || 0), 0);
        const totalEngagement = dayData.reduce((sum, item) => 
          sum + (item.点赞量 || 0) + (item.评论量 || 0) + (item.分享量 || 0) + (item.收藏量 || 0), 0
        );

        return {
          date: dateStr,
          day: getDate(date),
          month: getMonth(date),
          year: getYear(date),
          weekIndex,
          dayIndex,
          value: totalViews,
          count: dayData.length,
          avgViews: dayData.length > 0 ? totalViews / dayData.length : 0,
          avgEngagement: dayData.length > 0 ? totalEngagement / dayData.length : 0,
          isCurrentYear: getYear(date) === targetYear,
        };
      })
    );

    return heatmapGrid.flat();
  }, [data]);

  // 获取最大值用于颜色强度计算
  const maxValue = Math.max(...heatmapData.map(d => d.value), 1);

  const getColorIntensity = (value: number) => {
    return Math.min(value / maxValue, 1);
  };

  const getColorClass = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-100 border border-gray-200';
    if (intensity <= 0.2) return 'bg-green-100 border border-green-200';
    if (intensity <= 0.4) return 'bg-green-200 border border-green-300';
    if (intensity <= 0.6) return 'bg-green-300 border border-green-400';
    if (intensity <= 0.8) return 'bg-green-400 border border-green-500';
    return 'bg-green-500 border border-green-600';
  };

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const formatTooltipContent = (cell: HeatmapData) => {
    if (cell.count === 0) {
      return `${cell.date} - 无发布内容`;
    }
    
    return `${cell.date}
发布数量: ${cell.count}
总播放量: ${cell.value.toLocaleString()}
平均播放量: ${Math.round(cell.avgViews).toLocaleString()}
平均互动量: ${Math.round(cell.avgEngagement).toLocaleString()}`;
  };

  // 生成月份标签 - 每隔5个格子显示一个月份
  const monthLabels = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthPositions = [];
    
    // 每隔5个格子（周）显示一个月份标签
    // 从第0个格子开始，每隔5个格子显示一个月份
    for (let i = 0; i < 12; i++) {
      const weekPosition = i * 5; // 从第0周开始，每隔5周显示一个月份
      if (weekPosition < 53) { // 确保不超出53周的范围
        monthPositions.push({
          label: months[i],
          position: weekPosition
        });
      }
    }
    
    return monthPositions;
  }, []);
  
  // 生成星期标签 - 从周一开始
  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 按周重新组织数据
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let week = 0; week < 53; week++) {
      const weekData = heatmapData.filter(item => item.weekIndex === week);
      weeks.push(weekData);
    }
    return weeks;
  }, [heatmapData]);

  return (
    <>
    <div className="bg-white rounded-lg shadow-sm p-6 w-full overflow-visible">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">内容发布热力图</h3>
      </div>

      {/* GitHub风格的全年热力图 - 全宽布局 */}
      <div className="mb-6 w-full overflow-x-auto overflow-y-visible">
        <div className="w-full relative">
          {/* 月份标签 */}
          <div className="flex mb-2">
            <div className="w-20 flex-shrink-0"></div> {/* 星期标签占位 */}
            <div className="relative flex-1" style={{ minWidth: `${53 * 25}px`, height: '20px' }}>
              {monthLabels.map((monthData, index) => (
                <span 
                  key={monthData.label} 
                  className="absolute text-sm text-gray-600 font-medium"
                  style={{ 
                    left: `${monthData.position * 25 + 12}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {monthData.label}
                </span>
              ))}
            </div>
          </div>

          {/* 热力图主体 */}
          <div className="flex">
            {/* 星期标签 */}
            <div className="flex flex-col mr-4 text-sm text-gray-600 w-20 flex-shrink-0" style={{ height: '168px' }}>
              {weekLabels.map((day, index) => (
                <div key={day} className="font-medium flex items-center" style={{ height: '24px' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* 热力图网格 */}
            <div className="flex gap-1 flex-1 justify-start">
              {weeklyData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dayData = week.find(item => item.dayIndex === dayIndex);
                    const isEmpty = !dayData || !dayData.isCurrentYear;
                    const intensity = dayData ? getColorIntensity(dayData.value) : 0;
                    const colorClass = isEmpty ? 'bg-gray-50' : getColorClass(intensity);
                    
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`
                          ${colorClass} 
                          w-6 h-6 rounded-sm border border-gray-200 cursor-pointer
                          transition-all duration-200 hover:border-gray-400 hover:scale-110
                          group relative
                        `}
                        style={{ height: '24px', width: '24px' }}
                        onMouseEnter={(e) => {
                          if (dayData) {
                            setHoveredData(dayData);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredData(null);
                        }}
                        onMouseMove={(e) => {
                          if (dayData) {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        title={dayData ? formatTooltipContent(dayData) : ''}
                      >
                        {/* 移除原有的悬浮提示框，使用Portal替代 */}
                      </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
        
        {/* 图例 */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>总发布天数: {heatmapData.filter(item => item.count > 0 && item.isCurrentYear).length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-200 border border-green-300 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-300 border border-green-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-500 border border-green-600 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-700 border border-green-800 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-2xl font-bold text-blue-600">
            {heatmapData.reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-sm text-gray-600">总发布数量</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(heatmapData.reduce((sum, d) => sum + d.value, 0)).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">总播放量</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(heatmapData.reduce((sum, d) => sum + d.avgEngagement * d.count, 0) / Math.max(heatmapData.reduce((sum, d) => sum + d.count, 0), 1)).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">平均互动量</div>
        </div>
      </div>
    </div>
    
    {/* Portal悬浮框 - 渲染到body层级 */}
    {hoveredData && createPortal(
      <div 
        className="fixed px-4 py-3 bg-gray-800 text-white text-sm rounded-lg shadow-xl border border-gray-600 pointer-events-none z-[10000] whitespace-pre-line"
        style={{
          left: mousePosition.x + 15,
          top: mousePosition.y - 10,
          transform: 'translateY(-100%)'
        }}
      >
        {formatTooltipContent(hoveredData)}
      </div>,
      document.body
    )}
    </>
  );
};

export default ContentPerformanceHeatmap;