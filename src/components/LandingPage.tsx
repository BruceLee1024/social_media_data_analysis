import React from 'react';
import { Database, FileText, RefreshCcw, BarChart3, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';

interface LandingPageProps {
  onNavigateToData: () => void;
}

/** 粒子数据，预计算避免渲染时抖动 */
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.7 + 3) % 100}%`,
  size: 2 + (i % 3),
  drift: `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 8)}px`,
  duration: `${4 + (i % 4) * 1.5}s`,
  delay: `${(i * 0.7) % 5}s`,
  color: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#3b82f6' : '#8b5cf6',
}));

/** 模拟数据条 */
const DATA_BARS = [
  { label: '播放量', width: '82%', delay: '0s', color: 'from-cyan-400 to-blue-500' },
  { label: '点赞量', width: '65%', delay: '0.2s', color: 'from-blue-400 to-indigo-500' },
  { label: '评论量', width: '48%', delay: '0.4s', color: 'from-indigo-400 to-purple-500' },
  { label: '收藏量', width: '71%', delay: '0.6s', color: 'from-purple-400 to-pink-500' },
  { label: '分享量', width: '55%', delay: '0.8s', color: 'from-pink-400 to-rose-500' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToData }) => {
  return (
    <div className="relative min-h-[calc(100vh-200px)] overflow-hidden rounded-2xl">
      {/* ===== 深色背景层 ===== */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />

      {/* 网格 */}
      <div className="absolute inset-0 tech-grid-bg opacity-60" />

      {/* 扫描线 */}
      <div className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line" />

      {/* 发光球体 */}
      <div className="absolute top-20 left-[15%] w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] animate-glow-breathe" />
      <div className="absolute top-60 right-[10%] w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] animate-glow-breathe animation-delay-2000" />
      <div className="absolute bottom-20 left-[40%] w-72 h-72 rounded-full bg-purple-600/10 blur-[100px] animate-glow-breathe animation-delay-4000" />

      {/* 上升粒子 */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 rounded-full animate-particle-rise"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            '--drift': p.drift,
            '--duration': p.duration,
            '--delay': p.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* ===== 内容 ===== */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full container mx-auto px-4 py-16">

        {/* --- Hero --- */}
        <div className="text-center mb-16 max-w-4xl animate-fade-up-in">
          {/* 脉冲环 Logo */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
            <div className="absolute inset-0 border-2 border-cyan-400/40 rounded-2xl animate-ring-pulse" />
            <div className="absolute inset-2 border border-blue-400/30 rounded-xl animate-ring-pulse animation-delay-1000" />
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.4)]">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400 mb-4 leading-tight tracking-tight animate-gradient" style={{ backgroundSize: '200% 200%' }}>
            智能数据整合
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-200/80 mb-6">
            多平台数据<span className="text-cyan-400">·</span>一键统一<span className="text-cyan-400">·</span>深度洞察
          </h2>

          {/* 描述 */}
          <p className="text-lg text-blue-100/60 max-w-2xl mx-auto leading-relaxed mb-10">
            支持 <span className="text-cyan-400 font-medium">抖音</span>、<span className="text-green-400 font-medium">视频号</span>、<span className="text-pink-400 font-medium">小红书</span> 数据文件，
            智能识别平台类型，自动统一字段格式，让您专注于数据洞察
          </p>

          {/* CTA */}
          <button
            onClick={onNavigateToData}
            className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
          >
            {/* 按钮背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 transition-all duration-300 group-hover:from-cyan-500 group-hover:to-blue-500" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-cyan-400/20 to-purple-400/20" />
            <span className="relative flex items-center">
              开始数据整合
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        {/* --- 特性标签 --- */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 animate-fade-up-in" style={{ animationDelay: '0.2s' }}>
          {[
            { icon: Zap, text: '智能识别', color: 'cyan' },
            { icon: RefreshCcw, text: '自动处理', color: 'blue' },
            { icon: Shield, text: '数据安全', color: 'indigo' },
            { icon: TrendingUp, text: '深度分析', color: 'purple' },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm font-medium text-blue-100/80 hover:bg-white/10 transition-colors">
              <Icon className={`w-4 h-4 text-${color}-400`} />
              {text}
            </div>
          ))}
        </div>

        {/* --- 两列布局：步骤 + 数据可视化 --- */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

          {/* 左列 — 三步卡片 */}
          <div className="space-y-5 animate-fade-up-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-xl font-bold text-blue-100/90 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
              三步完成数据整合
            </h3>

            {[
              {
                step: '01',
                icon: FileText,
                title: '上传文件',
                desc: '拖拽或选择 Excel / CSV 文件，支持多文件同时上传',
                gradient: 'from-cyan-500/20 to-cyan-600/10',
                border: 'border-cyan-500/20',
                iconBg: 'from-cyan-500 to-cyan-600',
              },
              {
                step: '02',
                icon: RefreshCcw,
                title: '智能处理',
                desc: '自动识别平台、清洗数据、统一字段格式',
                gradient: 'from-blue-500/20 to-blue-600/10',
                border: 'border-blue-500/20',
                iconBg: 'from-blue-500 to-blue-600',
              },
              {
                step: '03',
                icon: BarChart3,
                title: '分析导出',
                desc: '生成可视化分析报告，一键导出标准化数据',
                gradient: 'from-purple-500/20 to-purple-600/10',
                border: 'border-purple-500/20',
                iconBg: 'from-purple-500 to-purple-600',
              },
            ].map(({ step, icon: Icon, title, desc, gradient, border, iconBg }) => (
              <div
                key={step}
                className={`group relative flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r ${gradient} border ${border} backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:translate-x-1`}
              >
                {/* 步骤序号 */}
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-xs font-bold text-blue-300/60 font-mono">
                  {step}
                </div>
                {/* 图标 */}
                <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${iconBg} rounded-lg flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {/* 文字 */}
                <div>
                  <h4 className="text-base font-semibold text-blue-50 mb-1">{title}</h4>
                  <p className="text-sm text-blue-200/50 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 右列 — 模拟数据面板 */}
          <div className="animate-fade-up-in" style={{ animationDelay: '0.6s' }}>
            <div className="tech-card-glow rounded-2xl overflow-hidden">
              <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl">
                {/* 面板标题栏 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs font-mono text-blue-300/40 ml-2">data_analytics.panel</span>
                  </div>
                  <span className="text-xs text-cyan-400/60 font-mono">LIVE</span>
                </div>

                {/* 模拟统计数字 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: '总数据量', value: '12,847', color: 'text-cyan-400' },
                    { label: '平台覆盖', value: '3', color: 'text-blue-400' },
                    { label: '完整度', value: '96.2%', color: 'text-purple-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-3 rounded-lg bg-white/5">
                      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
                      <div className="text-xs text-blue-300/40 mt-1">{label}</div>
                    </div>
                  ))}
                </div>

                {/* 模拟数据条 */}
                <div className="space-y-3">
                  {DATA_BARS.map(({ label, width, delay, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-200/50 font-mono">{label}</span>
                        <span className="text-blue-300/30 font-mono">{width.replace('%', '')}K</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full animate-bar-extend`}
                          style={{ '--bar-width': width, '--bar-delay': delay } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部模拟日志 */}
                <div className="mt-6 p-3 bg-black/30 rounded-lg font-mono text-xs space-y-1.5">
                  <div className="text-green-400/70"><span className="text-blue-400/50">[INFO]</span> 平台识别完成：抖音</div>
                  <div className="text-green-400/70"><span className="text-blue-400/50">[INFO]</span> 字段映射：18/18 ✓</div>
                  <div className="text-cyan-400/70"><span className="text-blue-400/50">[DONE]</span> 数据标准化完成</div>
                  <div className="flex items-center gap-1 text-blue-300/40">
                    <span>›</span>
                    <span className="w-1.5 h-4 bg-cyan-400/80 animate-cursor-blink" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 支持平台 --- */}
        <div className="w-full max-w-4xl animate-fade-up-in" style={{ animationDelay: '0.8s' }}>
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-blue-100/80">支持的数据平台</h4>
            <p className="text-sm text-blue-200/40 mt-1">覆盖主流内容创作和营销平台</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: '抖音',
                format: 'Excel',
                icon: '🎵',
                gradient: 'from-slate-800 to-slate-900',
                border: 'border-slate-600/30',
                glow: 'hover:shadow-[0_0_30px_rgba(100,116,139,0.2)]',
              },
              {
                name: '视频号',
                format: 'CSV',
                icon: '📱',
                gradient: 'from-emerald-900/60 to-green-950/60',
                border: 'border-emerald-500/20',
                glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
              },
              {
                name: '小红书',
                format: 'Excel',
                icon: '📖',
                gradient: 'from-rose-900/60 to-pink-950/60',
                border: 'border-rose-500/20',
                glow: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
              },
            ].map(({ name, format, icon, gradient, border, glow }) => (
              <div
                key={name}
                className={`flex items-center justify-center gap-3 p-5 rounded-xl bg-gradient-to-r ${gradient} border ${border} backdrop-blur-sm transition-all duration-300 hover:scale-105 ${glow}`}
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <span className="text-base font-semibold text-blue-50">{name}</span>
                  <span className="text-xs text-blue-300/40 ml-2">({format})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
