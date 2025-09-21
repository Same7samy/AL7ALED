
import React, { useState, useEffect } from 'react';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  onChange: (range: DateRange) => void;
}

type Preset = 'today' | 'last7' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

const PresetButton: React.FC<{ label: string; preset: Preset, activePreset: Preset, onClick: (preset: Preset) => void }> = ({ label, preset, activePreset, onClick }) => (
    <button
      onClick={() => onClick(preset)}
      className={`px-3 py-1.5 text-xs rounded-md transition-colors flex-shrink-0 ${
        activePreset === preset ? 'bg-primary text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }`}
    >
      {label}
    </button>
);

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const [activePreset, setActivePreset] = useState<Preset>('thisMonth');
  const [showCustom, setShowCustom] = useState(false);

  const [customStart, setCustomStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  const calculateRange = (preset: Preset): DateRange => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  };

  useEffect(() => {
    // Initialize with default range
    onChange(calculateRange('thisMonth'));
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePresetClick = (preset: Preset) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      setShowCustom(true);
      // Don't call onChange until custom dates are confirmed
    } else {
      setShowCustom(false);
      onChange(calculateRange(preset));
    }
  };
  
  const handleCustomDateChange = () => {
     if (customStart && customEnd) {
       onChange(calculateRange('custom'));
     }
  };

  return (
    <div className="bg-white p-2 rounded-lg shadow-md space-y-2">
       <div className="overflow-hidden relative">
        <div 
            className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar"
        >
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            <PresetButton label="اليوم" preset="today" activePreset={activePreset} onClick={handlePresetClick} />
            <PresetButton label="آخر 7 أيام" preset="last7" activePreset={activePreset} onClick={handlePresetClick} />
            <PresetButton label="هذا الشهر" preset="thisMonth" activePreset={activePreset} onClick={handlePresetClick} />
            <PresetButton label="الشهر الماضي" preset="lastMonth" activePreset={activePreset} onClick={handlePresetClick} />
            <PresetButton label="هذا العام" preset="thisYear" activePreset={activePreset} onClick={handlePresetClick} />
            <PresetButton label="مخصص" preset="custom" activePreset={activePreset} onClick={handlePresetClick} />
        </div>
      </div>

      {showCustom && (
        <div className="pt-2 border-t flex flex-col sm:flex-row gap-2 items-center justify-center">
            <input 
              type="date" 
              value={customStart} 
              onChange={e => setCustomStart(e.target.value)} 
              className="p-1.5 text-sm border rounded-md w-full sm:w-auto"
            />
             <span className="text-slate-500 text-sm">إلى</span>
            <input 
              type="date" 
              value={customEnd} 
              onChange={e => setCustomEnd(e.target.value)} 
              className="p-1.5 text-sm border rounded-md w-full sm:w-auto"
            />
            <button onClick={handleCustomDateChange} className="bg-slate-600 text-white px-3 py-1.5 rounded-md text-xs w-full sm:w-auto">تطبيق</button>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
