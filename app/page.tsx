"use client";

import React, { useState, useMemo } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { ShieldCheck, User, Lock, KeyRound, LogIn, UserPlus, Building, Loader2 } from "lucide-react";
import Header from "../components/Header";
import DateBar from "../components/DateBar";
import SidebarForm from "../components/SidebarForm";
import GridCalendar from "../components/GridCalendar";
import BookingModal from "../components/BookingModal";
import BottomBar from "../components/BottomBar";
import ManagementModal from "../components/ManagementModal";
import { generateDates, INITIAL_ROOMS, BRANCHES, DEFAULT_PERMISSIONS } from "../lib/constants";

import { supabase } from "../lib/supabase";

export default function Home() {
  const [authStep, setAuthStep] = useState<'login' | 'branch' | 'app'>('login');
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regBranchName, setRegBranchName] = useState('');

  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false); 

  const [cloudBranches, setCloudBranches] = useState<string[]>([]);
  const [role, setRole] = useState<'super_admin' | 'admin' | 'reception'>('super_admin');
  const [activeBranch, setActiveBranch] = useState<any>(null);

  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [roomClasses, setRoomClasses] = useState<string[]>([]);
  const [combos, setCombos] = useState<any>({});

  const loadBranchData = async (branchId: string) => {
    setIsFetchingData(true);
    try {
      let { data: perms } = await supabase.from('branch_permissions').select('*').eq('branch_id', branchId).single();
      if (!perms) {
         const { data: newP } = await supabase.from('branch_permissions').insert([{ branch_id: branchId }]).select().single();
         perms = newP;
      }
      setPermissions({ viewRevenue: perms.view_revenue, manageServices: perms.manage_services, manageRooms: perms.manage_rooms, manageCombos: perms.manage_combos, manageCashflow: perms.manage_cashflow, viewStats: perms.view_stats, deleteBooking: perms.delete_booking, editPrice: perms.edit_price });

      // CƠ CHẾ BÁO LỖI: TẢI PHÒNG TỪ BẢNG rooms
      const { data: rmData, error: rmError } = await supabase.from('rooms').select('*').eq('branch_id', branchId).order('id', { ascending: true });
      
      if (rmError) {
          console.error("LỖI SUPABASE:", rmError);
          alert("🚨 KHÔNG TÌM THẤY BẢNG 'rooms' TRÊN SUPABASE!\n\nLỗi: " + rmError.message + "\nGiám đốc hãy vào Supabase tạo bảng 'rooms' ngay nhé!");
          setRooms(INITIAL_ROOMS);
      } else if (rmData && rmData.length > 0) {
         setRooms(rmData.map(r => r.name));
      } else {
         const defaultRooms = INITIAL_ROOMS.map(name => ({ branch_id: branchId, name }));
         const { error: insertErr } = await supabase.from('rooms').insert(defaultRooms);
         if (insertErr) alert("🚨 Lỗi tạo phòng mặc định: " + insertErr.message);
         setRooms(INITIAL_ROOMS);
      }

      const { data: srvs } = await supabase.from('services').select('*').eq('branch_id', branchId);
      setServicesList(srvs || []);

      const { data: rts } = await supabase.from('room_types').select('*').eq('branch_id', branchId);
      setRoomClasses(rts ? rts.map(r => r.name) : []);

      const { data: cmbs } = await supabase.from('room_combos').select('*').eq('branch_id', branchId);
      const combosObj: any = {};
      if (cmbs) {
         cmbs.forEach(c => {
           if(!combosObj[c.room_type]) combosObj[c.room_type] = [];
           combosObj[c.room_type].push({ 
               name: c.name, 
               hours: Number(c.hours), 
               price: Number(c.price),
               weekendPrice: Number(c.weekend_price || 0) 
           });
         });
      }
      setCombos(combosObj);

      const { data: cash } = await supabase.from('cashbook').select('*').eq('branch_id', branchId).order('date', { ascending: false });
      setCashflow(cash || []);

      const { data: bks } = await supabase.from('bookings').select('*').eq('branch_id', branchId);
      if (bks) {
         const mappedBks = bks.map(b => ({
           id: b.id, name: b.name, phone: b.phone, roomId: b.room_id, roomClass: b.room_class,
           comboName: b.combo_name, status: b.status, paymentStatus: b.payment_status,
           cashAmount: Number(b.cash_amount), depositAmount: Number(b.deposit_amount || 0), price: Number(b.price),
           surcharge: Number(b.surcharge), surchargePercent: Number(b.surcharge_percent),
           discount: Number(b.discount), discountPercent: Number(b.discount_percent),
           startDate: b.start_date, startHour: b.start_hour !== null ? Number(b.start_hour) : null,
           startMinute: b.start_minute !== null ? Number(b.start_minute) : 0, duration: Number(b.duration),
           extraTime: Number(b.extra_time), note: b.note, services: b.services || []
         }));
         setBookings(mappedBks);
      }
    } catch (e) { console.error("Lỗi:", e); }
    setIsFetchingData(false);
    setAuthStep('app');
  };

  const handleAuthSubmit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    
    setAuthError('');
    if (!username.trim() || !password.trim()) return setAuthError('Nhập đủ tài khoản/mật khẩu!');
    if (!isLoginMode && !regBranchName.trim()) return setAuthError('Nhập tên cơ sở!');
    setIsAuthenticating(true);

    if (!isLoginMode) {
      const { data: existing } = await supabase.from('users').select('id').eq('username', username.trim()).single();
      if (existing) { setIsAuthenticating(false); return setAuthError('Tài khoản đã tồn tại!'); }
      const { error } = await supabase.from('users').insert([{ username: username.trim(), password: password.trim(), role: 'admin', branch_id: regBranchName.trim().toUpperCase() }]);
      if (error) { setIsAuthenticating(false); return setAuthError(error.message); }
      alert('Đăng ký thành công!'); setIsLoginMode(true); setPassword(''); setRegBranchName('');
    } else {
      const { data: user, error } = await supabase.from('users').select('*').eq('username', username.trim()).eq('password', password.trim()).single();
      if (error || !user) { setIsAuthenticating(false); return setAuthError('Sai thông tin!'); }
      
      setRole(user.role);
      if (user.role === 'super_admin') {
         const { data: bData } = await supabase.from('users').select('branch_id').not('branch_id', 'is', null);
         if (bData) setCloudBranches(Array.from(new Set(bData.map(b => b.branch_id))) as string[]);
         setAuthStep('branch');
      } else {
         setActiveBranch({ id: user.branch_id, name: user.branch_id }); 
         await loadBranchData(user.branch_id);
      }
    }
    setIsAuthenticating(false);
  };

  const handleLogout = () => { 
    setAuthStep('login'); 
    setActiveBranch(null); 
    setUsername(''); 
    setPassword(''); 
    setBookings([]);
    setCashflow([]);
    setRole('super_admin');
    
    localStorage.clear();
    sessionStorage.clear();
  };

  const [viewStartDate, setViewStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setViewStartDate(localDate);
    setSelectedDate(localDate);
  }, []);
  
  const datesBar = useMemo(() => generateDates(viewStartDate), [viewStartDate]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [activeManagementTab, setActiveManagementTab] = useState<string | null>(null);
  const yesterdayStr = useMemo(() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; }, [selectedDate]);
  const activeBooking = bookings.find(b => b.id === selectedBookingId);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;

    if (overId === 'trash-zone') {
      const canDelete = role !== 'reception' || permissions.deleteBooking;
      if (!canDelete) return alert("Lễ tân không có quyền Xóa!");
      if (confirm("Xóa bỏ hoàn toàn Hóa đơn này?")) {
         setBookings(prev => prev.filter(b => b.id !== active.id));
         await supabase.from('bookings').delete().eq('id', active.id);
      }
      return;
    }

    const [roomId, hourStr, minStr] = overId.split("|");
    if(!roomId || !hourStr) return;
    
    const droppedHour = parseInt(hourStr);
    const droppedMinute = minStr ? parseInt(minStr) : 0; 
    
    const draggedBooking = bookings.find(b => b.id === active.id);
    if (!draggedBooking) return;

    const roomBookings = bookings.filter(b => b.roomId === roomId && b.id !== active.id && b.startHour !== null);
    const [y, m, d] = selectedDate.split('-').map(Number);
    
    let proposedStart = new Date(y, m - 1, d, droppedHour, droppedMinute, 0).getTime();
    const durationMs = draggedBooking.duration * 3600 * 1000;

    let isSnapping = true;
    while(isSnapping) {
       const overlapping = roomBookings.find(b => {
          const [by, bm, bd] = b.startDate.split('-').map(Number);
          const start = new Date(by, bm - 1, bd, b.startHour, b.startMinute || 0, 0).getTime();
          const end = start + (b.duration + (b.extraTime || 0)) * 3600 * 1000;
          return proposedStart >= start && proposedStart < end;
       });
       if (overlapping) {
          const [by, bm, bd] = overlapping.startDate.split('-').map(Number);
          const start = new Date(by, bm - 1, bd, overlapping.startHour, overlapping.startMinute || 0, 0).getTime();
          proposedStart = start + (overlapping.duration + (overlapping.extraTime || 0)) * 3600 * 1000;
       } else isSnapping = false;
    }

    const proposedEnd = proposedStart + durationMs;
    const hasHardOverlap = roomBookings.some(b => {
      const [by, bm, bd] = b.startDate.split('-').map(Number);
      const start = new Date(by, bm - 1, bd, b.startHour, b.startMinute || 0, 0).getTime();
      const end = start + (b.duration + (b.extraTime || 0)) * 3600 * 1000;
      return (proposedStart < end) && (proposedEnd > start);
    });

    if (hasHardOverlap) return alert("⚠️ PHÒNG KÍN LỊCH!");

    const newStartDateObj = new Date(proposedStart);
    const snappedHour = newStartDateObj.getHours();
    const snappedMinute = newStartDateObj.getMinutes();
    const snappedDateStr = `${newStartDateObj.getFullYear()}-${String(newStartDateObj.getMonth() + 1).padStart(2, '0')}-${String(newStartDateObj.getDate()).padStart(2, '0')}`;
    const newStatus = draggedBooking.status === "waiting" ? "not_arrived" : draggedBooking.status;

    setBookings(prev => prev.map(b => b.id === active.id ? { ...b, roomId, startHour: snappedHour, startMinute: snappedMinute, startDate: snappedDateStr, status: newStatus } : b));
    await supabase.from('bookings').update({ room_id: roomId, start_hour: snappedHour, start_minute: snappedMinute, start_date: snappedDateStr, status: newStatus }).eq('id', active.id);
  };

  const updateActiveBooking = async (key: string, value: any) => {
    setBookings(prev => prev.map(b => b.id === selectedBookingId ? { ...b, [key]: value } : b));
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    await supabase.from('bookings').update({ [snakeKey]: value }).eq('id', selectedBookingId);
  };

  const handleCloseBookingModal = () => setSelectedBookingId(null);
  const handleCloseManagementModal = () => setActiveManagementTab(null);

  const handleAddRoom = async (roomName: string) => {
    const upperNew = roomName.trim().toUpperCase();
    if (rooms.includes(upperNew)) return alert("Tên phòng này đã tồn tại!");
    
    const branchId = activeBranch?.id || activeBranch;
    if (branchId) {
       const { error } = await supabase.from('rooms').insert([{ branch_id: branchId, name: upperNew }]);
       if (error) return alert("🚨 LỖI LƯU PHÒNG TRÊN SUPABASE: " + error.message);
    }
    setRooms(prev => [...prev, upperNew]);
  };

  const handleRenameRoom = async (oldName: string, newName: string) => {
    const upperNew = newName.trim().toUpperCase();
    if (rooms.includes(upperNew)) return alert("Tên phòng này đã tồn tại!");
    
    const branchId = activeBranch?.id || activeBranch;
    if (branchId) {
        const { error } = await supabase.from('rooms').update({ name: upperNew }).match({ branch_id: branchId, name: oldName });
        if (error) return alert("🚨 LỖI ĐỔI TÊN PHÒNG: " + error.message);
    }
    
    setRooms(prev => prev.map(r => r === oldName ? upperNew : r));
    setBookings(prev => prev.map(b => b.roomId === oldName ? { ...b, roomId: upperNew } : b));
    
    const affectedBookings = bookings.filter(b => b.roomId === oldName);
    for (const b of affectedBookings) {
        await supabase.from('bookings').update({ room_id: upperNew }).eq('id', b.id);
    }
  };

  const handleRemoveRoom = async (roomName: string) => {
    if (confirm(`Xác nhận Xóa phòng [${roomName}] khỏi danh sách? (Các hóa đơn cũ vẫn sẽ được giữ)`)) {
        const branchId = activeBranch?.id || activeBranch;
        if (branchId) {
           const { error } = await supabase.from('rooms').delete().match({ branch_id: branchId, name: roomName });
           if (error) return alert("🚨 LỖI XÓA PHÒNG: " + error.message);
        }
        setRooms(prev => prev.filter(r => r !== roomName));
    }
  };

  if (authStep === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center relative z-10">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
             {isLoginMode ? <KeyRound size={32}/> : <UserPlus size={32}/>}
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">HỆ THỐNG QUẢN TRỊ</h1>
          
          <div className="w-full space-y-4 mt-6">
            {authError && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-bold text-center border border-rose-200">{authError}</div>}
            
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Tên đăng nhập</label>
               <div className="relative">
                 <User size={18} className="absolute left-3 top-3 text-slate-400" />
                 <input 
                   type="text" 
                   value={username} 
                   onChange={(e)=>setUsername(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && handleAuthSubmit()} 
                   disabled={isAuthenticating} 
                   autoComplete="off"
                   className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white" 
                 />
               </div>
            </div>
            
            <div className="space-y-1">
               <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Mật khẩu</label>
               <div className="relative">
                 <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                 <input 
                   type="password" 
                   value={password} 
                   onChange={(e)=>setPassword(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && handleAuthSubmit()} 
                   disabled={isAuthenticating} 
                   autoComplete="new-password"
                   className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white" 
                 />
               </div>
            </div>
            
            {!isLoginMode && (
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Tên Cơ sở</label>
                 <div className="relative">
                   <Building size={18} className="absolute left-3 top-3 text-slate-400" />
                   <input 
                     type="text" 
                     value={regBranchName} 
                     onChange={(e)=>setRegBranchName(e.target.value)} 
                     onKeyDown={(e) => e.key === 'Enter' && handleAuthSubmit()} 
                     disabled={isAuthenticating} 
                     autoComplete="off"
                     className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white" 
                   />
                 </div>
              </div>
            )}
            
            <button 
              type="button" 
              onClick={() => handleAuthSubmit()} 
              disabled={isAuthenticating} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md mt-2 disabled:bg-slate-400"
            >
               {isAuthenticating ? 'ĐANG KẾT NỐI...' : (isLoginMode ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN')}
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100 w-full text-center flex flex-col items-center">
            <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} disabled={isAuthenticating} className="text-emerald-600 font-black hover:text-emerald-700 transition uppercase text-sm">
               {isLoginMode ? 'Đăng ký ngay' : 'Quay lại đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authStep === 'branch') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
          <ShieldCheck size={32} className="text-purple-600 mb-4"/>
          <h2 className="text-xl font-black mb-6">CHỌN CHI NHÁNH</h2>
          <div className="w-full space-y-3 max-h-60 overflow-y-auto">
             {cloudBranches.map(b => (
               <button key={b} onClick={() => { setActiveBranch({ id: b, name: b }); loadBranchData(b); }} className="w-full p-4 border-2 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 rounded-xl font-black flex items-center gap-3">
                 <span className="text-2xl">🏢</span> {b}
               </button>
             ))}
          </div>
          <button onClick={handleLogout} className="mt-6 text-xs font-bold text-rose-400 hover:text-rose-600 flex items-center gap-1"><LogIn size={14}/> Đăng xuất</button>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {isFetchingData && ( 
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center">
          <Loader2 size={48} className="text-emerald-500 animate-spin mb-4" />
          <p className="text-white font-black tracking-widest uppercase">Đang đồng bộ dữ liệu Cloud...</p>
        </div> 
      )}
      
      <div className="flex flex-col h-full w-full bg-slate-100 font-sans">
        <Header 
          bookings={bookings} 
          role={role} 
          activeBranch={activeBranch} 
          permissions={permissions} 
          onLogout={handleLogout} 
        />
        
        <DateBar 
          datesBar={datesBar} 
          selectedDate={selectedDate} 
          setSelectedDate={setSelectedDate} 
          viewStartDate={viewStartDate} 
          setViewStartDate={setViewStartDate}
        />
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <SidebarForm 
            bookings={bookings} 
            setBookings={setBookings} 
            onOpenSettings={setSelectedBookingId} 
            roomClasses={roomClasses} 
            combos={combos} 
            role={role} 
            permissions={permissions} 
            activeBranch={activeBranch} 
          />
          <GridCalendar 
            bookings={bookings} 
            rooms={rooms} 
            onAddRoom={handleAddRoom}
            onRenameRoom={handleRenameRoom}
            onRemoveRoom={handleRemoveRoom}
            selectedDate={selectedDate} 
            yesterdayStr={yesterdayStr} 
            onOpenSettings={setSelectedBookingId} 
          />
        </div>
        
        <BottomBar 
          onOpenTab={setActiveManagementTab} 
          role={role} 
          permissions={permissions} 
        />
        
        {selectedBookingId && (
          <BookingModal 
            activeBooking={activeBooking} 
            updateActiveBooking={updateActiveBooking} 
            onClose={handleCloseBookingModal} 
            servicesList={servicesList} 
            combos={combos} 
            role={role} 
            permissions={permissions} 
            activeBranch={activeBranch}
          />
        )}
        
        {activeManagementTab && (
          <ManagementModal 
            activeTab={activeManagementTab} 
            onClose={handleCloseManagementModal} 
            bookings={bookings} 
            setBookings={setBookings} 
            cashflow={cashflow} 
            setCashflow={setCashflow} 
            activeBranch={activeBranch} 
            role={role} 
            servicesList={servicesList} 
            setServicesList={setServicesList} 
            roomClasses={roomClasses} 
            setRoomClasses={setRoomClasses} 
            combos={combos} 
            setCombos={setCombos} 
            permissions={permissions} 
            setPermissions={setPermissions} 
          />
        )}
      </div>
    </DndContext>
  );
}