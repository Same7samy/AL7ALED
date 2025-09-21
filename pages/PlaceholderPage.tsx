
import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-96">
        <div className="text-6xl mb-4 text-blue-200">
            <i className="fa-solid fa-screwdriver-wrench fa-2x"></i>
        </div>
      <h2 className="text-2xl font-bold text-slate-700 mb-2">{title}</h2>
      <p className="text-slate-500">هذه الصفحة قيد الإنشاء حالياً.</p>
    </div>
  );
};

export default PlaceholderPage;