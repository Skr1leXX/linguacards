// frontend/src/components/common/Skeleton.tsx
import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'text' | 'image' | 'circle' | 'widget';
  className?: string;
  height?: string;
  width?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  type = 'text', 
  className = '', 
  height, 
  width 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const getSkeletonClasses = () => {
    let typeClasses = '';
    
    switch (type) {
      case 'card':
        typeClasses = 'p-6';
        break;
      case 'circle':
        typeClasses = 'rounded-full';
        break;
      case 'image':
        typeClasses = 'rounded-lg';
        break;
      case 'widget':
        typeClasses = 'rounded-xl p-6';
        break;
      default:
        typeClasses = 'rounded';
    }
    
    return `${baseClasses} ${typeClasses} ${className}`;
  };
  
  const style: React.CSSProperties = {};
  if (height) style.height = height;
  if (width) style.width = width;
  
  return <div className={getSkeletonClasses()} style={style}></div>;
};

// Специализированные скелетоны
export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-full">
            <Skeleton type="text" height="16px" width="96px" className="mb-2" />
            <Skeleton type="text" height="32px" width="64px" />
          </div>
          <Skeleton type="circle" height="48px" width="48px" />
        </div>
        <Skeleton type="text" height="16px" width="128px" />
      </div>
    ))}
  </div>
);

export const CardsSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Skeleton type="circle" height="40px" width="40px" />
          <div className="flex-1">
            <Skeleton type="text" height="20px" width="128px" className="mb-2" />
            <Skeleton type="text" height="16px" width="192px" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Скелетон для заголовка
export const HeaderSkeleton = () => (
  <div className="mb-8">
    <Skeleton type="text" height="32px" width="256px" className="mb-2" />
    <Skeleton type="text" height="16px" width="384px" />
  </div>
);

// Скелетон для быстрых действий
export const QuickActionsSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <Skeleton type="text" height="24px" width="128px" className="mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Skeleton type="circle" height="40px" width="40px" />
            <div>
              <Skeleton type="text" height="20px" width="96px" className="mb-1" />
              <Skeleton type="text" height="16px" width="144px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;