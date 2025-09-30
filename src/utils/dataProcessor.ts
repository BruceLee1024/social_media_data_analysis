import { PlatformData, UnifiedData, ProcessingResult } from '../types';
import { FIELD_MAPPINGS, UNIFIED_FIELDS } from './fieldMapping';

export class DataProcessor {
  static detectPlatform(headers: string[]): '抖音' | '视频号' | '小红书' | null {
    const headerSet = new Set(headers);
    
    if (headerSet.has('作品名称') && headerSet.has('播放量')) {
      return '抖音';
    }
    if (headerSet.has('视频描述') && headerSet.has('推荐')) {
      return '视频号';
    }
    if (headerSet.has('笔记标题') && headerSet.has('曝光')) {
      return '小红书';
    }
    
    return null;
  }

  static normalizeTimeFormat(timeStr: string): string {
    if (!timeStr) return '';
    
    // 尝试解析各种时间格式
    const patterns = [
      // 中文格式：2024年01月15日14时30分25秒
      /^(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2})时(\d{1,2})分(\d{1,2})秒$/,
      // 标准格式：2024-01-15 14:30:25
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
      // 日期格式：2024-01-15
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/,
      // 美式日期格式：01/15/2024
      /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,
    ];

    for (const pattern of patterns) {
      const match = timeStr.match(pattern);
      if (match) {
        if (pattern.source.includes('年')) {
          // 中文格式
          const [, year, month, day, hour, minute, second] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
        } else if (pattern.source.includes('\\s+')) {
          // 包含时间的格式
          const [, year, month, day, hour, minute, second] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
        } else if (match[3] && match[3].length === 4) {
          // MM/DD/YYYY 格式
          const [, month, day, year] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;
        } else {
          // YYYY-MM-DD 格式
          const [, year, month, day] = match;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;
        }
      }
    }

    return timeStr; // 无法解析时返回原字符串
  }

  static normalizeNumber(value: any): number {
    if (typeof value === 'number') return Math.max(0, value);
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return 0;
  }

  static normalizePercentage(value: any): number {
    if (typeof value === 'string' && value.includes('%')) {
      const parsed = parseFloat(value.replace('%', ''));
      return isNaN(parsed) ? 0 : Math.max(0, parsed);
    }
    return this.normalizeNumber(value);
  }

  static processData(platformData: PlatformData): ProcessingResult {
    const { platform, rawData } = platformData;
    const mapping = FIELD_MAPPINGS[platform];
    const processedData: UnifiedData[] = [];
    const errors: string[] = [];
    let validRows = 0;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        const unifiedRow: UnifiedData = {
          来源平台: platform,
          标题描述: '',
          发布时间: '',
          体裁类型: '',
          曝光量: 0,
          播放量: 0,
          点赞量: 0,
          评论量: 0,
          收藏量: 0,
          分享量: 0,
          粉丝增量: 0,
          完播率: 0,
          平均播放时长: 0,
          扩展字段: {},
        };

        // 映射统一字段
        for (const [originalField, unifiedField] of Object.entries(mapping)) {
          if (row[originalField] !== undefined) {
            const value = row[originalField];
            
            switch (unifiedField) {
              case '发布时间':
                unifiedRow.发布时间 = this.normalizeTimeFormat(String(value));
                break;
              case '完播率':
                unifiedRow.完播率 = this.normalizePercentage(value);
                break;
              default:
                if (typeof (unifiedRow as any)[unifiedField] === 'number') {
                  (unifiedRow as any)[unifiedField] = this.normalizeNumber(value);
                } else {
                  (unifiedRow as any)[unifiedField] = String(value || '');
                }
            }
          }
        }

        // 处理扩展字段
        for (const [key, value] of Object.entries(row)) {
          if (!mapping[key]) {
            unifiedRow.扩展字段[key] = value;
          }
        }

        // 验证必要字段
        if (!unifiedRow.标题描述 && !unifiedRow.播放量) {
          errors.push(`第 ${i + 1} 行: 缺少必要字段（标题或播放量）`);
          continue;
        }

        processedData.push(unifiedRow);
        validRows++;
      } catch (error) {
        errors.push(`第 ${i + 1} 行处理错误: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return {
      success: errors.length === 0,
      data: processedData,
      errors,
      summary: {
        totalRows: rawData.length,
        validRows,
        invalidRows: rawData.length - validRows,
      },
    };
  }
}