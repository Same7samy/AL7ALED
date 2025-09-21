import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-3 rounded-lg shadow-md flex items-center space-x-3 space-x-reverse">
      <div className={`p-2.5 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-xs">{title}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;