import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend,
  onClick
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          
          {trend && (
            <div className="mt-2 flex items-center">
              <span 
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-gray-500 text-sm ml-1">{trend.label}</span>
            </div>
          )}
          
          {description && (
            <p className="mt-1 text-gray-500 text-sm">{description}</p>
          )}
        </div>
        
        {icon && (
          <div className="p-2 rounded-full bg-blue-50 text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;