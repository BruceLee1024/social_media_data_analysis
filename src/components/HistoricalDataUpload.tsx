import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Clock, CheckCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { UnifiedData } from '../types';
import { FileProcessor } from '../utils/fileProcessor';
import { DataProcessor } from '../utils/dataProcessor';
import { PlatformData } from '../types';

interface HistoricalDataUploadProps {
  historicalData: UnifiedData[];
  onHistoricalDataLoaded: (data: UnifiedData[]) => void;
  isProcessing: boolean;
}

interface PendingFile {
  file: File;
  sheetNames: string[];
  selectedSheet?: string;
  needsSheetSelection: boolean;
}

const HistoricalDataUpload: React.FC<HistoricalDataUploadProps> = ({
  historicalData,
  onHistoricalDataLoaded,
  isProcessing: parentProcessing,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(f => {
      const ext = f.name.toLowerCase().split('.').pop();
      return ['xlsx', 'xls', 'csv'].includes(ext || '');
    });

    for (const file of validFiles) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'xlsx' || ext === 'xls') {
        try {
          const sheetNames = await FileProcessor.getSheetNames(file);
          const needsSelection = sheetNames.length > 1;
          setPendingFiles(prev => [...prev, {
            file,
            sheetNames,
            selectedSheet: needsSelection ? undefined : sheetNames[0],
            needsSheetSelection: needsSelection,
          }]);
        } catch {
          setPendingFiles(prev => [...prev, {
            file,
            sheetNames: [],
            selectedSheet: undefined,
            needsSheetSelection: false,
          }]);
        }
      } else {
        setPendingFiles(prev => [...prev, {
          file,
          sheetNames: [],
          selectedSheet: undefined,
          needsSheetSelection: false,
        }]);
      }
    }
    setError('');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length > 0) addFiles(selected);
    e.target.value = '';
  }, [addFiles]);

  const handleSheetSelect = (index: number, sheetName: string) => {
    setPendingFiles(prev => prev.map((pf, i) =>
      i === index ? { ...pf, selectedSheet: sheetName } : pf
    ));
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processHistoricalFiles = async () => {
    const allReady = pendingFiles.every(pf =>
      !pf.needsSheetSelection || pf.selectedSheet
    );
    if (!allReady) {
      setError('请为所有多 Sheet 文件选择要使用的工作表');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const allData: UnifiedData[] = [];

      for (const pf of pendingFiles) {
        const rawData = await FileProcessor.processFile(pf.file, pf.selectedSheet);
        if (!rawData || rawData.length === 0) {
          throw new Error(`文件 ${pf.file.name} 没有有效数据`);
        }

        const headers = Object.keys(rawData[0] || {});
        const detectedPlatform = DataProcessor.detectPlatform(headers);
        if (!detectedPlatform) {
          throw new Error(`无法识别文件 ${pf.file.name} 的平台类型`);
        }

        const platformData: PlatformData = {
          platform: detectedPlatform,
          rawData,
          processedData: [],
          fileName: pf.file.name,
        };
        const result = DataProcessor.processData(platformData);
        allData.push(...result.data);
      }

      allData.sort((a, b) =>
        new Date(a.发布时间).getTime() - new Date(b.发布时间).getTime()
      );

      onHistoricalDataLoaded(allData);
      setPendingFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setProcessing(false);
    }
  };

  const clearHistoricalData = () => {
    onHistoricalDataLoaded([]);
    setPendingFiles([]);
    setError('');
  };

  // 已有历史数据的摘要
  const dataSummary = historicalData.length > 0 ? (() => {
    const platforms = [...new Set(historicalData.map(d => d.来源平台))];
    const dates = historicalData.map(d => d.发布时间).filter(Boolean).sort();
    return {
      count: historicalData.length,
      platforms,
      dateRange: dates.length > 0 ? {
        start: dates[0].slice(0, 10),
        end: dates[dates.length - 1].slice(0, 10),
      } : null,
    };
  })() : null;

  const busy = processing || parentProcessing;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          历史对比数据
        </h2>
        {historicalData.length > 0 && (
          <button
            onClick={clearHistoricalData}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            清除
          </button>
        )}
      </div>

      {/* 已加载的历史数据摘要 */}
      {dataSummary && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">已加载历史数据</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-amber-700">
            <div>数据量: <span className="font-semibold">{dataSummary.count} 条</span></div>
            <div>平台: <span className="font-semibold">{dataSummary.platforms.join('、')}</span></div>
            {dataSummary.dateRange && (
              <div className="col-span-2">
                时间范围: <span className="font-semibold">{dataSummary.dateRange.start} ~ {dataSummary.dateRange.end}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 ${
          dragOver
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
          id="historical-file-upload"
          disabled={busy}
        />
        <label htmlFor="historical-file-upload" className="cursor-pointer">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600 mb-1">
            上传历史数据文件
          </p>
          <p className="text-xs text-gray-400">
            用于同比对比分析（如去年全年数据）
          </p>
        </label>
      </div>

      {/* 待处理文件列表 */}
      {pendingFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {pendingFiles.map((pf, index) => (
            <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[180px]">
                    {pf.file.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  disabled={busy}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sheet 选择 */}
              {pf.needsSheetSelection && (
                <div className="mt-2">
                  <label className="text-xs text-gray-500 mb-1 block">
                    选择工作表 ({pf.sheetNames.length} 个可用):
                  </label>
                  <div className="relative">
                    <select
                      value={pf.selectedSheet || ''}
                      onChange={e => handleSheetSelect(index, e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 pr-7 bg-white text-gray-700 appearance-none focus:ring-1 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="">-- 请选择 --</option>
                      {pf.sheetNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={processHistoricalFiles}
            disabled={busy}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                导入历史数据
              </>
            )}
          </button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}
    </div>
  );
};

export default HistoricalDataUpload;
