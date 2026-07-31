import { useDraggable } from "@dnd-kit/core";
import { Settings, Phone, Clock, FileText, Coffee } from "lucide-react";

export default function DraggableBlock({ booking, displayDuration, isCarryOver, onOpenSettings }: any) {
  const isCheckout = booking.status === 'checkout';
  const isNotArrived = booking.status === 'not_arrived';
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id, data: booking, disabled: isCarryOver || isCheckout,
  });

  const actualDuration = displayDuration + (booking.extraTime || 0);
  const isMicro = actualDuration <= 0.5; // Khối 30 phút
  const isNormal = actualDuration > 0.5 && actualDuration <= 1.5; // Khối 1 giờ
  const isLarge = actualDuration > 1.5; // Khối từ 2 giờ trở lên
  
  let blockBg = 'bg-emerald-100 border-emerald-500';
  let textColor = 'text-emerald-900';
  let badgeColor = 'bg-emerald-500';
  let statusText = 'ĐANG Ở';
  let priceColor = 'text-rose-600';

  if (isCheckout) { 
    blockBg = 'bg-slate-200 border-slate-400 opacity-90'; textColor = 'text-slate-700'; badgeColor = 'bg-slate-500'; statusText = 'OUT'; priceColor = 'text-slate-500';
  } else if (isNotArrived) { 
    blockBg = 'bg-amber-100 border-amber-500'; textColor = 'text-amber-900'; badgeColor = 'bg-amber-500'; statusText = 'CHƯA ĐẾN'; 
  } else if (isCarryOver) { 
    blockBg = 'bg-indigo-50 border-indigo-300'; textColor = 'text-indigo-900'; statusText = 'QUA ĐÊM'; 
  }
  
  const checkInHour = booking.startHour !== null ? booking.startHour : 0;
  const checkInMinute = booking.startMinute || 0;
  const checkIn = booking.startHour !== null ? `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}` : '--:--';
  
  const totalMinutes = Math.round((booking.duration + (booking.extraTime || 0)) * 60);
  const outDate = new Date(2024, 0, 1, checkInHour, checkInMinute + totalMinutes);
  const checkOutHour = outDate.getHours();
  const checkOutMins = outDate.getMinutes();
  const checkOut = booking.startHour !== null ? `${checkOutHour.toString().padStart(2, '0')}:${checkOutMins.toString().padStart(2, '0')}${outDate.getDate() > 1 ? ' (+1)' : ''}` : '--:--';

  const serviceTotal = booking.services?.reduce((sum: number, s: any) => sum + s.price, 0) || 0;
  let finalPrice = booking.price + serviceTotal;
  finalPrice = Math.max(0, finalPrice + (booking.surcharge || 0) + (finalPrice * ((booking.surchargePercent || 0) / 100)) - (booking.discount || 0) - (finalPrice * ((booking.discountPercent || 0) / 100)));

  // Chiều cao 1 giờ = 60px
  const blockHeight = booking.roomId ? `${actualDuration * 60 - 1}px` : 'auto';
  const topOffset = (booking.roomId && booking.startMinute) ? `${(booking.startMinute / 60) * 60}px` : '0px';
  const positionClass = booking.roomId ? 'absolute left-0 w-full z-30' : 'relative w-full mb-3';
  
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50, height: blockHeight, top: topOffset } : { height: blockHeight, top: topOffset };

  // ==========================================
  // HIỂN THỊ KHỐI SIÊU NHỎ (30 PHÚT)
  // ==========================================
  if (isMicro && booking.roomId) {
    return (
      <div ref={setNodeRef} style={style} className={`${positionClass} flex items-center justify-between px-1 border rounded shadow-sm overflow-hidden ${blockBg} ${isDragging ? "opacity-70 scale-105" : "opacity-100"}`}>
        <div {...listeners} {...attributes} className="flex-1 flex items-center gap-1 overflow-hidden h-full cursor-grab">
           <span className={`text-[10px] font-black uppercase truncate ${textColor}`}>{booking.name}</span>
        </div>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onOpenSettings(booking.id)} className={`p-0.5 rounded ${textColor} hover:bg-white/50`}><Settings size={12} /></button>
      </div>
    );
  }

  // ==========================================
  // HIỂN THỊ KHỐI TIÊU CHUẨN (>= 1 GIỜ) VÀ HÀNG CHỜ
  // ==========================================
  return (
    <div ref={setNodeRef} style={style} className={`${positionClass} flex flex-col border rounded shadow-md overflow-hidden ${blockBg} ${isDragging ? "opacity-70 scale-105 shadow-2xl" : "opacity-100"} transition-transform group`}>
      
      {/* Lớp Overlay dùng để kéo thả (nằm dưới nút Cài đặt) */}
      <div {...listeners} {...attributes} className={`absolute top-0 left-0 p-1 z-10 w-full h-full ${isCarryOver || isCheckout ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}></div>
      
      {/* Nút Cài Đặt (Nằm trên cùng) */}
      <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onOpenSettings(booking.id)} className={`absolute top-1 right-1 z-20 p-1.5 bg-white/40 rounded transition ${textColor} hover:bg-white`}><Settings size={14} /></button>

      {/* NỘI DUNG HIỂN THỊ CHÍNH */}
      <div className="flex flex-col text-center pointer-events-none w-full h-full overflow-hidden p-1.5 z-10">
        
        {/* Tên khách hàng */}
        <div className="flex flex-col items-center justify-center w-full px-4 mb-0.5">
          <span className={`${isLarge ? 'text-sm md:text-base' : 'text-xs'} font-black uppercase ${textColor} tracking-tight leading-none truncate w-full`}>
            {booking.name}
          </span>
        </div>

        {/* Khối Thông tin cho phòng đã xếp */}
        {booking.roomId ? (
          <>
            {/* SĐT (Chỉ hiện nếu khối đủ to và có SĐT) */}
            {isLarge && booking.phone && (
              <div className="flex justify-center items-center gap-1 mb-1 text-[10px] font-bold text-slate-600/80">
                <Phone size={10}/> {booking.phone}
              </div>
            )}

            {/* Trạng thái & Tên Combo */}
            <div className="flex flex-wrap justify-center items-center gap-1.5 mb-1">
              <span className={`px-1.5 py-[2px] rounded font-bold text-[9px] uppercase shadow-sm ${badgeColor} text-white leading-none`}>{statusText}</span>
              <span className={`text-[10px] font-black bg-white/70 px-1.5 py-0.5 rounded shadow-sm ${textColor} leading-none truncate max-w-[100px]`}>{booking.comboName}</span>
            </div>

            {/* Giờ IN - OUT (Chỉ hiện ở khối >= 1 giờ) */}
            {!isCarryOver && (
              <div className="flex justify-center items-center gap-1 mb-1 text-[10px] font-bold text-slate-700 bg-white/40 px-2 py-0.5 rounded-full w-max mx-auto border border-white/50">
                <Clock size={10}/> {checkIn} - {checkOut}
              </div>
            )}

            {/* Ghi chú và Dịch vụ (Chỉ hiện ở khối siêu to >= 2 giờ) */}
            {isLarge && (
              <div className="flex flex-col gap-0.5 w-full px-1 mt-0.5">
                {booking.note && (
                  <div className="flex items-start gap-1 text-[9px] text-amber-900 bg-amber-100/50 p-1 rounded border border-amber-200/50 text-left overflow-hidden">
                    <FileText size={10} className="shrink-0 mt-[1px]"/>
                    <span className="truncate w-full italic font-medium">{booking.note}</span>
                  </div>
                )}
                {booking.services && booking.services.length > 0 && (
                  <div className="flex items-start gap-1 text-[9px] text-blue-900 bg-blue-100/50 p-1 rounded border border-blue-200/50 text-left overflow-hidden">
                    <Coffee size={10} className="shrink-0 mt-[1px]"/>
                    <span className="truncate w-full font-bold">
                      {booking.services.map((s:any) => s.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Giá tiền */}
            <div className="flex justify-center items-center gap-1 mt-auto pt-1">
              {!isCarryOver && <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-black ${priceColor} leading-none`}>{finalPrice.toLocaleString()}đ</span>}
            </div>

            {/* Thu Tiền Mặt / CK */}
            {booking.paymentStatus === 'paid' && (
              <div className="flex justify-center items-center gap-1 mt-1">
                {(booking.cashAmount || 0) > 0 && <span className="text-[9px] uppercase font-black bg-green-500 text-white px-1.5 py-0.5 rounded shadow-sm leading-none">TM: {(booking.cashAmount/1000)}k</span>}
                {(finalPrice - (booking.cashAmount || 0)) > 0 && <span className="text-[9px] uppercase font-black bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm leading-none">CK: {((finalPrice - (booking.cashAmount || 0))/1000)}k</span>}
              </div>
            )}
          </>
        ) : (
          /* HIỂN THỊ NẾU ĐANG Ở HÀNG CHỜ (CHƯA XẾP PHÒNG) */
          <>
            {booking.phone && <div className="text-[10px] font-bold text-slate-500 mb-1"><Phone size={10} className="inline"/> {booking.phone}</div>}
            <span className="text-[10px] text-emerald-800 font-black uppercase bg-white/60 px-2 py-1 rounded shadow-sm mb-1">{booking.comboName}</span>
            <span className="text-xs font-black text-rose-600 leading-none mt-1">{finalPrice.toLocaleString()}đ</span>
            
            {booking.paymentStatus === 'paid' && (
              <div className="flex justify-center items-center gap-1 mt-1.5">
                {(booking.cashAmount || 0) > 0 && <span className="text-[9px] uppercase font-black bg-green-500 text-white px-1.5 py-0.5 rounded shadow-sm leading-none">TM: {(booking.cashAmount/1000)}k</span>}
                {(finalPrice - (booking.cashAmount || 0)) > 0 && <span className="text-[9px] uppercase font-black bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm leading-none">CK: {((finalPrice - (booking.cashAmount || 0))/1000)}k</span>}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}