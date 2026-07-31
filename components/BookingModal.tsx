import { X, Building, Coffee, Edit3, StickyNote, CreditCard, RotateCcw, Trash2, TrendingUp, TrendingDown, Clock } from "lucide-react";

export default function BookingModal({ activeBooking, updateActiveBooking, onClose, servicesList, combos, role, permissions }: any) {
  if (!activeBooking) return null;

  const statusColor = activeBooking.status === 'checkout' ? 'bg-slate-300 text-slate-800' : 
                      activeBooking.status === 'not_arrived' ? 'bg-amber-100 text-amber-900 border-amber-300' : 
                      'bg-emerald-100 text-emerald-800 border-emerald-300';

  const checkInHour = activeBooking.startHour !== null ? activeBooking.startHour : 0;
  const checkInMinute = activeBooking.startMinute || 0;
  const checkInStr = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}`;
  const totalMinutes = Math.round((activeBooking.duration + (activeBooking.extraTime || 0)) * 60);
  const outDate = new Date(2024, 0, 1, checkInHour, checkInMinute + totalMinutes);
  const checkOutStr = `${String(outDate.getHours()).padStart(2, '0')}:${String(outDate.getMinutes()).padStart(2, '0')}`;

  const handleCheckInChange = (e: any) => {
    const [h, m] = e.target.value.split(':').map(Number);
    updateActiveBooking('startHour', h); updateActiveBooking('startMinute', m);
  };
  
  const handleCheckOutChange = (e: any) => {
    const [outH, outM] = e.target.value.split(':').map(Number);
    let diffMins = (outH * 60 + outM) - (checkInHour * 60 + checkInMinute);
    if (diffMins <= 0) diffMins += 24 * 60; 
    updateActiveBooking('duration', diffMins / 60); updateActiveBooking('extraTime', 0);
  };
  
  const handleAddCombo = (comboName: string) => {
    if (!comboName) return;
    const combo = combos[activeBooking.roomClass]?.find((c: any) => c.name === comboName);
    if (combo) {
      updateActiveBooking('duration', activeBooking.duration + combo.hours);
      updateActiveBooking('price', activeBooking.price + combo.price);
      updateActiveBooking('comboName', `${activeBooking.comboName} + ${combo.name}`);
    }
  };

  const serviceTotal = activeBooking.services?.reduce((sum: number, s: any) => sum + s.price, 0) || 0;
  let finalPrice = activeBooking.price + serviceTotal;
  const surPercentAmt = finalPrice * ((activeBooking.surchargePercent || 0) / 100);
  const discPercentAmt = finalPrice * ((activeBooking.discountPercent || 0) / 100);
  finalPrice = Math.max(0, finalPrice + (activeBooking.surcharge || 0) + surPercentAmt - (activeBooking.discount || 0) - discPercentAmt);

  const cashAmt = activeBooking.cashAmount || 0;
  const transferAmt = Math.max(0, finalPrice - cashAmt); 

  const handleReturnToWaiting = () => {
    if(confirm("Xác nhận đưa bill này trở lại hàng chờ?")) {
      updateActiveBooking('roomId', null); updateActiveBooking('startHour', null); updateActiveBooking('startDate', null); updateActiveBooking('status', 'waiting');
      onClose();
    }
  };

  // KIỂM TRA QUYỀN SỬA GIÁ
  const canEditPrice = role !== 'reception' || permissions.editPrice;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto">
        <div className="bg-emerald-700 p-3.5 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2"><Edit3 size={18}/> Quản lý Booking: {activeBooking.name}</h3>
          <button onClick={onClose} className="hover:bg-emerald-800 p-1 rounded transition"><X size={20}/></button>
        </div>
        
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><Building size={12}/> Trạng thái phòng</label>
              <select value={activeBooking.status} onChange={(e) => updateActiveBooking('status', e.target.value)} className={`w-full px-2 py-1.5 border rounded text-xs font-bold focus:outline-none ${statusColor}`}>
                <option value="not_arrived">Chưa Đến (Expected)</option>
                <option value="staying">Đang Ở (In-house)</option>
                <option value="checkout">Đã Check-out (Out)</option>
              </select>
            </div>
            
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex flex-col justify-center">
              <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1"><CreditCard size={12}/> Thu tiền</label>
              <select 
                value={activeBooking.paymentStatus || 'unpaid'} 
                onChange={(e) => {
                  updateActiveBooking('paymentStatus', e.target.value);
                  if (e.target.value === 'paid' && activeBooking.cashAmount === undefined) {
                     updateActiveBooking('cashAmount', 0);
                  }
                }} 
                className={`w-full px-2 py-1.5 border rounded text-xs font-bold focus:outline-none ${activeBooking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white'}`}
              >
                <option value="unpaid">⏳ Chưa thanh toán</option>
                <option value="paid">✅ Đã thu tiền (Mặc định Full CK)</option>
              </select>
              
              {activeBooking.paymentStatus === 'paid' && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                  <div className="w-1/2">
                    <span className="text-[9px] font-bold text-green-700 block mb-0.5">Tiền mặt (VND)</span>
                    <input type="number" value={activeBooking.cashAmount || ''} onChange={(e) => updateActiveBooking('cashAmount', Number(e.target.value))} placeholder="0" className="w-full px-2 py-1 border border-green-300 rounded text-xs font-bold text-green-700 focus:outline-none" />
                  </div>
                  <div className="w-1/2">
                    <span className="text-[9px] font-bold text-blue-700 block mb-0.5">Chuyển khoản (VND)</span>
                    <input type="number" value={transferAmt || ''} onChange={(e) => updateActiveBooking('cashAmount', Math.max(0, finalPrice - Number(e.target.value)))} placeholder="0" className="w-full px-2 py-1 border border-blue-300 rounded text-xs font-bold text-blue-700 focus:outline-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <div>
              <label className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-1"><Clock size={12}/> Sửa giờ Check-In / Out</label>
              <div className="flex flex-col gap-2 mt-2">
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-500 w-6">IN:</span>
                   <input type="time" value={checkInStr} onChange={handleCheckInChange} disabled={!activeBooking.roomId} className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs font-bold text-center focus:outline-none disabled:opacity-50 disabled:bg-slate-100"/>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-500 w-6">OUT:</span>
                   <input type="time" value={checkOutStr} onChange={handleCheckOutChange} disabled={!activeBooking.roomId} className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs font-bold text-center focus:outline-none disabled:opacity-50 disabled:bg-slate-100"/>
                 </div>
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-amber-700 uppercase">Mua thêm Combo (+Tiền & Giờ)</label>
              <select value="" onChange={(e) => handleAddCombo(e.target.value)} className="w-full px-2 py-1.5 mt-2 mb-2 border border-amber-300 rounded text-xs font-bold bg-white text-amber-900 focus:outline-none cursor-pointer shadow-sm">
                <option value="">🛒 Chọn gói mua thêm...</option>
                {combos[activeBooking.roomClass]?.map((c: any) => (<option key={c.name} value={c.name}>+ {c.name} (+{(c.price/1000).toLocaleString()}k)</option>))}
              </select>

              <label className="text-[10px] font-black text-slate-500 uppercase mt-3 block">Bù giờ (Miễn phí)</label>
              <div className="flex gap-1 mt-1 flex-wrap">
                <button onClick={() => updateActiveBooking('extraTime', 0)} className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-[10px] font-bold hover:bg-slate-300">Reset</button>
                <button onClick={() => updateActiveBooking('extraTime', (activeBooking.extraTime || 0) + (10/60))} className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-[10px] font-bold hover:bg-slate-300">+ 10m</button>
                <button onClick={() => updateActiveBooking('extraTime', (activeBooking.extraTime || 0) + (30/60))} className="px-2 py-1 bg-slate-200 text-slate-800 rounded text-[10px] font-bold hover:bg-slate-300">+ 30m</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
            <div>
               <label className="text-[10px] font-black text-emerald-700 uppercase">Giá phòng gốc</label>
               <input type="number" disabled={!canEditPrice} value={activeBooking.price} onChange={(e) => updateActiveBooking('price', Number(e.target.value))} className="w-full px-2 py-1.5 border border-emerald-300 rounded text-sm font-bold mt-1 disabled:opacity-50 disabled:bg-slate-100"/>
            </div>
            <div>
              <label className="text-[10px] font-black text-rose-700 uppercase flex items-center gap-1"><TrendingUp size={12}/> Phụ thu lễ</label>
              <div className="flex gap-1 mt-1">
                <input type="number" disabled={!canEditPrice} placeholder="VND" value={activeBooking.surcharge || ''} onChange={(e) => updateActiveBooking('surcharge', Number(e.target.value))} className="w-2/3 px-2 py-1.5 border border-rose-300 rounded text-xs font-bold text-rose-600 disabled:opacity-50 disabled:bg-slate-100"/>
                <input type="number" disabled={!canEditPrice} placeholder="%" value={activeBooking.surchargePercent || ''} onChange={(e) => updateActiveBooking('surchargePercent', Number(e.target.value))} className="w-1/3 px-2 py-1.5 border border-rose-300 rounded text-xs font-bold text-rose-600 text-center disabled:opacity-50 disabled:bg-slate-100"/>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-indigo-700 uppercase flex items-center gap-1"><TrendingDown size={12}/> Giảm giá</label>
              <div className="flex gap-1 mt-1">
                <input type="number" disabled={!canEditPrice} placeholder="VND" value={activeBooking.discount || ''} onChange={(e) => updateActiveBooking('discount', Number(e.target.value))} className="w-2/3 px-2 py-1.5 border border-indigo-300 rounded text-xs font-bold text-indigo-600 disabled:opacity-50 disabled:bg-slate-100"/>
                <input type="number" disabled={!canEditPrice} placeholder="%" value={activeBooking.discountPercent || ''} onChange={(e) => updateActiveBooking('discountPercent', Number(e.target.value))} className="w-1/3 px-2 py-1.5 border border-indigo-300 rounded text-xs font-bold text-indigo-600 text-center disabled:opacity-50 disabled:bg-slate-100"/>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1 mb-1.5"><StickyNote size={14}/> Ghi Chú Yêu Cầu</label>
              <textarea value={activeBooking.note} onChange={(e) => updateActiveBooking('note', e.target.value)} placeholder="Khách dặn..." rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-yellow-50 focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
            </div>
            
            <div className="w-1/2 flex flex-col">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1 mb-1.5"><Coffee size={14}/> Bán Dịch Vụ</h4>
              <div className="flex gap-2 flex-wrap mb-2">
                {(!servicesList || servicesList.length === 0) && (
                  <span className="text-[10px] text-slate-400 font-bold italic bg-slate-100 px-2 py-1 rounded w-full text-center">Kho dịch vụ trống.</span>
                )}
                {servicesList?.map((srv: any) => (
                  <button key={srv.id} onClick={() => updateActiveBooking('services', [...(activeBooking.services||[]), { id: Date.now() + Math.random(), name: srv.name, price: srv.price }])} className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 rounded text-[10px] font-bold shadow-sm transition">
                    + {srv.name} ({(srv.price/1000)}k)
                  </button>
                ))}
              </div>
              
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-32 overflow-y-auto shadow-inner">
                <ul className="text-xs space-y-1">
                  {(!activeBooking.services || activeBooking.services.length === 0) && <span className="text-slate-400 italic font-medium">Chưa gọi dịch vụ nào</span>}
                  {activeBooking.services?.map((srv:any) => (
                    <li key={srv.id} className="flex justify-between items-center border-b border-slate-200 pb-1.5 pt-0.5 last:border-0 last:pb-0">
                      <span className="font-bold text-slate-700">{srv.name}</span> 
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{srv.price.toLocaleString()}đ</span>
                        <button onClick={() => updateActiveBooking('services', activeBooking.services.filter((s:any) => s.id !== srv.id))} className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 p-0.5 rounded transition"><Trash2 size={12}/></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 flex justify-between items-center border-t border-slate-200 shrink-0">
           <div>
             {/* Ai cũng có quyền trả về hàng chờ nếu xếp nhầm */}
             <button onClick={handleReturnToWaiting} className="flex items-center gap-1.5 px-4 py-2 bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold hover:bg-rose-200 transition"><RotateCcw size={14}/> Trả Về Hàng Chờ</button>
           </div>
           <div className="flex items-center gap-4">
             <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase">Tổng thanh toán</span>
                <span className="text-xl font-black text-rose-600">{Math.max(0, finalPrice).toLocaleString()}đ</span>
             </div>
            <button onClick={onClose} className="px-6 py-3 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm transition">Xong & Đóng</button>
           </div>
        </div>
      </div>
    </div>
  );
}