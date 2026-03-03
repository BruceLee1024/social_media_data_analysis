import React, { useEffect, useState } from 'react';
import { KeyRound, X, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getDeepSeekApiKey, setDeepSeekApiKey } from '../utils/deepseekApi';

interface AISettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ open, onClose }) => {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setKey(getDeepSeekApiKey());
    setSaved(false);
    setError('');
  }, [open]);

  if (!open) return null;

  const save = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('请输入 DeepSeek API Key');
      setSaved(false);
      return;
    }
    // 很轻的格式校验：避免误填
    if (trimmed.length < 10) {
      setError('Key 长度看起来不正确，请检查');
      setSaved(false);
      return;
    }
    setDeepSeekApiKey(trimmed);
    setSaved(true);
    setError('');
    setTimeout(() => setSaved(false), 2000);
  };

  const clear = () => {
    setDeepSeekApiKey('');
    setKey('');
    setSaved(false);
    setError('已清除');
    setTimeout(() => setError(''), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-semibold text-gray-900">AI 设置（DeepSeek）</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="text-xs text-gray-500 leading-relaxed">
            API Key 只保存在本地浏览器（localStorage），不会上传到服务器。
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DeepSeek API Key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="请输入 DeepSeek API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              type="password"
              autoFocus
            />
          </div>

          {(saved || error) && (
            <div className={`text-sm rounded-lg px-3 py-2 flex items-center gap-2 ${
              saved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{saved ? '已保存' : error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 bg-white rounded-lg hover:bg-gray-50"
              title="清除本地 Key"
            >
              <Trash2 className="w-4 h-4" />
              清除
            </button>
            <button
              onClick={save}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettingsModal;
