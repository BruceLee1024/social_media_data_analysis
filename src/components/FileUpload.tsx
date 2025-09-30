import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, FileText, X } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedFiles: File[];
  onRemoveFile: (index: number) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  acceptedFiles,
  onRemoveFile,
  isProcessing
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['xlsx', 'xls', 'csv'].includes(extension || '');
    });
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = '';
  }, [onFilesSelected]);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    return extension === 'csv' ? FileText : FileSpreadsheet;
  };

  const getPlatformBadge = (fileName: string) => {
    const name = fileName.toLowerCase();
    if (name.includes('抖音') || name.includes('douyin') || name.includes('dy')) {
      return <span className="px-2 py-1 text-xs bg-black text-white rounded-full">抖音</span>;
    }
    if (name.includes('视频号') || name.includes('weixin') || name.includes('wx')) {
      return <span className="px-2 py-1 text-xs bg-green-600 text-white rounded-full">视频号</span>;
    }
    if (name.includes('小红书') || name.includes('xiaohongshu') || name.includes('xhs')) {
      return <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">小红书</span>;
    }
    return <span className="px-2 py-1 text-xs bg-gray-500 text-white rounded-full">未识别</span>;
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isProcessing}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            拖拽文件到这里或点击上传
          </p>
          <p className="text-sm text-gray-500 mb-4">
            支持 .xlsx、.xls、.csv 格式，最大 50MB
          </p>
          <p className="text-xs text-gray-400">
            支持同时上传多个平台的数据文件
          </p>
        </label>
      </div>

      {acceptedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">已选择的文件:</h4>
          {acceptedFiles.map((file, index) => {
            const FileIcon = getFileIcon(file.name);
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {getPlatformBadge(file.name)}
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;