import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FolderOpen, 
  Download, 
  Upload, 
  Trash2, 
  Camera, 
  Clock, 
  Database, 
  HardDrive,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  FileText
} from 'lucide-react';
import { SnapshotManager, SnapshotData, SnapshotMetadata } from '../utils/snapshotManager';
import { UnifiedData, AnalyticsData } from '../types';

interface SnapshotManagerProps {
  processedData: UnifiedData[];
  analytics: AnalyticsData | null;
  summary: any;
  goalData?: any;
  onLoadSnapshot: (data: UnifiedData[], analytics: AnalyticsData | null, summary: any, goalData?: any) => void;
}

interface CreateSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
}

const CreateSnapshotModal: React.FC<CreateSnapshotModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Camera className="w-5 h-5 mr-2 text-blue-600" />
            创建数据快照
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              快照名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入快照名称"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="添加快照描述"
              rows={3}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存快照
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SnapshotManagerComponent: React.FC<SnapshotManagerProps> = ({
  processedData,
  analytics,
  summary,
  goalData,
  onLoadSnapshot
}) => {
  const [snapshots, setSnapshots] = useState<Record<string, SnapshotMetadata>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 });

  // 加载快照列表
  const loadSnapshots = () => {
    const snapshotData = SnapshotManager.getAllSnapshotMetadata();
    setSnapshots(snapshotData);
    setStorageUsage(SnapshotManager.getStorageUsage());
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 创建快照
  const handleCreateSnapshot = (name: string, description?: string) => {
    try {
      const snapshot = SnapshotManager.createSnapshot(
        processedData,
        analytics,
        summary,
        name,
        description,
        goalData
      );
      
      const success = SnapshotManager.saveSnapshot(snapshot);
      if (success) {
        loadSnapshots();
        showMessage('success', '快照保存成功！');
      } else {
        showMessage('error', '快照保存失败，请检查存储空间');
      }
    } catch (error) {
      showMessage('error', '创建快照时发生错误');
    }
  };

  // 加载快照
  const handleLoadSnapshot = (id: string) => {
    try {
      const snapshot = SnapshotManager.getSnapshot(id);
      console.log('Loading snapshot:', snapshot);
      if (snapshot) {
        console.log('Snapshot data:', snapshot.data);
        console.log('Goal data in snapshot:', snapshot.data.goalData);
        onLoadSnapshot(
          snapshot.data.processedData,
          snapshot.data.analytics,
          snapshot.data.summary,
          snapshot.data.goalData
        );
        showMessage('success', '快照加载成功！');
      } else {
        showMessage('error', '快照不存在或已损坏');
      }
    } catch (error) {
      console.error('加载快照时发生错误:', error);
      showMessage('error', '加载快照时发生错误');
    }
  };

  // 导出快照
  const handleExportSnapshot = (id: string) => {
    try {
      const snapshot = SnapshotManager.getSnapshot(id);
      if (snapshot) {
        SnapshotManager.exportSnapshot(snapshot);
        showMessage('success', '快照导出成功！');
      } else {
        showMessage('error', '快照不存在');
      }
    } catch (error) {
      showMessage('error', '导出快照时发生错误');
    }
  };

  // 删除快照
  const handleDeleteSnapshot = (id: string) => {
    if (window.confirm('确定要删除这个快照吗？此操作不可恢复。')) {
      try {
        const success = SnapshotManager.deleteSnapshot(id);
        if (success) {
          loadSnapshots();
          showMessage('success', '快照删除成功！');
        } else {
          showMessage('error', '删除快照失败');
        }
      } catch (error) {
        showMessage('error', '删除快照时发生错误');
      }
    }
  };

  // 导入快照
  const handleImportSnapshot = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      SnapshotManager.importSnapshot(file)
        .then((snapshot) => {
          if (snapshot) {
            const success = SnapshotManager.saveSnapshot(snapshot);
            if (success) {
              loadSnapshots();
              showMessage('success', '快照导入成功！');
            } else {
              showMessage('error', '保存导入的快照失败');
            }
          }
        })
        .catch((error) => {
          showMessage('error', `导入失败: ${error.message}`);
        });
    }
    // 清空文件输入
    event.target.value = '';
  };

  const snapshotList = Object.values(snapshots).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* 标题和操作按钮 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Database className="w-6 h-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">数据快照管理</h2>
            <p className="text-sm text-gray-600">保存和管理您的数据分析快照</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={processedData.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建快照
          </button>
          
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            导入快照
            <input
              type="file"
              accept=".json"
              onChange={handleImportSnapshot}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 存储使用情况 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <HardDrive className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">存储使用情况</span>
          </div>
          <span className="text-sm text-gray-600">
            {SnapshotManager.formatFileSize(storageUsage.used)} / {SnapshotManager.formatFileSize(storageUsage.total)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              storageUsage.percentage > 80 ? 'bg-red-500' :
              storageUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          已使用 {storageUsage.percentage.toFixed(1)}%
        </p>
      </div>

      {/* 快照列表 */}
      <div className="space-y-3">
        {snapshotList.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无保存的快照</p>
            <p className="text-sm text-gray-400 mt-1">创建快照来保存当前的数据分析结果</p>
          </div>
        ) : (
          snapshotList.map((snapshot) => (
            <div
              key={snapshot.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Camera className="w-4 h-4 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-900">{snapshot.name}</h3>
                  </div>
                  
                  {snapshot.description && (
                    <p className="text-sm text-gray-600 mb-2">{snapshot.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {SnapshotManager.formatDate(snapshot.timestamp)}
                    </div>
                    <div className="flex items-center">
                      <Database className="w-3 h-3 mr-1" />
                      {snapshot.totalRecords} 条记录
                    </div>
                    <div className="flex items-center">
                      <HardDrive className="w-3 h-3 mr-1" />
                      {SnapshotManager.formatFileSize(snapshot.fileSize)}
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500 mr-2">平台:</span>
                    {snapshot.platforms.map((platform, index) => (
                      <span
                        key={platform}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleLoadSnapshot(snapshot.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="加载快照"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExportSnapshot(snapshot.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="导出快照"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSnapshot(snapshot.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除快照"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 创建快照模态框 */}
      <CreateSnapshotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateSnapshot}
      />
    </div>
  );
};

export default SnapshotManagerComponent;