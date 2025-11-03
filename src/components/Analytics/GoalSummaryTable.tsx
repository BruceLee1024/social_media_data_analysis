import React from 'react';
import { FileText, Users, Eye, Heart, Target, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { PerformanceMetrics } from '../../types';

interface GoalSummaryTableProps {
  metrics: PerformanceMetrics;
  goalData: any; // 从DetailedGoalDashboard传入的目标数据
}

interface TableRow {
  category: string;
  icon: React.ReactNode;
  items: {
    name: string;
    current: number;
    target: number;
    unit: string;
    percentage: number;
    status: 'excellent' | 'good' | 'warning' | 'danger';
  }[];
}

const GoalSummaryTable: React.FC<GoalSummaryTableProps> = ({ metrics, goalData }) => {
  // 计算完成率状态
  const getStatus = (percentage: number): 'excellent' | 'good' | 'warning' | 'danger' => {
    if (percentage >= 100) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border border-green-300';
      case 'good': return 'bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-800 border border-blue-300';
      case 'warning': return 'bg-gradient-to-r from-yellow-100 to-orange-200 text-yellow-800 border border-yellow-300';
      case 'danger': return 'bg-gradient-to-r from-red-100 to-rose-200 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  // 构建表格数据
  const tableData: TableRow[] = [
    {
      category: '内容创作目标',
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      items: [
        {
          name: '总视频数',
          current: goalData?.content?.totalVideos || 0,
          target: goalData?.contentGoals?.totalVideos || 0,
          unit: '个',
          percentage: goalData?.contentGoals?.totalVideos ? 
            Math.round((goalData.content.totalVideos / goalData.contentGoals.totalVideos) * 100) : 0,
          status: getStatus(goalData?.contentGoals?.totalVideos ? 
            Math.round((goalData.content.totalVideos / goalData.contentGoals.totalVideos) * 100) : 0)
        },
        {
          name: '访谈视频',
          current: goalData?.content?.interviewVideos || 0,
          target: goalData?.contentGoals?.interviewVideos || 0,
          unit: '个',
          percentage: goalData?.contentGoals?.interviewVideos ? 
            Math.round((goalData.content.interviewVideos / goalData.contentGoals.interviewVideos) * 100) : 0,
          status: getStatus(goalData?.contentGoals?.interviewVideos ? 
            Math.round((goalData.content.interviewVideos / goalData.contentGoals.interviewVideos) * 100) : 0)
        },
        {
          name: '其他视频',
          current: goalData?.content?.otherVideos || 0,
          target: goalData?.contentGoals?.otherVideos || 0,
          unit: '个',
          percentage: goalData?.contentGoals?.otherVideos ? 
            Math.round((goalData.content.otherVideos / goalData.contentGoals.otherVideos) * 100) : 0,
          status: getStatus(goalData?.contentGoals?.otherVideos ? 
            Math.round((goalData.content.otherVideos / goalData.contentGoals.otherVideos) * 100) : 0)
        },
        {
          name: '商业视频',
          current: goalData?.content?.businessVideos || 0,
          target: goalData?.contentGoals?.businessVideos || 0,
          unit: '个',
          percentage: goalData?.contentGoals?.businessVideos ? 
            Math.round((goalData.content.businessVideos / goalData.contentGoals.businessVideos) * 100) : 0,
          status: getStatus(goalData?.contentGoals?.businessVideos ? 
            Math.round((goalData.content.businessVideos / goalData.contentGoals.businessVideos) * 100) : 0)
        },
        {
          name: '引流视频',
          current: goalData?.content?.trafficVideos || 0,
          target: goalData?.contentGoals?.trafficVideos || 0,
          unit: '个',
          percentage: goalData?.contentGoals?.trafficVideos ? 
            Math.round((goalData.content.trafficVideos / goalData.contentGoals.trafficVideos) * 100) : 0,
          status: getStatus(goalData?.contentGoals?.trafficVideos ? 
            Math.round((goalData.content.trafficVideos / goalData.contentGoals.trafficVideos) * 100) : 0)
        }
      ]
    },
    {
      category: '粉丝增长目标',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      items: [
        {
          name: '抖音粉丝',
          current: goalData?.fans?.douyin || 0,
          target: goalData?.fansGoals?.douyin || 0,
          unit: '人',
          percentage: goalData?.fansGoals?.douyin ? 
            Math.round((goalData.fans.douyin / goalData.fansGoals.douyin) * 100) : 0,
          status: getStatus(goalData?.fansGoals?.douyin ? 
            Math.round((goalData.fans.douyin / goalData.fansGoals.douyin) * 100) : 0)
        },
        {
          name: '视频号粉丝',
          current: goalData?.fans?.shipinhao || 0,
          target: goalData?.fansGoals?.shipinhao || 0,
          unit: '人',
          percentage: goalData?.fansGoals?.shipinhao ? 
            Math.round((goalData.fans.shipinhao / goalData.fansGoals.shipinhao) * 100) : 0,
          status: getStatus(goalData?.fansGoals?.shipinhao ? 
            Math.round((goalData.fans.shipinhao / goalData.fansGoals.shipinhao) * 100) : 0)
        },
        {
          name: '小红书粉丝',
          current: goalData?.fans?.xiaohongshu || 0,
          target: goalData?.fansGoals?.xiaohongshu || 0,
          unit: '人',
          percentage: goalData?.fansGoals?.xiaohongshu ? 
            Math.round((goalData.fans.xiaohongshu / goalData.fansGoals.xiaohongshu) * 100) : 0,
          status: getStatus(goalData?.fansGoals?.xiaohongshu ? 
            Math.round((goalData.fans.xiaohongshu / goalData.fansGoals.xiaohongshu) * 100) : 0)
        },
        {
          name: '粉丝总计',
          current: goalData?.fans?.total || 0,
          target: goalData?.fansGoals?.total || 0,
          unit: '人',
          percentage: goalData?.fansGoals?.total ? 
            Math.round((goalData.fans.total / goalData.fansGoals.total) * 100) : 0,
          status: getStatus(goalData?.fansGoals?.total ? 
            Math.round((goalData.fans.total / goalData.fansGoals.total) * 100) : 0)
        }
      ]
    },
    {
      category: '播放与互动目标',
      icon: <Eye className="w-5 h-5 text-green-600" />,
      items: [
        {
          name: '总播放量',
          current: goalData?.engagement?.totalViews || 0,
          target: goalData?.engagementGoals?.totalViews || 0,
          unit: '次',
          percentage: goalData?.engagementGoals?.totalViews ? 
            Math.round((goalData.engagement.totalViews / goalData.engagementGoals.totalViews) * 100) : 0,
          status: getStatus(goalData?.engagementGoals?.totalViews ? 
            Math.round((goalData.engagement.totalViews / goalData.engagementGoals.totalViews) * 100) : 0)
        },
        {
          name: '爆款视频数',
          current: goalData?.engagement?.viralCount || 0,
          target: goalData?.engagementGoals?.viralCount || 0,
          unit: '个',
          percentage: goalData?.engagementGoals?.viralCount ? 
            Math.round((goalData.engagement.viralCount / goalData.engagementGoals.viralCount) * 100) : 0,
          status: getStatus(goalData?.engagementGoals?.viralCount ? 
            Math.round((goalData.engagement.viralCount / goalData.engagementGoals.viralCount) * 100) : 0)
        },
        {
          name: '总互动量',
          current: goalData?.engagement?.totalInteractions || 0,
          target: goalData?.engagementGoals?.totalInteractions || 0,
          unit: '次',
          percentage: goalData?.engagementGoals?.totalInteractions ? 
            Math.round((goalData.engagement.totalInteractions / goalData.engagementGoals.totalInteractions) * 100) : 0,
          status: getStatus(goalData?.engagementGoals?.totalInteractions ? 
            Math.round((goalData.engagement.totalInteractions / goalData.engagementGoals.totalInteractions) * 100) : 0)
        },
        {
          name: '完播率',
          current: goalData?.engagement?.completionRate || 0,
          target: goalData?.engagementGoals?.completionRate || 0,
          unit: '%',
          percentage: goalData?.engagementGoals?.completionRate ? 
            Math.round((goalData.engagement.completionRate / goalData.engagementGoals.completionRate) * 100) : 0,
          status: getStatus(goalData?.engagementGoals?.completionRate ? 
            Math.round((goalData.engagement.completionRate / goalData.engagementGoals.completionRate) * 100) : 0)
        }
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg border border-slate-200">
      {/* 标题区域 */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            目标完成情况总览
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-600 ml-11 sm:ml-14">
          各项目标的完成进度和统计分析
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg bg-white mb-6 sm:mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px] lg:min-w-0">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left p-3 sm:p-4 lg:p-5 font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10">目标类别</th>
                <th className="text-left p-3 sm:p-4 lg:p-5 font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide min-w-[120px]">指标名称</th>
                <th className="text-center p-3 sm:p-4 lg:p-5 font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide min-w-[100px]">当前值</th>
                <th className="text-center p-3 sm:p-4 lg:p-5 font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide min-w-[100px]">目标值</th>
                <th className="text-center p-3 sm:p-4 lg:p-5 font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide min-w-[150px]">完成率</th>
                <th className="text-center p-3 sm:p-4 lg:p-5 font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wide min-w-[100px]">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableData.map((category, categoryIndex) => (
                category.items.map((item, itemIndex) => (
                  <tr key={`${categoryIndex}-${itemIndex}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                    {itemIndex === 0 && (
                      <td 
                        className="p-3 sm:p-4 lg:p-5 align-top border-r border-gray-100 sticky left-0 bg-white group-hover:bg-gradient-to-r group-hover:from-blue-50 group-hover:to-indigo-50 z-10"
                        rowSpan={category.items.length}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                            {category.icon}
                          </div>
                          <span className="font-semibold text-gray-800 whitespace-nowrap text-xs sm:text-sm lg:text-base">{category.category}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-3 sm:p-4 lg:p-5 text-gray-700 font-medium">
                      <div className="whitespace-nowrap text-xs sm:text-sm lg:text-base">{item.name}</div>
                    </td>
                    <td className="p-3 sm:p-4 lg:p-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm sm:text-base lg:text-lg text-blue-600">
                          {item.current.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-xs">{item.unit}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 lg:p-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm sm:text-base lg:text-lg text-gray-700">
                          {item.target.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-xs">{item.unit}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 lg:p-5 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="relative w-16 sm:w-20 lg:w-24 bg-gray-200 rounded-full h-2 sm:h-2.5 lg:h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`absolute top-0 left-0 h-full rounded-full ${
                              item.status === 'excellent' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              item.status === 'good' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                              item.status === 'warning' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            style={{ 
                              width: `${Math.min(item.percentage, 100)}%`
                            } as React.CSSProperties}
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 lg:p-5 text-center">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs font-bold shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 whitespace-nowrap ${getStatusColor(item.status)}`}>
                        {item.status === 'excellent' && <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />}
                        {item.status === 'good' && <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />}
                        {item.status === 'warning' && <BarChart3 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />}
                        {item.status === 'danger' && <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />}
                        {item.status === 'excellent' ? '优秀' :
                         item.status === 'good' ? '良好' :
                         item.status === 'warning' ? '待改进' : '需关注'}
                      </span>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 统计摘要 */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '500ms'}}>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform animate-bounce-gentle">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-green-800 uppercase tracking-wide">优秀指标</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-green-900 mb-1 sm:mb-2 animate-number-count">
            {tableData.reduce((acc, category) => 
              acc + category.items.filter(item => item.status === 'excellent').length, 0
            )}
          </div>
          <div className="text-xs text-green-700 font-medium">表现卓越的指标数量</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '600ms'}}>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform animate-bounce-gentle">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-blue-800 uppercase tracking-wide">良好指标</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-900 mb-1 sm:mb-2 animate-number-count">
            {tableData.reduce((acc, category) => 
              acc + category.items.filter(item => item.status === 'good').length, 0
            )}
          </div>
          <div className="text-xs text-blue-700 font-medium">达到良好水平的指标</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '700ms'}}>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform animate-bounce-gentle">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-yellow-800 uppercase tracking-wide">待改进</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-900 mb-1 sm:mb-2 animate-number-count">
            {tableData.reduce((acc, category) => 
              acc + category.items.filter(item => item.status === 'warning').length, 0
            )}
          </div>
          <div className="text-xs text-yellow-700 font-medium">需要提升的指标数量</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 group animate-scale-in" style={{animationDelay: '800ms'}}>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform animate-bounce-gentle">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-red-800 uppercase tracking-wide">需关注</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-red-900 mb-1 sm:mb-2 animate-number-count">
            {tableData.reduce((acc, category) => 
              acc + category.items.filter(item => item.status === 'danger').length, 0
            )}
          </div>
          <div className="text-xs text-red-700 font-medium">急需关注的指标数量</div>
        </div>
      </div>
    </div>
  );
};

export default GoalSummaryTable;