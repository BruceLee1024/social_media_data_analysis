import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Eye, Activity, FileText } from 'lucide-react';
import { UnifiedData } from '../../types';

interface ContentCalendarProps {
  data: UnifiedData[];
}

interface DayData {
  count: number;
  totalViews: number;
  totalInteractions: number;
  items: UnifiedData[];
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const ContentCalendar: React.FC<ContentCalendarProps> = ({ data }) => {
  // 默认显示最新数据所在月份
  const latestDate = useMemo(() => {
    if (data.length === 0) return new Date();
    const ts = data.map(d => new Date(d.发布时间).getTime()).filter(t => !isNaN(t));
    return ts.length ? new Date(Math.max(...ts)) : new Date();
  }, [data]);

  const [viewYear, setViewYear] = useState(latestDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(latestDate.getMonth()); // 0-indexed
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // 按日期聚合
  const dayMap = useMemo<Map<string, DayData>>(() => {
    const map = new Map<string, DayData>();
    data.forEach(item => {
      const d = new Date(item.发布时间);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, { count: 0, totalViews: 0, totalInteractions: 0, items: [] });
      const entry = map.get(key)!;
      entry.count++;
      entry.totalViews += item.播放量 || 0;
      entry.totalInteractions += (item.点赞量 || 0) + (item.评论量 || 0) + (item.分享量 || 0) + (item.收藏量 || 0);
      entry.items.push(item);
    });
    return map;
  }, [data]);

  // 全局最大 count，用于颜色深浅
  const maxCount = useMemo(() => {
    let m = 0;
    dayMap.forEach(v => { if (v.count > m) m = v.count; });
    return Math.max(1, m);
  }, [dayMap]);

  // 计算当月统计
  const monthStats = useMemo(() => {
    let count = 0, views = 0, interactions = 0;
    dayMap.forEach((v, key) => {
      const [y, mo] = key.split('-').map(Number);
      if (y === viewYear && mo === viewMonth) {
        count += v.count;
        views += v.totalViews;
        interactions += v.totalInteractions;
      }
    });
    return { count, views, interactions };
  }, [dayMap, viewYear, viewMonth]);

  // 构建日历格子
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // 周一为第一列（0=周一 ... 6=周日）
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 转为周一起始
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-gray-100';
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'bg-blue-200';
    if (ratio <= 0.5)  return 'bg-blue-400';
    if (ratio <= 0.75) return 'bg-blue-500';
    return 'bg-blue-700';
  };

  const formatNum = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toLocaleString();

  return (
    <div className="space-y-6">
      {/* 月度统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '本月发布', value: monthStats.count + ' 条', icon: FileText, color: 'blue' },
          { label: '本月播放', value: formatNum(monthStats.views), icon: Eye, color: 'purple' },
          { label: '本月互动', value: formatNum(monthStats.interactions), icon: Activity, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm`}>
            <div className={`w-8 h-8 bg-${color}-100 rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* 日历主体 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* 月份导航 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">
              {viewYear}年 {viewMonth + 1}月 发布日历
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => { setViewYear(latestDate.getFullYear()); setViewMonth(latestDate.getMonth()); }}
              className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              最新
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 星期头 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-xs text-center font-medium text-gray-400 py-1">
              周{w}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - firstDayOfWeek + 1;
            const isValid = dayNum >= 1 && dayNum <= daysInMonth;
            if (!isValid) return <div key={idx} className="aspect-square" />;

            const key = `${viewYear}-${viewMonth}-${dayNum}`;
            const dayData = dayMap.get(key);
            const isHovered = hoveredDay === idx;

            return (
              <div
                key={idx}
                className="relative aspect-square"
                onMouseEnter={() => setHoveredDay(idx)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className={`
                  w-full h-full rounded-lg flex flex-col items-center justify-center cursor-default
                  transition-all duration-150
                  ${dayData ? getIntensity(dayData.count) : 'bg-gray-50 hover:bg-gray-100'}
                  ${isHovered && dayData ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                `}>
                  <span className={`text-xs font-medium ${dayData ? 'text-white' : 'text-gray-400'}`}>
                    {dayNum}
                  </span>
                  {dayData && (
                    <span className="text-[10px] text-white/80 font-medium">{dayData.count}</span>
                  )}
                </div>

                {/* Hover tooltip */}
                {isHovered && dayData && (
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl pointer-events-none">
                    <div className="font-semibold mb-1.5">
                      {viewMonth + 1}月{dayNum}日
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">发布</span>
                        <span>{dayData.count} 条</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">播放量</span>
                        <span>{formatNum(dayData.totalViews)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">互动量</span>
                        <span>{formatNum(dayData.totalInteractions)}</span>
                      </div>
                    </div>
                    {/* 小尖角 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">发布频次：</span>
          <div className="flex items-center gap-1">
            {(['bg-gray-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-500', 'bg-blue-700'] as const).map((c, i) => (
              <div key={i} className={`w-5 h-5 rounded ${c}`} />
            ))}
          </div>
          <div className="flex gap-3 ml-1 text-xs text-gray-400">
            <span>无 / 少</span>
            <span>→ 多</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCalendar;
