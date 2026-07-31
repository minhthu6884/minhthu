export const INITIAL_ROOM_CLASSES = ["THƯỜNG", "VIP", "BIDA", "BỒN"];

export const INITIAL_COMBOS: Record<string, { name: string; hours: number; price: number }[]> = {
  "THƯỜNG": [{ name: "1 Giờ", hours: 1, price: 50000 }, { name: "ĐÊM (12 TIẾNG)", hours: 12, price: 200000 }],
  "VIP": [{ name: "1 Giờ", hours: 1, price: 80000 }, { name: "COMBO 3 GIỜ", hours: 3, price: 200000 }],
  "BIDA": [{ name: "1 Giờ", hours: 1, price: 60000 }, { name: "COMBO 4 GIỜ", hours: 4, price: 200000 }],
  "BỒN": [{ name: "2 Giờ", hours: 2, price: 150000 }, { name: "NỬA NGÀY (6 TIẾNG)", hours: 6, price: 350000 }],
};

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const INITIAL_ROOMS = ["101 - BIDA", "102 - BỒN", "103 - THƯỜNG", "201 - VIP"];

export const INITIAL_SERVICES = [
  { id: 's1', name: "Nước suối", price: 10000 },
  { id: 's2', name: "Redbull", price: 20000 },
  { id: 's3', name: "Mì tôm trứng", price: 30000 },
  { id: 's4', name: "Bim bim", price: 15000 },
];

export const INITIAL_CASHFLOW: any[] = [];

// [MỚI] DANH SÁCH CHI NHÁNH CỦA CHUỖI
export const BRANCHES = [
  { id: 'CN1', name: 'CƠ SỞ 1 - QUẬN 1' },
  { id: 'CN2', name: 'CƠ SỞ 2 - GÒ VẤP' },
  { id: 'CN3', name: 'CƠ SỞ 3 - BÌNH THẠNH' }
];

// [MỚI] 8 CHỨC NĂNG PHÂN QUYỀN MẶC ĐỊNH (Ban đầu khóa hết của Lễ Tân)
export const DEFAULT_PERMISSIONS = {
  viewRevenue: false,    // 1. Xem Tổng Doanh Thu Header
  manageServices: false, // 2. Quản lý Dịch vụ
  manageRooms: false,    // 3. Quản lý Hạng phòng
  manageCombos: false,   // 4. Quản lý Combo
  manageCashflow: false, // 5. Sổ quỹ Thu Chi
  viewStats: false,      // 6. Thống kê lịch sử
  deleteBooking: false,  // 7. Kéo thả Thùng rác xóa Bill
  editPrice: false,      // 8. Sửa giá phòng, giảm giá
};

export const generateDates = (startDateStr?: string) => {
  const dates = [];
  let startDate = new Date();
  if (startDateStr) {
    const parsedDate = new Date(startDateStr);
    if (!isNaN(parsedDate.getTime())) {
      startDate = parsedDate;
    }
  }
  const todayStr = new Date().toISOString().split('T')[0];
  for (let i = 0; i <= 30; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const id = d.toISOString().split('T')[0];
    dates.push({
      id: id,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      dayName: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
      isToday: id === todayStr,
    });
  }
  return dates;
};