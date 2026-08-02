import { ChevronLeft, ChevronRight, Home } from "lucide-react";

export default function DateBar({ datesBar, selectedDate, setSelectedDate, viewStartDate, setViewStartDate }: any) {
  
  // HÀM HỖ TRỢ: Ép trình duyệt lấy đúng ngày địa phương (GMT+7) thay vì UTC
  const getLocalDateStr = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Lùi 7 ngày
  const handlePrev = () => {
    const d = new Date(viewStartDate);
    d.setDate(d.getDate() - 7);
    setViewStartDate(getLocalDateStr(d));
  };

  // Tiến 7 ngày
  const handleNext = () => {
    const d = new Date(viewStartDate);
    d.setDate(d.getDate() + 7);
    setViewStartDate(getLocalDateStr(d));
  };

  // Khi người dùng chọn ngày từ bộ lịch, nó sẽ tự động nhảy đến ngày đó luôn
  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      setViewStartDate(newDate);
      setSelectedDate(newDate);
    }
  };

  // Trở về ngày hôm nay (Lấy đúng giờ Việt Nam)
  const handleGoToday = () => {
    const today = getLocalDateStr(new Date());
    setViewStartDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm flex items-center px-2 shrink-0 h-14 z-20">
      
      {/* BẢNG ĐIỀU KHIỂN CỖ MÁY THỜI GIAN */}
      <div className="flex items-center gap-1.5 pr-3 mr-2 border-r border-slate-200 h-full">
         <button onClick={handleGoToday} className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition" title="Trở về Hôm nay">
           <Home size={16} />
         </button>
         
         <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={18}/></button>
         
         {/* Lịch Native siêu mượt */}
         <input 
           type="date" 
           value={viewStartDate}
           onChange={handleDatePick}
           className="text-xs font-bold border border-slate-300 rounded px-2 py-1 text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm hover:border-emerald-400"
         />
         
         <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={18}/></button>
      </div>

      {/* THANH SCROLL NGÀY THÁNG */}
      <div className="flex items-center overflow-x-auto hide-scrollbar flex-1 h-full">
        {datesBar.map((dateObj: any) => (
          <button key={dateObj.id} onClick={() => setSelectedDate(dateObj.id)} className={`flex flex-col items-center min-w-[70px] px-2 py-1.5 mx-0.5 rounded-lg border transition-all ${selectedDate === dateObj.id ? 'bg-emerald-100 border-emerald-500 text-emerald-800 shadow-md scale-105' : 'border-transparent text-slate-500 hover:bg-slate-100'}`}>
            <span className={`text-[10px] uppercase font-bold ${selectedDate === dateObj.id ? 'text-emerald-700' : ''}`}>{dateObj.isToday ? 'HÔM NAY' : dateObj.dayName}</span>
            <span className={`text-sm font-black ${selectedDate === dateObj.id ? 'text-emerald-900' : 'text-slate-700'}`}>{dateObj.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}