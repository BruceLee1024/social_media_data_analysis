import React from 'react';

export interface PlatformStyle {
  gradient: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const DefaultIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

export const PLATFORM_STYLES: Record<string, PlatformStyle> = {
  抖音: {
    gradient: 'from-gray-900 to-gray-700',
    bgGradient: 'from-gray-50 to-slate-50',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  视频号: {
    gradient: 'from-green-600 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .356-.124.657-.373.906z" />
      </svg>
    ),
  },
  小红书: {
    gradient: 'from-red-600 to-rose-500',
    bgGradient: 'from-red-50 to-rose-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  快手: {
    gradient: 'from-orange-500 to-yellow-500',
    bgGradient: 'from-orange-50 to-yellow-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 3L4 14h6l-2 7 9-11h-6l2-7z" />
      </svg>
    ),
  },
  微博: {
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
      </svg>
    ),
  },
  B站: {
    gradient: 'from-pink-500 to-purple-500',
    bgGradient: 'from-pink-50 to-purple-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .356-.124.657-.373.906zM6.720 15.96c.906.234 1.896.234 2.955 0 .234.906.468 1.813.702 2.72h-4.36c.234-.907.468-1.814.703-2.72zm10.56 0c.234.906.468 1.813.702 2.72h-4.36c.234-.907.468-1.814.702-2.72.906.234 1.896.234 2.956 0z" />
      </svg>
    ),
  },
};

const DEFAULT_STYLE: PlatformStyle = {
  gradient: 'from-gray-500 to-slate-500',
  bgGradient: 'from-gray-50 to-slate-50',
  textColor: 'text-gray-700',
  borderColor: 'border-gray-200',
  icon: <DefaultIcon />,
};

export const getPlatformStyle = (platform: string): PlatformStyle =>
  PLATFORM_STYLES[platform] ?? DEFAULT_STYLE;
