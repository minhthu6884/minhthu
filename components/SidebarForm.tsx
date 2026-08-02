import { useState } from "react";
import { CalendarDays, Plus, Trash2, CreditCard } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import DraggableBlock from "./DraggableBlock";
import { supabase } from "../lib/supabase";

export default function SidebarForm({ bookings, setBookings, onOpenSettings, roomClasses, combos, role, permissions, activeBranch }: any) {
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formClass, setFormClass] = useState("");
  const [formComboName, setFormComboName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  
  const [cashAmount, setCashAmount] = useState<number | "">("");
  const [depositAmount, setDepositAmount] = useState<number | "">("");

  const today = new Date();
  const isWeekendToday = today.getDay() === 0 || today.getDay() === 6; 
  const [isWeekendMode, setIsWeekendMode] = useState<boolean>(isWeekendToday);

  const formatMoney = (val: number | "") => val ? val.toLocaleString('vi-VN') : "";
  const parseMoney = (val: string) => Number(val.replace(/\D/g, ''));

  const { isOver: isOverTrash, setNodeRef: setTrashRef } = useDroppable({ id: 'trash-zone' });
  const currentClass = roomClasses.includes(formClass) ? formClass : (roomClasses[0] || "");
  const availableCombos = combos[currentClass] || [];
  
  const currentCombo = availableCombos.find((c:any) => c.name === formComboName) || availableCombos[0];
  
  const finalPrice = currentCombo ? (isWeekendMode ? (currentCombo.weekendPrice || currentCombo.price) : currentCombo.price) : 0;
  
  const transferAmt = paymentStatus === 'paid' ? Math.max(0, finalPrice - Number(cashAmount || 0)) : 0;
  
  // TỰ ĐỘNG TÍNH TIỀN CÒN THIẾU KHI KHÁCH ĐẶT CỌC
  const remainingDepositAmt = paymentStatus === 'deposit' ? Math.max(0, finalPrice - Number(depositAmount || 0)) : 0;

  const branchId = activeBranch?.id || activeBranch;

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return alert("Nhập tên khách!");
    if (!currentClass || !currentCombo) return alert("Thiếu Hạng phòng hoặc Combo!");
    
    const newBooking = {
      id: `booking-${Date.now()}`, name: formName, phone: formPhone, roomClass: currentClass, comboName: currentCombo.name,
      duration: currentCombo.hours, price: finalPrice, roomId: null, startHour: null, startDate: null, startMinute: 0, 
      status: "waiting", paymentStatus, 
      cashAmount: paymentStatus === 'paid' ? Number(cashAmount || 0) : 0, 
      depositAmount: paymentStatus === 'deposit' ? Number(depositAmount || 0) : 0,
      note: isWeekendMode ? "📅 Đặt lịch giá Cuối Tuần" : "", 
      services: [], extraTime: 0, discount: 0, discountPercent: 0, surcharge: 0, surchargePercent: 0,
    };

    if (branchId) {
       const { error } = await supabase.from('bookings').insert([{
         id: newBooking.id, branch_id: branchId, name: newBooking.name, phone: newBooking.phone,
         room_class: newBooking.roomClass, combo_name: newBooking.comboName, status: newBooking.status,
         payment_status: newBooking.paymentStatus, cash_amount: newBooking.cashAmount, deposit_amount: newBooking.depositAmount,
         price: newBooking.price, duration: newBooking.duration, start_minute: 0, extra_time: 0, services: []
       }]);

       if (error) {
           console.error("🚨 LỖI SUPABASE:", error.message);
           alert("Lỗi lưu dữ liệu: " + error.message);
           return; 
       }
    }

    setBookings([...bookings, newBooking]);
    setFormName(""); setFormPhone(""); setPaymentStatus("unpaid"); setCashAmount(""); setDepositAmount("");
  };

  const canDelete = role !== 'reception' || permissions.deleteBooking;

  return (
    <aside className="w-full md:w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 shadow-lg">
      <div className="p-3 border-b bg-emerald-50/50 flex justify-between items-center">
         <div className="flex items-center gap-2"><CalendarDays size={18} className="text-emerald-700" /><h2 className="font-bold text-sm text-emerald-900">Tạo Khách Mới</h2></div>
      </div>

      <form onSubmit={handleCreateBooking} className="p-3 border-b border-slate-100 bg-slate-50/50">
        <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-2.5 py-2 mb-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500" placeholder="Tên khách hàng *" />
        <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full px-2.5 py-2 mb-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500" placeholder="Số điện thoại" />
        
        <div className="flex bg-slate-200 p-1 rounded-lg mb-2 cursor-pointer shadow-inner">
           <div onClick={() => setIsWeekendMode(false)} className={`flex-1 text-center py-1.5 text-[10px] font-black uppercase rounded-md transition ${!isWeekendMode ? 'bg-white text-emerald-700 shadow' : 'text-slate-500 hover:text-slate-700'}`}>📅 Ngày Thường</div>
           <div onClick={() => setIsWeekendMode(true)} className={`flex-1 text-center py-1.5 text-[10px] font-black uppercase rounded-md transition ${isWeekendMode ? 'bg-rose-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>🎉 Cuối Tuần</div>
        </div>

        <div className="flex gap-2 mb-2">
          <select value={currentClass} onChange={e => setFormClass(e.target.value)} className="w-1/2 px-2 py-2 border rounded-lg text-xs font-bold focus:outline-none">
            {roomClasses.length === 0 && <option value="">Trống</option>}
            {roomClasses.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <select value={currentCombo?.name || ""} onChange={e => setFormComboName(e.target.value)} className="w-1/2 px-2 py-2 border rounded-lg text-xs font-bold focus:outline-none bg-emerald-50 border-emerald-300 text-emerald-800">
            {availableCombos.length === 0 && <option value="">Chưa có combo</option>}
            {availableCombos.map((c: any, idx: number) => {
              const priceToShow = isWeekendMode ? (c.weekendPrice || c.price) : c.price;
              return (
                <option key={`${c.name}-${idx}`} value={c.name}>
                  {c.name} ({priceToShow >= 1000 ? `${priceToShow / 1000}k` : `${priceToShow}đ`})
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="bg-white p-2 rounded-lg border mb-3 shadow-sm">
           <div className="flex justify-between mb-1.5"><span className="text-[10px] font-black uppercase flex gap-1"><CreditCard size={12}/> Thu tiền</span><span className="text-[11px] font-black text-rose-600">Tổng: {finalPrice.toLocaleString('vi-VN')}đ</span></div>
           <select value={paymentStatus} onChange={(e) => { 
               setPaymentStatus(e.target.value); 
               if (e.target.value === 'paid') setCashAmount(0); 
               if (e.target.value === 'deposit') setDepositAmount(0); 
           }} className="w-full px-2 py-1.5 border rounded text-xs font-bold mb-2">
              <option value="unpaid">⏳ Chưa thu (Thu sau)</option>
              <option value="deposit">🧲 Đặt cọc trước</option>
              <option value="paid">✅ Đã thu đủ (Trả trước)</option>
           </select>

           {/* GIAO DIỆN MỚI CỦA PHẦN ĐẶT CỌC */}
           {paymentStatus === 'deposit' && (
              <div className="flex gap-2 border-t pt-2 border-slate-100">
                  <div className="w-1/2">
                      <span className="text-[9px] font-bold text-amber-700 block mb-0.5">Tiền cọc</span>
                      <input type="text" value={formatMoney(depositAmount)} onChange={(e) => setDepositAmount(parseMoney(e.target.value))} placeholder="Số tiền..." className="w-full px-2 py-1 border border-amber-300 bg-amber-50 rounded text-xs font-bold text-amber-700 focus:outline-none" />
                  </div>
                  <div className="w-1/2">
                      <span className="text-[9px] font-bold text-rose-700 block mb-0.5">Còn thiếu</span>
                      <input type="text" disabled value={formatMoney(remainingDepositAmt)} className="w-full px-2 py-1 border border-rose-300 bg-rose-50 rounded text-xs font-bold text-rose-700" />
                  </div>
              </div>
           )}

           {paymentStatus === 'paid' && (
             <div className="flex gap-2 border-t pt-2 border-slate-100">
                <div className="w-1/2"><span className="text-[9px] font-bold text-green-700 block mb-0.5">Tiền mặt</span><input type="text" value={formatMoney(cashAmount)} onChange={(e) => setCashAmount(parseMoney(e.target.value))} placeholder="0" className="w-full px-2 py-1 border border-green-300 rounded text-xs font-bold text-green-700 focus:outline-none" /></div>
                <div className="w-1/2"><span className="text-[9px] font-bold text-blue-700 block mb-0.5">Chuyển khoản</span><input type="text" disabled value={formatMoney(transferAmt)} className="w-full px-2 py-1 border border-blue-300 bg-blue-50 rounded text-xs font-bold text-blue-700" /></div>
             </div>
           )}
        </div>

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm flex justify-center items-center gap-1 shadow"><Plus size={16} /> Bỏ Vào Hàng Chờ</button>
      </form>

      <div className="p-3 flex-1 overflow-y-auto bg-slate-100/50 flex flex-col">
        <h3 className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">Đang chờ xếp lịch</h3>
        <div className="flex flex-col gap-2 flex-1">
          {bookings.filter((b: any) => !b.roomId).map((booking: any) => (
            <DraggableBlock key={booking.id} booking={booking} displayDuration={booking.duration} isCarryOver={false} onOpenSettings={onOpenSettings} />
          ))}
        </div>
      </div>
      {canDelete && (
        <div className="p-3 bg-slate-100 border-t"><div ref={setTrashRef} className={`flex flex-col items-center p-3 border-2 border-dashed rounded-lg ${isOverTrash ? 'bg-rose-100 border-rose-500 text-rose-600 scale-[1.02]' : 'bg-rose-50/50 border-rose-300 text-rose-400'}`}><Trash2 size={24} className={`mb-1 ${isOverTrash ? 'animate-bounce' : ''}`} /><span className="text-[10px] font-black uppercase text-center">Kéo bill thả vào đây<br/>để xóa bỏ</span></div></div>
      )}
    </aside>
  );
}