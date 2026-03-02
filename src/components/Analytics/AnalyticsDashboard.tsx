import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { BarChart3, TrendingUp, FileText, Award, ChartBar, Users, Activity, Save, Layers, FileDown, ClipboardList, X, Copy, Check, CalendarDays, Filter, RotateCcw } from 'lucide-react';
import { AnalyticsData, UnifiedData } from '../../types';
import OverviewCards from './OverviewCards';
import PlatformComparison from './PlatformComparison';
import TrendAnalysis from './TrendAnalysis';
import ContentAnalysis from './ContentAnalysis';
import EngagementAnalysis from './EngagementAnalysis';
import FollowerGrowthAnalysis from './FollowerGrowthAnalysis';
import ContentPerformanceHeatmap from './ContentPerformanceHeatmap';
import CrossPlatformAnalysis from './CrossPlatformAnalysis';
import InsightCards from './InsightCards';
import ContentCalendar from './ContentCalendar';
import { SnapshotManager } from '../../utils/snapshotManager';

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
  summary?: any;
  rawData?: UnifiedData[];
  goalData?: any;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics, summary, rawData, goalData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'platform' | 'trend' | 'content' | 'engagement' | 'followers' | 'heatmap' | 'crossplatform' | 'calendar'>('overview');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportCopied, setReportCopied] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const dashboardContentRef = useRef<HTMLDivElement>(null);

  // 全局日期范围
  const rawDateRange = useMemo(() => {
    if (!rawData || rawData.length === 0) return { min: '', max: '' };
    const dates = rawData.map(d => d.发布时间?.slice(0, 10)).filter(Boolean).sort();
    return { min: dates[0] || '', max: dates[dates.length - 1] || '' };
  }, [rawData]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // 当 rawData 变化时同步重置日期范围
  useEffect(() => {
    if (rawDateRange.min) {
      setDateFrom(rawDateRange.min);
      setDateTo(rawDateRange.max);
    }
  }, [rawDateRange.min, rawDateRange.max]);

  const filteredRawData = useMemo(() => {
    if (!rawData) return rawData;
    const from = dateFrom || rawDateRange.min;
    const to = dateTo || rawDateRange.max;
    if (!from && !to) return rawData;
    return rawData.filter(d => {
      const ds = d.发布时间?.slice(0, 10) || '';
      return ds >= from && ds <= to;
    });
  }, [rawData, dateFrom, dateTo, rawDateRange]);

  const handleSaveSnapshot = async (name: string, description?: string) => {
    console.log('AnalyticsDashboard - Saving snapshot with goalData:', goalData);
    if (!rawData || rawData.length === 0) {
      setSaveStatus('error');
      return;
    }

    // 验证目标达成数据是否已填写
    if (!goalData || !isGoalDataComplete(goalData)) {
      setSaveStatus('error');
      alert('请先在目标达成页面填写完整的目标数据后再创建快照');
      return;
    }

    setSaveStatus('saving');
    try {
      console.log('Creating snapshot with goalData:', goalData);
      const snapshot = SnapshotManager.createSnapshot(rawData, analytics, summary, name, description, goalData);
      console.log('Created snapshot:', snapshot);
      const success = SnapshotManager.saveSnapshot(snapshot);
      if (success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('保存快照失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // 生成文字周报
  const generateWeeklyReport = useCallback(() => {
    const { performanceMetrics, platformComparison } = analytics;
    const today = new Date().toLocaleDateString('zh-CN');
    let report = `===== 自媒体数据分析报告 =====\n生成日期：${today}\n\n`;
    report += `【整体表现】\n`;
    report += `- 总播放量：${performanceMetrics.totalViews.toLocaleString()} 次\n`;
    report += `- 总点赞量：${performanceMetrics.totalLikes.toLocaleString()} 次\n`;
    report += `- 总评论量：${performanceMetrics.totalComments.toLocaleString()} 次\n`;
    if (performanceMetrics.totalShares > 0) {
      report += `- 总分享量：${performanceMetrics.totalShares.toLocaleString()} 次\n`;
    }
    report += `- 平均互动率：${(performanceMetrics.avgEngagementRate * 100).toFixed(2)}%\n`;
    report += `- 内容总数：${performanceMetrics.totalContent} 条\n`;
    report += `- 最佳平台：${performanceMetrics.bestPerformingPlatform}\n\n`;
    report += `【各平台表现】\n`;
    platformComparison.forEach(p => {
      report += `\n${p.platform}：\n`;
      report += `  内容数量：${p.totalContent} 条\n`;
      report += `  总播放量：${p.totalViews.toLocaleString()} 次\n`;
      report += `  总点赞量：${p.totalLikes.toLocaleString()} 次\n`;
      report += `  平均互动率：${(p.avgEngagementRate * 100).toFixed(2)}%\n`;
    });
    if (rawData && rawData.length > 0) {
      const dayStats: Record<number, { total: number; count: number }> = {};
      rawData.forEach(item => {
        const d = new Date(item.发布时间).getDay();
        if (!dayStats[d]) dayStats[d] = { total: 0, count: 0 };
        dayStats[d].total += item.播放量 || 0;
        dayStats[d].count++;
      });
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const bestDay = Object.entries(dayStats)
        .map(([d, s]) => ({ day: dayNames[+d], avg: s.count ? s.total / s.count : 0 }))
        .sort((a, b) => b.avg - a.avg)[0];
      if (bestDay) {
        report += `\n【发布建议】\n`;
        report += `- 最佳发布日：${bestDay.day}（平均播放量 ${Math.round(bestDay.avg).toLocaleString()}）\n`;
      }
    }
    report += `\n===== 报告结束 =====`;
    return report;
  }, [analytics, rawData]);

  // PDF 导出
  const handleExportPDF = async () => {
    if (!dashboardContentRef.current) return;
    setPdfExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(dashboardContentRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
      pdf.save(`数据分析报告_${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF导出失败:', err);
    } finally {
      setPdfExporting(false);
    }
  };

  // 验证目标数据是否完整
  const isGoalDataComplete = (data: any): boolean => {
    if (!data || !data.content || !data.fans) {
      return false;
    }

    // 检查内容目标数据
    const contentData = data.content;
    if (!contentData.totalVideos || contentData.totalVideos <= 0 ||
        !contentData.interviewVideos || contentData.interviewVideos < 0 ||
        !contentData.otherVideos || contentData.otherVideos < 0 ||
        !contentData.businessVideos || contentData.businessVideos < 0 ||
        !contentData.trafficVideos || contentData.trafficVideos < 0) {
      return false;
    }

    // 检查粉丝目标数据
    const fansData = data.fans;
    if (!fansData.douyin || fansData.douyin < 0 ||
        !fansData.shipinhao || fansData.shipinhao < 0 ||
        !fansData.xiaohongshu || fansData.xiaohongshu < 0 ||
        !fansData.total || fansData.total <= 0) {
      return false;
    }

    return true;
  };

  const tabs = [
    { id: 'overview', name: '数据概览', icon: BarChart3 },
    { id: 'platform', name: '平台对比', icon: Award },
    { id: 'trend', name: '趋势分析', icon: TrendingUp },
    { id: 'content', name: '内容分析', icon: FileText },
    { id: 'engagement', name: '互动分析', icon: Activity },
    { id: 'followers', name: '粉丝增长', icon: Users },
    { id: 'heatmap', name: '时间热力图', icon: ChartBar },
    { id: 'crossplatform', name: '跨平台对比', icon: Layers },
    { id: 'calendar', name: '发布日历', icon: CalendarDays },
  ];

  const renderContent = () => {
    const fd = filteredRawData;
    const noData = <div className="p-8 text-center text-gray-500">需要原始数据来显示此分析</div>;
    switch (activeTab) {
      case 'overview':
        if (summary) {
          return (
            <>
              <InsightCards analytics={analytics} rawData={fd} />
              <OverviewCards
                metrics={analytics.performanceMetrics}
                totalDataCount={summary.总数据量}
                totalPlatforms={Object.keys(summary.平台统计).length}
                dateRange={summary.时间范围 ? {
                  start: summary.时间范围.最早,
                  end: summary.时间范围.最晚
                } : undefined}
                totalFollowers={summary.总涨粉数}
                platformStats={summary.平台统计}
              />
            </>
          );
        }
        return (
          <>
            <InsightCards analytics={analytics} rawData={fd} />
            <OverviewCards metrics={analytics.performanceMetrics} />
          </>  
        );
      case 'platform':
        return <PlatformComparison data={analytics.platformComparison} />;
      case 'trend':
        return <TrendAnalysis data={analytics.timeSeriesData} rawData={fd} />;
      case 'content':
        return <ContentAnalysis contentTypes={analytics.contentTypeAnalysis} topContent={analytics.topContent} rawData={fd} />;
      case 'engagement':
        return fd ? <EngagementAnalysis data={fd} /> : noData;
      case 'followers':
        return fd ? <FollowerGrowthAnalysis data={fd} /> : noData;
      case 'heatmap':
        return fd ? <ContentPerformanceHeatmap data={fd} /> : noData;
      case 'crossplatform':
        return fd ? <CrossPlatformAnalysis data={fd} /> : noData;
      case 'calendar':
        return fd ? <ContentCalendar data={fd} /> : noData;
      default:
        return <OverviewCards metrics={analytics.performanceMetrics} />;
    }
  };

  return (
    <div className="space-y-4 overflow-visible">
      {/* 粘性顶部面板：标题 + 操作 + 日期筛选 + 标签栏 */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        {/* 标题行 + 操作按钮 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900 shrink-0">数据分析</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 状态反馈 */}
            {saveStatus === 'saving' && (
              <div className="flex items-center text-blue-600 text-sm gap-1.5">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600"></div>
                保存中…
              </div>
            )}
            {saveStatus === 'success' && (
              <span className="text-green-600 text-sm font-medium">✓ 已保存</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 text-sm font-medium">✗ 保存失败</span>
            )}
            {/* 生成周报 - 次要按钮 */}
            <button
              onClick={() => { setReportText(generateWeeklyReport()); setShowWeeklyReport(true); }}
              disabled={!rawData || rawData.length === 0}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
              生成周报
            </button>
            {/* 导出PDF - 次要按钮 */}
            <button
              onClick={handleExportPDF}
              disabled={pdfExporting || !rawData || rawData.length === 0}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              {pdfExporting ? '导出中…' : '导出PDF'}
            </button>
            {/* 保存快照 - 主要按钮 */}
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!rawData || rawData.length === 0 || saveStatus === 'saving'}
              className="flex items-center px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              保存快照
            </button>
          </div>
        </div>

        {/* 全局日期范围筛选 */}
        {rawData && rawData.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-xs font-medium text-blue-700 shrink-0">日期筛选：</span>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dateFrom}
                min={rawDateRange.min}
                max={dateTo || rawDateRange.max}
                onChange={e => setDateFrom(e.target.value)}
                className="text-xs border border-blue-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
              <span className="text-gray-400 text-xs">至</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || rawDateRange.min}
                max={rawDateRange.max}
                onChange={e => setDateTo(e.target.value)}
                className="text-xs border border-blue-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
              <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
                {filteredRawData?.length ?? 0} / {rawData.length} 条
              </span>
              {(dateFrom !== rawDateRange.min || dateTo !== rawDateRange.max) && (
                <button
                  onClick={() => { setDateFrom(rawDateRange.min); setDateTo(rawDateRange.max); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置
                </button>
              )}
            </div>
          </div>
        )}

        {/* 标签栏 - 横向滚动，不折行 */}
        <div className="overflow-x-auto -mx-1 px-1">
          <nav className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 标签页内容区 */}
      <div className="min-h-96 overflow-visible" ref={dashboardContentRef}>
        {renderContent()}
      </div>

      {/* 周报 Modal */}
      {showWeeklyReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" />
                数据分析报告
              </h3>
              <button onClick={() => setShowWeeklyReport(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              readOnly
              value={reportText}
              className="flex-1 min-h-64 p-4 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none font-mono leading-relaxed focus:outline-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reportText).then(() => {
                    setReportCopied(true);
                    setTimeout(() => setReportCopied(false), 2000);
                  });
                }}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {reportCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {reportCopied ? '已复制' : '复制文本'}
              </button>
              <button onClick={() => setShowWeeklyReport(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Snapshot Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">保存数据快照</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              if (name.trim()) {
                handleSaveSnapshot(name.trim(), description.trim() || undefined);
                setShowSaveModal(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    快照名称 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入快照名称"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    描述（可选）
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入快照描述"
                  />
                </div>
                
                {/* 数据验证状态提示 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">数据完整性检查</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${rawData && rawData.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={rawData && rawData.length > 0 ? 'text-green-700' : 'text-red-700'}>
                        基础数据: {rawData && rawData.length > 0 ? '已上传' : '未上传'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full mr-2 ${goalData && isGoalDataComplete(goalData) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={goalData && isGoalDataComplete(goalData) ? 'text-green-700' : 'text-red-700'}>
                        目标数据: {goalData && isGoalDataComplete(goalData) ? '已填写完整' : '未填写或不完整'}
                      </span>
                    </div>
                  </div>
                  {(!goalData || !isGoalDataComplete(goalData)) && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded p-2">
                      ⚠️ 请先在"目标达成"页面填写完整的目标数据后再创建快照
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!rawData || rawData.length === 0 || !goalData || !isGoalDataComplete(goalData)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    rawData && rawData.length > 0 && goalData && isGoalDataComplete(goalData)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;