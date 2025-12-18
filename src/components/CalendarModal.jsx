import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarModal({ isOpen, onClose, selectedDate, onSelect }) {
  // Parsing tanggal awal dari props selectedDate (YYYY-MM-DD)
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (isOpen && selectedDate) {
        setViewDate(new Date(selectedDate));
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setViewDate(curr => new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(curr => new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  
  // Logic Generasi Kalender
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    // 0 = Sunday, 1 = Monday. We want Monday as start usually for ID? 
    // Let's stick to standard Sunday start for visual balance or Monday based on preference.
    // ID uses Monday usually? Let's assume standardized US style (Sunday start) is common in apps,
    // BUT Indonesia standard is Monday. Let's try Sunday first for standard grid, or adjust.
    // Let's use Sunday as start index 0.
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth); // 0-6

  // Array of days
  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Dates
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDateClick = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onSelect(dateStr);
    onClose();
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelected = (day) => {
    const selected = new Date(selectedDate);
    return day === selected.getDate() && currentMonth === selected.getMonth() && currentYear === selected.getFullYear();
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const weekDayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue-600" />
                Pilih Tanggal
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
            </button>
        </div>

        <div className="p-4">
            {/* Navigasi Bulan */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="font-bold text-slate-800 text-lg">
                    {monthNames[currentMonth]} {currentYear}
                </div>
                <button onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Grid Days Name */}
            <div className="grid grid-cols-7 mb-2">
                {weekDayNames.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-slate-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Dates */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                    if (day === null) {
                        return <div key={idx} className="aspect-square" />;
                    }
                    
                    const isCurrSelected = isSelected(day);
                    const isCurrToday = isToday(day);

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDateClick(day)}
                            className={`
                                aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all relative
                                ${isCurrSelected 
                                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                                    : isCurrToday 
                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold border border-blue-200'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }
                            `}
                        >
                            {day}
                            {isCurrToday && !isCurrSelected && (
                                <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Footer Jump to Today */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-center">
            <button 
                onClick={() => {
                    const today = new Date();
                    const dateStr = today.toISOString().split('T')[0];
                    onSelect(dateStr);
                    onClose();
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
                Kembali ke Hari Ini
            </button>
        </div>

      </div>
    </div>
  );
}
