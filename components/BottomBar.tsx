import { Coffee, Hotel, Tags, ArrowRightLeft, BarChart3, ShieldCheck } from "lucide-react";

export default function BottomBar({ onOpenTab, role, permissions }: any) {
  
  // HÀM KIỂM TRA QUYỀN ĐỂ ẨN/HIỆN NÚT
  const can = (key: string) => role !== 'reception' || permissions[key];

  return (
    <footer className="bg-slate-900 text-slate-300 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] h-14 flex items-center justify-center shrink-0 z-40 px-3 overflow-x-auto">
       <div className="flex items-center gap-1.5 overflow-x-auto">
         
         {can('manageServices') && (
           <><button onClick={() => onOpenTab('services')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-black transition uppercase tracking-wide whitespace-nowrap"><Coffee size={15} className="text-amber-400"/> 1. Dịch Vụ</button><div className="w-px h-5 bg-slate-700"></div></>
         )}

         {can('manageRooms') && (
           <><button onClick={() => onOpenTab('rooms')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-black transition uppercase tracking-wide whitespace-nowrap"><Hotel size={15} className="text-blue-400"/> 2. Hạng Phòng</button><div className="w-px h-5 bg-slate-700"></div></>
         )}

         {can('manageCombos') && (
           <><button onClick={() => onOpenTab('combos')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-black transition uppercase tracking-wide whitespace-nowrap"><Tags size={15} className="text-emerald-400"/> 3. Combo Phòng</button><div className="w-px h-5 bg-slate-700"></div></>
         )}

         {can('manageCashflow') && (
           <><button onClick={() => onOpenTab('cashflow')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-black transition uppercase tracking-wide whitespace-nowrap"><ArrowRightLeft size={15} className="text-rose-400"/> 4. Thu - Chi</button><div className="w-px h-5 bg-slate-700"></div></>
         )}

         {can('viewStats') && (
           <><button onClick={() => onOpenTab('stats')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-black transition uppercase tracking-wide whitespace-nowrap"><BarChart3 size={15} className="text-purple-400"/> 5. Thống Kê</button><div className="w-px h-5 bg-slate-700"></div></>
         )}

         {/* LỄ TÂN KHÔNG BAO GIỜ ĐƯỢC THẤY NÚT SỐ 6 NÀY */}
         {role !== 'reception' && (
           <button onClick={() => onOpenTab('permissions')} className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 hover:text-white rounded-lg text-xs font-black transition uppercase tracking-wide whitespace-nowrap text-teal-300"><ShieldCheck size={15} className="text-teal-400"/> 6. Phân Quyền</button>
         )}
       </div>
    </footer>
  );
}