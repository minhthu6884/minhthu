import { X, Trash2, Plus, ShieldCheck, Wallet, Banknote, CalendarDays, ChevronDown, UserPlus, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function ManagementModal({ activeTab, onClose, bookings, setBookings, servicesList, setServicesList, roomClasses, setRoomClasses, combos, setCombos, cashflow, setCashflow, permissions, setPermissions, activeBranch, role }: any) {
  if (!activeTab) return null;

  const togglePermission = async (key: string, dbKey: string) => {
    const newVal = !permissions[key];
    setPermissions((prev: any) => ({ ...prev, [key]: newVal }));
    if(activeBranch?.id) await supabase.from('branch_permissions').update({ [dbKey]: newVal }).eq('branch_id', activeBranch.id);
  };

  const PERMISSION_DEFS = [
    { id: 'viewRevenue', dbKey: 'view_revenue', label: '1. Xem Tổng Doanh Thu', desc: 'Hiển thị tổng tiền TM/CK trên thanh tiêu đề góc trên cùng.' },
    { id: 'manageServices', dbKey: 'manage_services', label: '2. Quản lý Kho Dịch Vụ', desc: 'Cho phép vào Menu 1 để thêm/xóa đồ ăn uống.' },
    { id: 'manageRooms', dbKey: 'manage_rooms', label: '3. Quản lý Hạng Phòng', desc: 'Cho phép vào Menu 2 tạo/xóa Hạng phòng.' },
    { id: 'manageCombos', dbKey: 'manage_combos', label: '4. Quản lý Combo', desc: 'Cho phép vào Menu 3 tạo Combo hàng loạt.' },
    { id: 'manageCashflow', dbKey: 'manage_cashflow', label: '5. Sổ Quỹ Thu - Chi', desc: 'Cho phép vào Menu 4 ghi chép phiếu chi/thu.' },
    { id: 'viewStats', dbKey: 'view_stats', label: '6. Xem Bảng Thống Kê', desc: 'Cho phép vào Menu 5 xem chi tiết lịch sử và doanh thu.' },
    { id: 'deleteBooking', dbKey: 'delete_booking', label: '7. Xóa Bill / Hủy Phòng', desc: 'Được dùng Thùng rác và Xóa hóa đơn trong lịch sử.' },
    { id: 'editPrice', dbKey: 'edit_price', label: '8. Sửa Giá & Phụ Thu', desc: 'Được gõ tay sửa tiền phòng, nhập chiết khấu, phụ thu lễ.' },
  ];

  const [receptionList, setReceptionList] = useState<any[]>([]);
  const [newRecUser, setNewRecUser] = useState('');
  const [newRecPass, setNewRecPass] = useState('');

  const fetchReceptionAccounts = async () => {
    if (!activeBranch?.id) return;
    const { data } = await supabase.from('users').select('*').eq('branch_id', activeBranch.id).eq('role', 'reception');
    if (data) setReceptionList(data);
  };

  useEffect(() => { if (activeTab === 'permissions') fetchReceptionAccounts(); }, [activeTab, activeBranch]);

  const handleCreateReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecUser.trim() || !newRecPass.trim() || !activeBranch?.id) return;
    const { data: existing } = await supabase.from('users').select('id').eq('username', newRecUser.trim()).single();
    if (existing) return alert("Tên đăng nhập này đã tồn tại!");
    await supabase.from('users').insert([{ username: newRecUser.trim(), password: newRecPass.trim(), role: 'reception', branch_id: activeBranch.id }]);
    alert("Tạo tài khoản Lễ tân thành công!"); setNewRecUser(''); setNewRecPass(''); fetchReceptionAccounts();
  };

  const handleDeleteReception = async (id: number) => {
    if (confirm("Xóa tài khoản lễ tân này?")) { await supabase.from('users').delete().eq('id', id); fetchReceptionAccounts(); }
  };

  const handleDeleteInvoice = async (id: string) => {
    if(confirm("XÓA VĨNH VIỄN hóa đơn này khỏi hệ thống?")) {
      await supabase.from('bookings').delete().eq('id', id);
      setBookings((prev: any) => prev.filter((b: any) => b.id !== id));
    }
  };

  // ----- LOGIC 6 BẢNG MỚI -----
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const handleAddService = async () => {
    if(!newServiceName.trim() || !newServicePrice) return;
    const newSrv = { id: `srv-${Date.now()}`, branch_id: activeBranch.id, name: newServiceName.trim(), price: Number(newServicePrice) };
    await supabase.from('services').insert([newSrv]);
    setServicesList((prev: any) => [...prev, newSrv]);
    setNewServiceName(''); setNewServicePrice('');
  };
  const handleDeleteService = async (id: string) => {
    if(confirm("Xóa mặt hàng này?")) { await supabase.from('services').delete().eq('id', id); setServicesList((prev: any) => prev.filter((s: any) => s.id !== id)); }
  };

  const [newRoomClass, setNewRoomClass] = useState('');
  const handleAddRoomClass = async () => {
    if(!newRoomClass.trim()) return;
    const upper = newRoomClass.trim().toUpperCase();
    if(roomClasses.includes(upper)) return alert("Đã tồn tại!");
    await supabase.from('room_types').insert([{ branch_id: activeBranch.id, name: upper }]);
    setRoomClasses((prev: any) => [...prev, upper]);
    setNewRoomClass('');
  };
  const handleDeleteRoomClass = async (rc: string) => {
    if(confirm(`Xóa hạng phòng "${rc}"?`)) {
      await supabase.from('room_types').delete().match({ branch_id: activeBranch.id, name: rc });
      setRoomClasses((prev: any) => prev.filter((c: string) => c !== rc));
    }
  };

  const [selectedRoomClassForCombo, setSelectedRoomClassForCombo] = useState('');
  const [draftCombos, setDraftCombos] = useState([{ name: '', hours: '', minutes: '0', price: '' }]);
  const currentComboRoomClass = selectedRoomClassForCombo || (roomClasses[0] || "");
  const handleAddDraftRow = () => setDraftCombos([...draftCombos, { name: '', hours: '', minutes: '0', price: '' }]);
  const handleRemoveDraftRow = (index: number) => setDraftCombos(draftCombos.filter((_, i) => i !== index));
  const handleDraftChange = (index: number, field: string, value: string) => { const newDrafts = [...draftCombos]; newDrafts[index] = { ...newDrafts[index], [field]: value }; setDraftCombos(newDrafts); };
  
  const handleSaveBulkCombos = async () => {
    const validDrafts = draftCombos.filter(d => d.name.trim() !== '' && d.price !== '');
    if (validDrafts.length === 0) return alert("Điền đủ thông tin!");
    const newCombos = validDrafts.map(d => ({ branch_id: activeBranch.id, room_type: currentComboRoomClass, name: d.name.trim().toUpperCase(), hours: Number(d.hours || 0) + Number(d.minutes) / 60, price: Number(d.price) }));
    await supabase.from('room_combos').insert(newCombos);
    const uiCombos = newCombos.map(c => ({ name: c.name, hours: c.hours, price: c.price }));
    setCombos((prev: any) => ({ ...prev, [currentComboRoomClass]: [...(prev[currentComboRoomClass] || []), ...uiCombos] }));
    setDraftCombos([{ name: '', hours: '', minutes: '0', price: '' }]);
  };
  const handleDeleteCombo = async (roomClass: string, comboName: string) => {
    if(confirm(`Xóa "${comboName}"?`)) {
      await supabase.from('room_combos').delete().match({ branch_id: activeBranch.id, room_type: roomClass, name: comboName });
      setCombos((prev: any) => ({ ...prev, [roomClass]: prev[roomClass].filter((c: any) => c.name !== comboName) }));
    }
  };

  const [cfDate, setCfDate] = useState(() => { const tzoffset = (new Date()).getTimezoneOffset() * 60000; return (new Date(Date.now() - tzoffset)).toISOString().slice(0,16); });
  const [cfType, setCfType] = useState('chi'); const [cfMethod, setCfMethod] = useState('cash'); const [cfAmount, setCfAmount] = useState(''); const [cfNote, setCfNote] = useState('');
  
  const handleAddCashflow = async () => {
    if(!cfAmount || !cfNote.trim()) return alert("Nhập đủ thông tin!");
    const newCf = { id: `cf-${Date.now()}`, branch_id: activeBranch.id, date: cfDate, type: cfType, method: cfMethod, amount: Number(cfAmount), note: cfNote.trim() };
    await supabase.from('cashbook').insert([newCf]);
    setCashflow((prev: any) => [newCf, ...prev]); setCfAmount(''); setCfNote('');
  };
  const handleDeleteCashflow = async (id: string) => {
    if(confirm("Xóa phiếu này?")) { await supabase.from('cashbook').delete().eq('id', id); setCashflow((prev: any) => prev.filter((item: any) => item.id !== id)); }
  };

  const totalThuTM = cashflow.filter((c: any) => c.type === 'thu' && c.method === 'cash').reduce((sum: number, c: any) => sum + c.amount, 0);
  const totalThuCK = cashflow.filter((c: any) => c.type === 'thu' && c.method === 'transfer').reduce((sum: number, c: any) => sum + c.amount, 0);
  const totalChiTM = cashflow.filter((c: any) => c.type === 'chi' && c.method === 'cash').reduce((sum: number, c: any) => sum + c.amount, 0);
  const totalChiCK = cashflow.filter((c: any) => c.type === 'chi' && c.method === 'transfer').reduce((sum: number, c: any) => sum + c.amount, 0);

  const [statMode, setStatMode] = useState<'day' | 'month'>('day');
  const [statDate, setStatDate] = useState(() => { const tzoffset = (new Date()).getTimezoneOffset() * 60000; return (new Date(Date.now() - tzoffset)).toISOString().split('T')[0]; });
  const [statMonth, setStatMonth] = useState(() => { const tzoffset = (new Date()).getTimezoneOffset() * 60000; return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 7); });

  const completedInvoices = bookings.filter((b: any) => {
    if (b.status !== 'checkout' || !b.startDate) return false;
    return statMode === 'day' ? b.startDate === statDate : b.startDate.startsWith(statMonth);
  });

  let sumInvoiceCash = 0; let sumInvoiceTransfer = 0;
  completedInvoices.forEach((inv: any) => {
     const srvTotal = inv.services?.reduce((s:number, i:any)=>s+i.price, 0) || 0;
     let final = inv.price + srvTotal; final = Math.max(0, final + (inv.surcharge || 0) + (final * (inv.surchargePercent||0)/100) - (inv.discount || 0) - (final * (inv.discountPercent||0)/100));
     const cashAmt = inv.paymentStatus === 'paid' ? (inv.cashAmount || 0) : 0;
     sumInvoiceCash += cashAmt; sumInvoiceTransfer += (inv.paymentStatus === 'paid' ? Math.max(0, final - cashAmt) : 0);
  });

  const tongThu = sumInvoiceCash + sumInvoiceTransfer;
  const filteredCashflow = cashflow.filter((c: any) => { if (!c.date) return false; return statMode === 'day' ? c.date.startsWith(statDate) : c.date.startsWith(statMonth); });
  const tongChi = filteredCashflow.filter((c: any) => c.type === 'chi').reduce((sum: number, c: any) => sum + c.amount, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0"><h2 className="font-black text-lg flex items-center gap-2 uppercase tracking-wider">{activeTab === 'services' && '☕ Kho Dịch Vụ'} {activeTab === 'rooms' && '🏨 Hạng Phòng'} {activeTab === 'combos' && '🏷️ Combo Phòng'} {activeTab === 'cashflow' && '💵 Sổ Quỹ Thu - Chi'} {activeTab === 'stats' && '📊 Thống Kê'} {activeTab === 'permissions' && '🛡️ Phân Quyền'}</h2><button onClick={onClose} className="hover:bg-rose-600 p-1.5 rounded-lg transition bg-slate-800"><X size={20}/></button></div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col">
          {activeTab === 'services' && ( <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col h-full max-w-4xl mx-auto w-full"><div className="flex gap-3 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-200"><input type="text" value={newServiceName} onChange={(e)=>setNewServiceName(e.target.value)} placeholder="Tên mặt hàng (VD: Bò húc...)" className="flex-1 border p-2.5 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" /><input type="number" value={newServicePrice} onChange={(e)=>setNewServicePrice(e.target.value)} placeholder="Giá bán (VNĐ)" className="w-48 border p-2.5 rounded-lg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" /><button onClick={handleAddService} className="bg-amber-500 text-white px-6 font-bold rounded-lg hover:bg-amber-600 transition shadow-sm">Thêm mới</button></div><div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg"><table className="w-full text-left border-collapse"><thead className="sticky top-0 bg-slate-100 shadow-sm z-10"><tr className="text-slate-600 text-xs uppercase font-black border-b border-slate-200"><th className="p-3">Tên Dịch Vụ</th><th className="p-3 text-right">Giá Bán</th><th className="p-3 text-center w-24">Xóa</th></tr></thead><tbody>{servicesList.map((srv: any) => (<tr key={srv.id} className="border-b border-slate-100 hover:bg-amber-50/50 transition"><td className="p-3 font-black text-slate-800">{srv.name}</td><td className="p-3 text-right font-black text-rose-600">{srv.price.toLocaleString()}đ</td><td className="p-3 text-center"><button onClick={() => handleDeleteService(srv.id)} className="p-2 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div> )}
          {activeTab === 'rooms' && ( <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col h-full max-w-4xl mx-auto w-full"><div className="flex gap-3 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200"><input type="text" value={newRoomClass} onChange={(e)=>setNewRoomClass(e.target.value.toUpperCase())} placeholder="Tên Hạng Phòng..." className="flex-1 border p-2.5 rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none" /><button onClick={handleAddRoomClass} className="bg-blue-600 text-white px-6 font-bold rounded-lg hover:bg-blue-700 transition shadow-sm">Thêm Hạng Phòng</button></div><div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg"><table className="w-full text-left border-collapse"><thead className="sticky top-0 bg-slate-100 shadow-sm z-10"><tr className="text-slate-600 text-xs uppercase font-black border-b border-slate-200"><th className="p-3">Tên Hạng Phòng</th><th className="p-3 text-center w-24">Xóa</th></tr></thead><tbody>{roomClasses.map((rc: string) => (<tr key={rc} className="border-b border-slate-100 hover:bg-blue-50/50 transition"><td className="p-3 font-black text-slate-800">{rc}</td><td className="p-3 text-center"><button onClick={() => handleDeleteRoomClass(rc)} className="p-2 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div> )}
          {activeTab === 'combos' && ( <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col h-full max-w-5xl mx-auto w-full"><div className="flex flex-col gap-3 mb-6 bg-emerald-50 p-4 rounded-xl border border-emerald-200"><div className="flex items-center gap-2 mb-2"><span className="text-sm font-black text-emerald-900 uppercase">1. Chọn Hạng Phòng:</span><select value={currentComboRoomClass} onChange={(e) => setSelectedRoomClassForCombo(e.target.value)} className="w-64 border p-2 rounded-lg text-sm font-bold outline-none cursor-pointer">{roomClasses.map((rc: string) => <option key={rc} value={rc}>{rc}</option>)}</select></div><div className="space-y-2">{draftCombos.map((draft, idx) => (<div key={idx} className="flex gap-2 items-center flex-wrap"><span className="text-xs font-bold text-emerald-700 w-5 text-right">{idx + 1}.</span><input type="text" value={draft.name} onChange={(e)=>handleDraftChange(idx, 'name', e.target.value.toUpperCase())} placeholder="Tên Combo..." className="flex-1 border p-2 rounded-lg text-sm font-bold uppercase min-w-[150px] outline-none" /><div className="flex items-center gap-1 bg-white border rounded-lg px-2"><input type="number" min="0" value={draft.hours} onChange={(e)=>handleDraftChange(idx, 'hours', e.target.value)} placeholder="Giờ" className="w-12 py-2 text-sm font-bold text-center outline-none" /><span className="font-bold">:</span><select value={draft.minutes} onChange={(e)=>handleDraftChange(idx, 'minutes', e.target.value)} className="w-14 py-2 text-sm font-bold outline-none cursor-pointer"><option value="0">00</option><option value="30">30</option></select></div><input type="number" value={draft.price} onChange={(e)=>handleDraftChange(idx, 'price', e.target.value)} placeholder="Giá bán (VNĐ)" className="w-36 border p-2 rounded-lg text-sm font-bold outline-none" />{draftCombos.length > 1 && (<button onClick={() => handleRemoveDraftRow(idx)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition"><Trash2 size={16}/></button>)}</div>))}</div><div className="flex justify-between items-center mt-2 pt-4 border-t border-emerald-200"><button onClick={handleAddDraftRow} className="text-emerald-700 text-sm font-bold flex items-center gap-1 bg-emerald-100/50 px-3 py-1.5 rounded-lg transition"><Plus size={16}/> Thêm dòng</button><button onClick={handleSaveBulkCombos} className="bg-emerald-600 text-white px-6 py-2.5 font-bold rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm">Lưu Hàng Loạt Vào Bảng</button></div></div><div className="flex-1 overflow-y-auto border rounded-lg"><table className="w-full text-left border-collapse"><thead className="sticky top-0 bg-slate-100 shadow-sm z-10"><tr className="text-slate-600 text-xs uppercase font-black border-b"><th className="p-3">Hạng Phòng</th><th className="p-3">Tên Combo</th><th className="p-3 text-center">Thời Gian (HH:mm)</th><th className="p-3 text-right">Giá Bán</th><th className="p-3 text-center w-24">Xóa</th></tr></thead><tbody>{Object.entries(combos).map(([rc, rcCombos]: [string, any]) => ( rcCombos.map((cb: any) => { const h = Math.floor(cb.hours); const m = Math.round((cb.hours % 1) * 60); const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; return (<tr key={`${rc}-${cb.name}`} className="border-b border-slate-100 hover:bg-emerald-50/50 transition"><td className="p-3 font-bold text-emerald-700 bg-emerald-50/30 w-40">{rc}</td><td className="p-3 font-black text-slate-800">{cb.name}</td><td className="p-3 text-center font-bold text-slate-600 bg-slate-50">{timeStr}</td><td className="p-3 text-right font-black text-rose-600">{cb.price.toLocaleString()}đ</td><td className="p-3 text-center"><button onClick={() => handleDeleteCombo(rc, cb.name)} className="p-2 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition"><Trash2 size={16}/></button></td></tr>);}) ))}</tbody></table></div></div> )}
          {activeTab === 'cashflow' && ( <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col h-full mx-auto w-full"><div className="grid grid-cols-4 gap-4 mb-6"><div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-4"><div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><Banknote size={24}/></div><div><p className="text-[10px] font-black uppercase text-emerald-800/70">Tổng Thu Tiền Mặt</p><p className="text-lg font-black text-emerald-700">{totalThuTM.toLocaleString()}đ</p></div></div><div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex items-center gap-4"><div className="p-3 bg-teal-100 text-teal-600 rounded-lg"><Wallet size={24}/></div><div><p className="text-[10px] font-black uppercase text-teal-800/70">Tổng Thu Chuyển Khoản</p><p className="text-lg font-black text-teal-700">{totalThuCK.toLocaleString()}đ</p></div></div><div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-4"><div className="p-3 bg-rose-100 text-rose-600 rounded-lg"><Banknote size={24}/></div><div><p className="text-[10px] font-black uppercase text-rose-800/70">Tổng Chi Tiền Mặt</p><p className="text-lg font-black text-rose-700">{totalChiTM.toLocaleString()}đ</p></div></div><div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-4"><div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Wallet size={24}/></div><div><p className="text-[10px] font-black uppercase text-orange-800/70">Tổng Chi Chuyển Khoản</p><p className="text-lg font-black text-orange-700">{totalChiCK.toLocaleString()}đ</p></div></div></div><div className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-xl border flex-wrap items-center"><input type="datetime-local" value={cfDate} onChange={(e)=>setCfDate(e.target.value)} className="border p-2.5 rounded-lg text-sm font-bold bg-white" /><select value={cfType} onChange={(e)=>setCfType(e.target.value)} className={`border p-2.5 rounded-lg text-sm font-black cursor-pointer ${cfType === 'chi' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}><option value="chi">➖ Phiếu CHI</option><option value="thu">➕ Phiếu THU</option></select><select value={cfMethod} onChange={(e)=>setCfMethod(e.target.value)} className="border p-2.5 rounded-lg text-sm font-bold bg-white cursor-pointer"><option value="cash">Tiền mặt</option><option value="transfer">Chuyển khoản</option></select><input type="number" value={cfAmount} onChange={(e)=>setCfAmount(e.target.value)} placeholder="Nhập Số Tiền" className="w-40 border p-2.5 rounded-lg text-sm font-bold" /><input type="text" value={cfNote} onChange={(e)=>setCfNote(e.target.value)} placeholder="Lý do..." className="flex-1 border p-2.5 rounded-lg text-sm font-bold min-w-[200px]" /><button onClick={handleAddCashflow} className="bg-slate-800 text-white px-6 font-bold rounded-lg h-11">Ghi Sổ</button></div><div className="flex-1 overflow-y-auto border rounded-lg"><table className="w-full text-left border-collapse"><thead className="sticky top-0 bg-slate-100"><tr className="text-slate-600 text-[10px] uppercase font-black border-b"><th className="p-3 w-40">Ngày Giờ</th><th className="p-3 text-center">Phân Loại</th><th className="p-3 text-center">Hình Thức</th><th className="p-3">Ghi Chú</th><th className="p-3 text-right">Số Tiền</th><th className="p-3 text-center w-24">Xóa</th></tr></thead><tbody>{cashflow.map((cf: any) => (<tr key={cf.id} className="border-b hover:bg-slate-50"><td className="p-3 font-bold text-slate-600 text-xs">{new Date(cf.date).toLocaleString('vi-VN')}</td><td className="p-3 text-center"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${cf.type === 'chi' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{cf.type === 'chi' ? 'Phiếu Chi' : 'Phiếu Thu'}</span></td><td className="p-3 text-center"><span className={`text-[10px] font-bold uppercase ${cf.method === 'cash' ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'} px-2 py-1 border rounded`}>{cf.method === 'cash' ? 'Tiền Mặt' : 'Chuyển Khoản'}</span></td><td className="p-3 font-bold text-slate-700 text-sm">{cf.note}</td><td className={`p-3 text-right font-black text-base ${cf.type === 'chi' ? 'text-rose-600' : 'text-emerald-600'}`}>{cf.type === 'chi' ? '-' : '+'}{cf.amount.toLocaleString()}đ</td><td className="p-3 text-center"><button onClick={() => handleDeleteCashflow(cf.id)} className="p-2 bg-slate-100 text-slate-500 rounded hover:bg-rose-100 hover:text-rose-600 transition"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div> )}
          {activeTab === 'stats' && ( <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col h-full mx-auto w-full"><div className="flex justify-between items-end mb-6"><div className="flex gap-2"><div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3"><CalendarDays className="text-slate-600" size={24}/><div className="flex flex-col"><div className="relative"><select value={statMode} onChange={(e: any) => setStatMode(e.target.value)} className="text-[10px] font-black text-slate-500 uppercase bg-transparent outline-none cursor-pointer mb-0.5 appearance-none pr-3"><option value="day">Xem theo Ngày</option><option value="month">Xem theo Tháng</option></select><ChevronDown size={10} className="absolute right-0 top-1 text-slate-500 pointer-events-none"/></div>{statMode === 'day' ? ( <input type="date" value={statDate} onChange={(e) => setStatDate(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer" /> ) : ( <input type="month" value={statMonth} onChange={(e) => setStatMonth(e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer" /> )}</div></div></div><div className="flex flex-wrap justify-end gap-2"><div className="flex flex-col items-end p-2.5 bg-green-50 rounded-lg border border-green-200 min-w-[120px]"><span className="text-[10px] font-black uppercase text-green-700">Tiền Mặt</span><span className="text-lg font-black text-green-700">{sumInvoiceCash.toLocaleString()}đ</span></div><div className="flex flex-col items-end p-2.5 bg-blue-50 rounded-lg border border-blue-200 min-w-[120px]"><span className="text-[10px] font-black uppercase text-blue-700">Chuyển Khoản</span><span className="text-lg font-black text-blue-700">{sumInvoiceTransfer.toLocaleString()}đ</span></div><div className="flex flex-col items-end p-2.5 bg-emerald-50 rounded-lg border border-emerald-300 min-w-[120px] shadow-sm"><span className="text-[10px] font-black uppercase text-emerald-800">Tổng Thu</span><span className="text-lg font-black text-emerald-600">{tongThu.toLocaleString()}đ</span></div><div className="flex flex-col items-end p-2.5 bg-rose-50 rounded-lg border border-rose-300 min-w-[120px] shadow-sm"><span className="text-[10px] font-black uppercase text-rose-800">Tổng Chi</span><span className="text-lg font-black text-rose-600">-{tongChi.toLocaleString()}đ</span></div><div className="flex flex-col items-end p-2.5 bg-purple-100 rounded-lg border border-purple-300 min-w-[160px] shadow-md"><span className="text-[10px] font-black uppercase text-purple-800">DOANH THU THỰC</span><span className="text-xl font-black text-purple-700">{(tongThu - tongChi).toLocaleString()}đ</span></div></div></div><div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50"><table className="w-full text-left border-collapse min-w-[1200px]"><thead className="sticky top-0 bg-white shadow-sm z-10 outline outline-1 outline-slate-200"><tr className="text-slate-600 text-[10px] uppercase font-black"><th className="p-3 w-40">Khách Hàng & LH</th><th className="p-3 w-32">Phòng & Hạng</th><th className="p-3">Ngày & Giờ (IN - OUT)</th><th className="p-3 w-40">Combo Mua</th><th className="p-3 w-48">Dịch Vụ Bán Thêm</th><th className="p-3">Ghi Chú</th><th className="p-3 text-right w-36">Tổng Tiền</th><th className="p-3 text-center w-16">Xóa</th></tr></thead><tbody className="bg-white">{completedInvoices.map((inv: any) => { const endHour = (inv.startHour || 0) + inv.duration + (inv.extraTime || 0); const outH = Math.floor(endHour) % 24; const outM = Math.round((endHour % 1) * 60); const inStr = `${inv.startHour?.toString().padStart(2,'0')}:${inv.startMinute?.toString().padStart(2,'0') || '00'}`; const outStr = `${outH.toString().padStart(2,'0')}:${outM.toString().padStart(2,'0')}`; const [y, m, d] = inv.startDate.split('-'); const displayDate = `${d}/${m}/${y}`; const srvTotal = inv.services?.reduce((s:number, i:any)=>s+i.price, 0) || 0; let final = inv.price + srvTotal; final = Math.max(0, final + (inv.surcharge || 0) + (final * (inv.surchargePercent||0)/100) - (inv.discount || 0) - (final * (inv.discountPercent||0)/100)); const cashAmt = inv.paymentStatus === 'paid' ? (inv.cashAmount || 0) : 0; const transferAmt = inv.paymentStatus === 'paid' ? Math.max(0, final - cashAmt) : 0; return (<tr key={inv.id} className="border-b border-slate-100 hover:bg-purple-50/30 transition"><td className="p-3"><div className="font-black text-slate-800 text-sm uppercase">{inv.name}</div>{inv.phone && <div className="text-[10px] font-bold text-slate-500 mt-0.5">📞 {inv.phone}</div>}</td><td className="p-3"><div className="font-black text-emerald-700 text-sm">{inv.roomId}</div><div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">{inv.roomClass}</div></td><td className="p-3"><div className="text-[10px] font-black text-slate-500 mb-0.5">{displayDate}</div><span className="text-[11px] font-bold bg-slate-100 px-2 py-1 rounded border text-slate-700">{inStr} ➔ {outStr}</span></td><td className="p-3"><div className="font-bold text-blue-700 text-xs">{inv.comboName}</div></td><td className="p-3 text-[10px] text-slate-600 font-medium">{inv.services?.length > 0 ? (<ul className="list-disc pl-3">{inv.services.map((s:any, idx:number) => <li key={idx}>{s.name}</li>)}</ul>) : <span className="text-slate-400 italic">Không gọi thêm</span>}</td><td className="p-3 text-xs text-slate-500 italic max-w-[150px] truncate">{inv.note || '--'}</td><td className="p-3 text-right"><div className="font-black text-rose-600 text-base">{final.toLocaleString()}đ</div><div className="flex justify-end gap-1 mt-1">{cashAmt > 0 && <span className="text-[9px] font-black bg-green-500 text-white px-1 rounded uppercase">TM: {cashAmt/1000}k</span>}{transferAmt > 0 && <span className="text-[9px] font-black bg-blue-500 text-white px-1 rounded uppercase">CK: {transferAmt/1000}k</span>}</div></td><td className="p-3 text-center"><button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 bg-slate-100 text-slate-500 rounded hover:bg-rose-100 hover:text-rose-600 transition"><Trash2 size={16}/></button></td></tr>); })}</tbody></table></div></div> )}
          {activeTab === 'permissions' && ( <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-5xl mx-auto space-y-8"><div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200 shadow-sm"><div className="flex items-center gap-3 mb-4"><div className="p-2.5 bg-emerald-600 text-white rounded-lg"><UserPlus size={20}/></div><div><h4 className="text-sm font-black text-emerald-900 uppercase">Cấp tài khoản cho Lễ tân</h4></div></div><form onSubmit={handleCreateReception} className="flex gap-3 flex-wrap items-center"><input type="text" value={newRecUser} onChange={(e) => setNewRecUser(e.target.value)} placeholder="Tên đăng nhập lễ tân..." className="flex-1 min-w-[200px] border border-emerald-300 p-2.5 rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" /><input type="text" value={newRecPass} onChange={(e) => setNewRecPass(e.target.value)} placeholder="Mật khẩu..." className="w-48 border border-emerald-300 p-2.5 rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" /><button type="submit" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-700 transition flex items-center gap-1.5"><Plus size={16}/> Tạo</button></form><div className="mt-4 pt-3 border-t border-emerald-200"><p className="text-xs font-black text-emerald-900 mb-2 flex items-center gap-1"><Users size={14}/> Danh sách Lễ tân ({receptionList.length}):</p><div className="flex flex-wrap gap-2">{receptionList.map((rec: any) => (<div key={rec.id} className="bg-white px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-3 shadow-xs"><span className="text-xs font-black text-slate-800">👤 {rec.username}</span><span className="text-[10px] text-slate-400 font-mono">Pass: {rec.password}</span><button onClick={() => handleDeleteReception(rec.id)} className="text-rose-500 hover:text-rose-700 p-1 rounded transition"><Trash2 size={13}/></button></div>))}</div></div></div><div><div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100"><div className="p-3 bg-teal-100 text-teal-700 rounded-xl"><ShieldCheck size={26}/></div><div><h3 className="text-base font-black text-slate-800">Quyền hạn truy cập cho Lễ Tân</h3></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{PERMISSION_DEFS.map((perm) => (<div key={perm.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition"><div className="pr-4"><p className="text-sm font-black text-slate-800">{perm.label}</p><p className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">{perm.desc}</p></div><button onClick={() => togglePermission(perm.id, perm.dbKey)} className={`w-12 h-6 rounded-full relative p-1 shrink-0 transition-colors duration-300 ${permissions?.[perm.id] ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${permissions?.[perm.id] ? 'translate-x-6' : 'translate-x-0'}`}></div></button></div>))}</div></div></div> )}
        </div>
      </div>
    </div>
  );
}