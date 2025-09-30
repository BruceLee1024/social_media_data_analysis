import { UnifiedData, AnalyticsData } from '../types';

export interface SnapshotData {
  id: string;
  name: string;
  timestamp: string;
  description?: string;
  data: {
    processedData: UnifiedData[];
    analytics: AnalyticsData | null;
    summary: any;
    goalData?: any;
  };
  metadata: {
    totalRecords: number;
    platforms: string[];
    dateRange: {
      start: string;
      end: string;
    };
    fileSize: number;
  };
}

export interface SnapshotMetadata {
  id: string;
  name: string;
  timestamp: string;
  description?: string;
  totalRecords: number;
  platforms: string[];
  dateRange: {
    start: string;
    end: string;
  };
  fileSize: number;
}

export class SnapshotManager {
  private static readonly STORAGE_KEY = 'data_snapshots';
  private static readonly METADATA_KEY = 'snapshots_metadata';

  /**
   * 创建数据快照
   */
  static createSnapshot(
    processedData: UnifiedData[],
    analytics: AnalyticsData | null,
    summary: any,
    name: string,
    description?: string,
    goalData?: any
  ): SnapshotData {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    
    // 计算元数据
    const platforms = [...new Set(processedData.map(item => item.来源平台))];
    const dates = processedData
      .map(item => item.发布时间)
      .filter(date => date)
      .sort();
    
    const dateRange = {
      start: dates[0] || '',
      end: dates[dates.length - 1] || ''
    };

    const snapshot: SnapshotData = {
      id,
      name,
      timestamp,
      description,
      data: {
        processedData,
        analytics,
        summary,
        goalData
      },
      metadata: {
        totalRecords: processedData.length,
        platforms,
        dateRange,
        fileSize: this.calculateDataSize(processedData, analytics, summary, goalData)
      }
    };

    return snapshot;
  }

  /**
   * 保存快照到本地存储
   */
  static saveSnapshot(snapshot: SnapshotData): boolean {
    try {
      // 保存完整快照数据
      const existingSnapshots = this.getAllSnapshots();
      existingSnapshots[snapshot.id] = snapshot;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingSnapshots));

      // 保存快照元数据（用于快速列表显示）
      const metadata: SnapshotMetadata = {
        id: snapshot.id,
        name: snapshot.name,
        timestamp: snapshot.timestamp,
        description: snapshot.description,
        totalRecords: snapshot.metadata.totalRecords,
        platforms: snapshot.metadata.platforms,
        dateRange: snapshot.metadata.dateRange,
        fileSize: snapshot.metadata.fileSize
      };

      const existingMetadata = this.getAllSnapshotMetadata();
      existingMetadata[snapshot.id] = metadata;
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(existingMetadata));

      return true;
    } catch (error) {
      console.error('保存快照失败:', error);
      return false;
    }
  }

  /**
   * 获取所有快照元数据
   */
  static getAllSnapshotMetadata(): Record<string, SnapshotMetadata> {
    try {
      const stored = localStorage.getItem(this.METADATA_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('获取快照元数据失败:', error);
      return {};
    }
  }

  /**
   * 获取所有快照数据
   */
  static getAllSnapshots(): Record<string, SnapshotData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('获取快照数据失败:', error);
      return {};
    }
  }

  /**
   * 根据ID获取特定快照
   */
  static getSnapshot(id: string): SnapshotData | null {
    try {
      const snapshots = this.getAllSnapshots();
      return snapshots[id] || null;
    } catch (error) {
      console.error('获取快照失败:', error);
      return null;
    }
  }

  /**
   * 删除快照
   */
  static deleteSnapshot(id: string): boolean {
    try {
      // 删除完整数据
      const snapshots = this.getAllSnapshots();
      delete snapshots[id];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshots));

      // 删除元数据
      const metadata = this.getAllSnapshotMetadata();
      delete metadata[id];
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));

      return true;
    } catch (error) {
      console.error('删除快照失败:', error);
      return false;
    }
  }

  /**
   * 导出快照为JSON文件
   */
  static exportSnapshot(snapshot: SnapshotData): void {
    try {
      const dataStr = JSON.stringify(snapshot, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `snapshot_${snapshot.name}_${snapshot.timestamp.split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('导出快照失败:', error);
    }
  }

  /**
   * 从JSON文件导入快照
   */
  static importSnapshot(file: File): Promise<SnapshotData | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const snapshot: SnapshotData = JSON.parse(content);
          
          // 验证快照数据结构
          if (this.validateSnapshotStructure(snapshot)) {
            resolve(snapshot);
          } else {
            reject(new Error('无效的快照文件格式'));
          }
        } catch (error) {
          reject(new Error('解析快照文件失败'));
        }
      };
      
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 获取存储使用情况
   */
  static getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      const snapshots = localStorage.getItem(this.STORAGE_KEY);
      const metadata = localStorage.getItem(this.METADATA_KEY);
      
      if (snapshots) used += new Blob([snapshots]).size;
      if (metadata) used += new Blob([metadata]).size;
      
      // 估算localStorage总容量（通常为5-10MB）
      const total = 5 * 1024 * 1024; // 5MB
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('获取存储使用情况失败:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * 清理所有快照
   */
  static clearAllSnapshots(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.METADATA_KEY);
      return true;
    } catch (error) {
      console.error('清理快照失败:', error);
      return false;
    }
  }

  // 私有方法

  private static generateId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static calculateDataSize(
    processedData: UnifiedData[],
    analytics: AnalyticsData | null,
    summary: any,
    goalData?: any
  ): number {
    try {
      const dataStr = JSON.stringify({ processedData, analytics, summary, goalData });
      return new Blob([dataStr]).size;
    } catch (error) {
      console.error('计算数据大小失败:', error);
      return 0;
    }
  }

  private static validateSnapshotStructure(snapshot: any): snapshot is SnapshotData {
    return (
      snapshot &&
      typeof snapshot.id === 'string' &&
      typeof snapshot.name === 'string' &&
      typeof snapshot.timestamp === 'string' &&
      snapshot.data &&
      Array.isArray(snapshot.data.processedData) &&
      snapshot.metadata &&
      typeof snapshot.metadata.totalRecords === 'number' &&
      Array.isArray(snapshot.metadata.platforms)
    );
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化日期
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }
}