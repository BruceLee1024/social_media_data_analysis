import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UnifiedData } from '../types';
import { UNIFIED_FIELDS } from './fieldMapping';

export class DataExporter {
  static exportToExcel(data: UnifiedData[], fileName?: string): void {
    const wb = XLSX.utils.book_new();

    // Sheet1: 统一字段数据
    const unifiedData = data.map(row => {
      const result: any = {};
      UNIFIED_FIELDS.forEach(field => {
        result[field] = (row as any)[field] || '';
      });
      return result;
    });

    const ws1 = XLSX.utils.json_to_sheet(unifiedData);
    XLSX.utils.book_append_sheet(wb, ws1, '统一数据');

    // Sheet2: 扩展字段数据
    if (data.some(row => Object.keys(row.扩展字段).length > 0)) {
      const extendedData = data.map((row, index) => ({
        行号: index + 1,
        来源平台: row.来源平台,
        标题描述: row.标题描述,
        ...row.扩展字段,
      }));

      const ws2 = XLSX.utils.json_to_sheet(extendedData);
      XLSX.utils.book_append_sheet(wb, ws2, '扩展字段');
    }

    // Sheet3: 字段映射表
    const mappingData = [
      { 统一字段: '标题/描述', 抖音: '作品名称', 视频号: '视频描述', 小红书: '笔记标题' },
      { 统一字段: '发布时间', 抖音: '发布时间', 视频号: '发布时间', 小红书: '首次发布时间' },
      { 统一字段: '体裁/类型', 抖音: '体裁', 视频号: '-', 小红书: '体裁' },
      { 统一字段: '曝光量', 抖音: '-', 视频号: '推荐', 小红书: '曝光' },
      { 统一字段: '播放量', 抖音: '播放量', 视频号: '播放量', 小红书: '观看量' },
      { 统一字段: '点赞量', 抖音: '点赞量', 视频号: '喜欢', 小红书: '点赞' },
      { 统一字段: '评论量', 抖音: '评论量', 视频号: '评论量', 小红书: '评论' },
      { 统一字段: '收藏量', 抖音: '收藏量', 视频号: '-', 小红书: '收藏' },
      { 统一字段: '分享量', 抖音: '分享量', 视频号: '分享量', 小红书: '分享' },
      { 统一字段: '粉丝/关注增量', 抖音: '粉丝增量', 视频号: '关注量', 小红书: '涨粉' },
      { 统一字段: '完播率', 抖音: '完播率', 视频号: '完播率', 小红书: '-' },
      { 统一字段: '平均播放时长', 抖音: '平均播放时长', 视频号: '平均播放时长', 小红书: '人均观看时长' },
    ];

    const ws3 = XLSX.utils.json_to_sheet(mappingData);
    XLSX.utils.book_append_sheet(wb, ws3, '字段映射');

    // 生成文件名
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const finalFileName = fileName || `自媒体数据整合_${today}.xlsx`;

    // 导出文件
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, finalFileName);
  }

  static generateSummaryReport(data: UnifiedData[]): any {
    const platformStats = data.reduce((acc, row) => {
      const platform = row.来源平台;
      if (!acc[platform]) {
        acc[platform] = {
          count: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalFollowers: 0,
          avgCompletionRate: 0,
        };
      }
      
      acc[platform].count++;
      acc[platform].totalViews += row.播放量;
      acc[platform].totalLikes += row.点赞量;
      acc[platform].totalComments += row.评论量;
      acc[platform].totalFollowers += row.粉丝增量;
      // 根据平台转换完播率数据
      let completionRate = row.完播率;
      if (platform === '抖音' && typeof completionRate === 'number') {
        // 抖音：原始数据是小数，需要乘以100
        completionRate = completionRate * 100;
      }
      acc[platform].avgCompletionRate += completionRate;
      
      return acc;
    }, {} as Record<string, any>);

    // 计算平均值
    Object.values(platformStats).forEach((stats: any) => {
      stats.avgViews = stats.totalViews / stats.count;
      stats.avgLikes = stats.totalLikes / stats.count;
      stats.avgComments = stats.totalComments / stats.count;
      stats.avgCompletionRate = stats.avgCompletionRate / stats.count;
      
      // 计算平均互动数
      const totalInteractions = stats.totalLikes + stats.totalComments;
      stats.avgInteractions = totalInteractions / stats.count;
    });

    // 计算总涨粉数
    const totalFollowers = data.reduce((sum, row) => sum + row.粉丝增量, 0);

    return {
      总数据量: data.length,
      总涨粉数: totalFollowers,
      平台统计: platformStats,
      时间范围: {
        最早: data.reduce((min, row) => row.发布时间 < min ? row.发布时间 : min, data[0]?.发布时间 || ''),
        最晚: data.reduce((max, row) => row.发布时间 > max ? row.发布时间 : max, data[0]?.发布时间 || ''),
      },
    };
  }
}