import { User, Wallet, LogOut } from "lucide-react";

export default function Header({ bookings, role, activeBranch, permissions, onLogout }: any) {
  
  const calculateFinalPrice = (b: any) => {
    const serviceTotal = b.services?.reduce((sum: number, s: any) => sum + s.price, 0) || 0;
    let final = b.price + serviceTotal;
    const surAmt = final * ((b.surchargePercent || 0) / 100);
    const discAmt = final * ((b.discountPercent || 0) / 100);
    return Math.max(0, final + (b.surcharge || 0) + surAmt - (b.discount || 0) - discAmt);
  };

  // CẬP NHẬT: Chỉ cộng tiền vào thanh Header nếu khách ĐÃ CHECK-OUT
  const totalCash = bookings.reduce((sum: number, b: any) => {
    if (b.status === 'checkout' && b.paymentStatus === 'paid') {
      return sum + (b.cashAmount || 0);
    }
    return sum;
  }, 0);

  const totalTransfer = bookings.reduce((sum: number, b: any) => {
    if (b.status === 'checkout' && b.paymentStatus === 'paid') {
      return sum + Math.max(0, calculateFinalPrice(b) - (b.cashAmount || 0));
    }
    return sum;
  }, 0);

  // LOGIC CHE DOANH THU NẾU LỄ TÂN KHÔNG CÓ QUYỀN
  const canViewRevenue = role !== 'reception' || permissions?.viewRevenue;

  // XỬ LÝ TÊN CHI NHÁNH HIỂN THỊ CHUẨN XÁC
  let displayBranchName = "ĐANG TẢI...";
  if (role === 'super_admin' && !activeBranch) {
     displayBranchName = "TẤT CẢ CHI NHÁNH";
  } else if (activeBranch?.name) {
     displayBranchName = activeBranch.name;
  } else if (activeBranch?.id) {
     displayBranchName = activeBranch.id;
  } else {
     displayBranchName = "CHƯA CÓ CHI NHÁNH"; 
  }

  return (
    <header className="bg-emerald-700 text-white shadow-md p-2 md:p-3 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0 z-30">
      
      <div className="flex items-center gap-3 bg-emerald-800/80 px-4 py-1.5 rounded-xl border border-emerald-600/50 w-full md:w-auto shadow-inner">
        <div className="bg-emerald-600 p-2 rounded-lg shadow-sm shrink-0"><User size={18} /></div>
        
        <div className="flex flex-col pr-2 border-r border-emerald-600/50 max-w-[180px] md:max-w-[250px]">
          <span className="text-sm font-black text-white leading-tight">
            {role === 'super_admin' ? '👑 SUPER ADMIN' : role === 'admin' ? '💼 QUẢN LÝ' : '👩‍💼 LỄ TÂN'}
          </span>
          <span 
            className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide truncate" 
            title={displayBranchName}
          >
            {displayBranchName}
          </span>
        </div>

        <button onClick={onLogout} className="ml-1 p-2 bg-rose-500/20 text-rose-300 rounded hover:bg-rose-500 hover:text-white transition shadow-sm flex items-center gap-1.5 text-xs font-bold shrink-0">
           <LogOut size={14}/> Thoát
        </button>
      </div>

      <div className="grid grid-cols-2 md:flex items-center gap-2 md:gap-3 w-full md:w-auto shrink-0">
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <Wallet size={14} className="text-emerald-300" />
          <div>
             <p className="text-[9px] uppercase tracking-wider text-emerald-100/80">Tiền mặt</p>
             <p className="font-bold text-sm text-green-300">{canViewRevenue ? `${totalCash.toLocaleString()}đ` : '*** đ'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
          <Wallet size={14} className="text-emerald-300" />
          <div>
             <p className="text-[9px] uppercase tracking-wider text-emerald-100/80">Chuyển khoản</p>
             <p className="font-bold text-sm text-blue-300">{canViewRevenue ? `${totalTransfer.toLocaleString()}đ` : '*** đ'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}