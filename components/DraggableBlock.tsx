import { useDraggable } from "@dnd-kit/core";
import { Settings } from "lucide-react";

export default function DraggableBlock({ booking, displayDuration, isCarryOver, onOpenSettings }: any) {
  const isCheckout = booking.status === 'checkout';
  const isNotArrived = booking.status === 'not_arrived';
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id, data: booking, disabled: isCarryOver || isCheckout,
  });

  const actualDuration = displayDuration + (booking.extraTime || 0);
  const isMicro = actualDuration <= 0.5; // Khối 30 phút
  
  // Bảng màu mô phỏng chuẩn xác
  let blockBg = 'bg-emerald-50 border-emerald-400';
  let badgeColor = 'bg-[#05a64a]'; // Xanh lá đậm
  let statusText = 'ĐANG Ở';

  if (isCheckout) { 
    blockBg = 'bg-slate-100 border-slate-300 opacity-90'; badgeColor = 'bg-slate-500'; statusText = 'ĐÃ OUT'; 
  } else if (isNotArrived) { 
    blockBg = 'bg-[#fef9ec] border-[#f97316]'; badgeColor = 'bg-[#f97316]'; statusText = 'CHƯA ĐẾN'; 
  } else if (isCarryOver) { 
    blockBg = 'bg-indigo-50 border-indigo-300'; badgeColor = 'bg-[#6366f1]'; statusText = 'QUA ĐÊM'; 
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

  const depositAmt = booking.depositAmount || 0;
  const remainingToPay = Math.max(0, finalPrice - depositAmt);
  const transferAmt = Math.max(0, remainingToPay - (booking.cashAmount || 0));

  const blockHeight = booking.roomId ? `${actualDuration * 60 - 1}px` : 'auto';
  const topOffset = (booking.roomId && booking.startMinute) ? `${(booking.startMinute / 60) * 60}px` : '0px';
  const positionClass = booking.roomId ? 'absolute left-[1%] w-[98%] z-30' : 'relative w-full mb-3';
  
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50, height: blockHeight, top: topOffset } : { height: blockHeight, top: topOffset };

  // ==========================================
  // THUẬT TOÁN TỰ ĐỘNG SCALE ĐÃ ĐƯỢC NÂNG CẤP ĐỘ CHÍNH XÁC
  // ==========================================
  let estimatedHeight = 115; 
  if (booking.services?.length) estimatedHeight += 18;
  if (booking.note) estimatedHeight += 18;
  if (depositAmt > 0) estimatedHeight += 18;
  if (booking.paymentStatus === 'paid') {
    if ((booking.cashAmount || 0) > 0) estimatedHeight += 18;
    if (transferAmt > 0) estimatedHeight += 18;
  }
  
  const availableHeight = booking.roomId ? (actualDuration * 60 - 8) : 9999;
  const scaleFactor = availableHeight < estimatedHeight ? Math.max(0.3, availableHeight / estimatedHeight) : 1;
  const inverseWidth = 100 / scaleFactor; 
  // ==========================================

  if (isMicro && booking.roomId) {
    return (
      <div ref={setNodeRef} style={style} className={`${positionClass} flex items-center justify-between px-1 border rounded-lg shadow-sm overflow-hidden ${blockBg} ${isDragging ? "opacity-70 scale-105" : "opacity-100"}`}>
        <div {...listeners} {...attributes} className="flex-1 flex items-center gap-1 overflow-hidden h-full cursor-grab">
           <span className={`text-[11px] font-black uppercase truncate text-[#e11d48]`}>{booking.name}</span>
        </div>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onOpenSettings(booking.id)} className={`p-0.5 rounded text-slate-800 hover:bg-white/50`}><Settings size={12} /></button>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={`${positionClass} flex flex-col border rounded-lg shadow-md overflow-hidden ${blockBg} ${isDragging ? "opacity-70 scale-105 shadow-2xl" : "opacity-100"} transition-transform group`}>
      
      {/* Khối Overlay kéo thả */}
      <div {...listeners} {...attributes} className={`absolute top-0 left-0 p-1 z-10 w-full h-full ${isCarryOver || isCheckout ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}></div>
      
      {/* Nút cài đặt */}
      <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onOpenSettings(booking.id)} className={`absolute top-1 right-1 z-20 p-1 bg-white/80 rounded-md transition text-slate-600 hover:bg-white`}><Settings size={14} /></button>

      {/* ĐÃ GỠ BỎ 'overflow-hidden' Ở THẺ DIV NÀY ĐỂ TRÁNH LỖI CẮT XÉN CHỮ */}
      <div className={booking.roomId ? "absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none" : "relative w-full h-full flex flex-col items-center justify-center pointer-events-none py-2"}>
          
          <div 
            className="flex flex-col items-center justify-center text-center h-max z-10 gap-[2.5px] origin-center"
            style={{ transform: `scale(${scaleFactor})`, width: `${inverseWidth}%` }}
          >
            
            <span className="text-[14px] md:text-[15px] font-black uppercase text-[#e11d48] drop-shadow-[0_1px_1px_rgba(255,255,255,1)] leading-none truncate block w-[98%] shrink-0">
              {booking.name}
            </span>

            {booking.roomId ? (
              <>
                {booking.phone && (
                  <span className="text-[10px] font-black text-slate-700 leading-none block w-[98%] truncate shrink-0">
                    📞 {booking.phone}
                  </span>
                )}

                <span className={`w-[96%] py-[2.5px] rounded-md font-black text-[9px] uppercase shadow-sm ${badgeColor} text-white leading-none block truncate shrink-0`}>
                  TRẠNG THÁI: {statusText}
                </span>

                <span className={`text-[9px] font-black bg-white py-[2.5px] rounded-full shadow-sm border border-slate-200 text-slate-800 leading-none block w-[96%] truncate shrink-0`}>
                  📦 Gói: {booking.comboName}
                </span>

                {!isCarryOver && (
                  <span className="text-[9px] font-black text-slate-800 bg-white py-[2.5px] rounded-full border border-slate-200 shadow-sm block w-[96%] truncate leading-none shrink-0">
                    ⏰ {checkIn} ➔ {checkOut}
                  </span>
                )}

                {booking.services && booking.services.length > 0 && (
                  <span className="text-[8.5px] font-black text-blue-800 bg-blue-100/90 py-[2.5px] rounded-md border border-blue-200 shadow-sm block w-[96%] leading-none truncate px-1 shrink-0">
                    ☕ Dịch vụ: {booking.services.map((s:any) => s.name).join(', ')}
                  </span>
                )}

                {booking.note && (
                  <span className="text-[8.5px] font-black text-amber-900 bg-amber-100/90 py-[2.5px] rounded-md border border-amber-200 shadow-sm block w-[96%] leading-none truncate px-1 shrink-0">
                    📝 Ghi chú: {booking.note}
                  </span>
                )}

                {!isCarryOver && (
                  <div className="flex flex-col items-center w-[96%] gap-[2.5px] mt-[2px] shrink-0">
                    <span className="text-[13px] font-black text-[#e11d48] leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,1)] block truncate w-full shrink-0 mb-[1px]">
                      💰 Tổng: {finalPrice.toLocaleString('vi-VN')}đ
                    </span>
                    
                    {depositAmt > 0 && (
                       <span className="text-[9px] font-black bg-[#f97316] text-white py-[2.5px] rounded-md shadow-sm leading-none block w-full truncate shrink-0">
                         Đã cọc: {depositAmt.toLocaleString('vi-VN')}đ
                       </span>
                    )}
                    
                    {booking.paymentStatus === 'paid' && (
                      <>
                        {(booking.cashAmount || 0) > 0 && (
                          <span className="text-[9px] font-black bg-[#05a64a] text-white py-[2.5px] rounded-md shadow-sm leading-none block w-full truncate shrink-0">
                            Tiền mặt: {(booking.cashAmount || 0).toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        {transferAmt > 0 && (
                          <span className="text-[9px] font-black bg-[#2563eb] text-white py-[2.5px] rounded-md shadow-sm leading-none block w-full truncate shrink-0">
                            Chuyển khoản: {transferAmt.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* GIAO DIỆN TẠI HÀNG CHỜ */
              <>
                {booking.phone && (
                  <span className="text-[10px] font-black text-slate-700 leading-none block w-[98%] truncate shrink-0 mb-[1px]">
                    📞 {booking.phone}
                  </span>
                )}
                
                <span className="text-[9px] text-slate-800 font-black uppercase bg-white py-[3px] rounded-full shadow-sm block w-[96%] truncate border border-slate-200 mt-[2px] shrink-0">
                  📦 Gói: {booking.comboName}
                </span>
                
                <span className="text-[13px] font-black text-[#e11d48] leading-none block w-full truncate mt-[4px] shrink-0">
                  💰 Tổng: {finalPrice.toLocaleString('vi-VN')}đ
                </span>
                
                <div className="flex flex-col items-center w-[96%] gap-[2.5px] mt-[4px] shrink-0">
                  {depositAmt > 0 && (
                     <span className="text-[9px] font-black bg-[#f97316] text-white py-[2.5px] rounded-md shadow-sm leading-none block w-full truncate shrink-0">
                       Đã cọc: {depositAmt.toLocaleString('vi-VN')}đ
                     </span>
                  )}
                  {booking.paymentStatus === 'paid' && (
                    <>
                      {(booking.cashAmount || 0) > 0 && (
                        <span className="text-[9px] font-black bg-[#05a64a] text-white py-[2.5px] rounded-md shadow-sm leading-none block w-full truncate shrink-0">
                          Tiền mặt: {(booking.cashAmount || 0).toLocaleString('vi-VN')}đ
                        </span>
                      )}
                      {transferAmt > 0 && (
                        <span className="text-[9px] font-black bg-[#2563eb] text-white py-[2.5px] rounded-md shadow-sm leading-none block w-full truncate shrink-0">
                          Chuyển khoản: {transferAmt.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
      </div>
    </div>
  );
}