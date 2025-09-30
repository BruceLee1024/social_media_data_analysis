import React, { useState } from 'react';
import { BarChart3, TrendingUp, FileText, Award, ChartBar, Users, Activity, Save } from 'lucide-react';
import { AnalyticsData, UnifiedData } from '../../types';
import OverviewCards from './OverviewCards';
import PlatformComparison from './PlatformComparison';
import TrendAnalysis from './TrendAnalysis';
import ContentAnalysis from './ContentAnalysis';
import EngagementAnalysis from './EngagementAnalysis';
import FollowerGrowthAnalysis from './FollowerGrowthAnalysis';
import ContentPerformanceHeatmap from './ContentPerformanceHeatmap';
import { SnapshotManager } from '../../utils/snapshotManager';

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
  summary?: any;
  rawData?: UnifiedData[];
  goalData?: any;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics, summary, rawData, goalData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'platform' | 'trend' | 'content' | 'engagement' | 'followers' | 'heatmap'>('overview');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

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
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        // 如果有summary数据，传递给OverviewCards
        if (summary) {
          return (
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
          );
        }
        return <OverviewCards metrics={analytics.performanceMetrics} />;

      case 'platform':
        return <PlatformComparison data={analytics.platformComparison} />;
      case 'trend':
        return <TrendAnalysis data={analytics.timeSeriesData} rawData={rawData} />;
      case 'content':
        return (
          <ContentAnalysis 
            contentTypes={analytics.contentTypeAnalysis}
            topContent={analytics.topContent}
          />
        );
      case 'engagement':
        return rawData ? <EngagementAnalysis data={rawData} /> : <div className="p-8 text-center text-gray-500">需要原始数据来显示互动分析</div>;
      case 'followers':
        return rawData ? <FollowerGrowthAnalysis data={rawData} /> : <div className="p-8 text-center text-gray-500">需要原始数据来显示粉丝增长分析</div>;
      case 'heatmap':
        return rawData ? <ContentPerformanceHeatmap data={rawData} /> : <div className="p-8 text-center text-gray-500">需要原始数据来显示时间热力图</div>;
      default:
        return <OverviewCards metrics={analytics.performanceMetrics} />;
    }
  };

  return (
    <div className="space-y-6 overflow-visible">
      {/* Header with Save Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">数据分析</h2>
        <div className="flex items-center space-x-3">
          {/* Save Status Indicator */}
          {saveStatus === 'saving' && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">保存中...</span>
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center text-green-600">
              <Save className="w-4 h-4 mr-2" />
              <span className="text-sm">保存成功</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <Save className="w-4 h-4 mr-2" />
              <span className="text-sm">保存失败</span>
            </div>
          )}
          
          {/* Save Snapshot Button */}
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!rawData || rawData.length === 0 || saveStatus === 'saving'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            保存快照
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96 overflow-visible">
        {renderContent()}
      </div>

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