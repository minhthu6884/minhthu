import { useState } from "react";
import { Building, X } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import DraggableBlock from "./DraggableBlock";
import { HOURS } from "../lib/constants";

function DroppableCell({ room, hour, blocksToRender, onOpenSettings }: any) {
  const { isOver: isOverTop, setNodeRef: setTopRef } = useDroppable({ id: `${room}|${hour}|0` });
  const { isOver: isOverBottom, setNodeRef: setBottomRef } = useDroppable({ id: `${room}|${hour}|30` });
  
  const isOver = isOverTop || isOverBottom;

  return (
    <td className={`relative border border-slate-300 min-w-[140px] h-[60px] p-0 align-top transition-colors ${isOver ? "bg-amber-100 outline-dashed outline-2 outline-amber-500 outline-offset-[-2px] z-20" : "bg-white"}`}>
      
      <div ref={setTopRef} className="absolute top-0 w-full h-[30px] z-0" />
      <div ref={setBottomRef} className="absolute bottom-0 w-full h-[30px] z-0" />
      
      {blocksToRender.map((block: any) => <DraggableBlock key={`${block.id}-${block.isCarryOver ? 'tail' : 'head'}`} booking={block} displayDuration={block.displayDuration} isCarryOver={block.isCarryOver} onOpenSettings={onOpenSettings} />)}
    </td>
  );
}

// ĐÃ VÁ: Nhận 3 hàm Add, Rename, Remove từ page.tsx
export default function GridCalendar({ bookings, rooms, onAddRoom, onRenameRoom, onRemoveRoom, selectedDate, yesterdayStr, onOpenSettings }: any) {
  const [roomAction, setRoomAction] = useState('add'); 
  const [targetRoom, setTargetRoom] = useState('');
  const [roomInput, setRoomInput] = useState("");

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomAction === 'add') {
        if (!roomInput.trim()) return;
        onAddRoom(roomInput);
        setRoomInput("");
    } else if (roomAction === 'rename') {
        if (!targetRoom || !roomInput.trim()) return alert("Hãy chọn phòng và nhập tên mới!");
        onRenameRoom(targetRoom, roomInput);
        setRoomInput("");
        setTargetRoom("");
    } else if (roomAction === 'delete') {
        if (!targetRoom) return alert("Vui lòng chọn phòng cần xóa!");
        onRemoveRoom(targetRoom);
        setTargetRoom("");
    }
  };

  return (
    <main className="flex-1 bg-[#eef2f6] flex flex-col relative overflow-hidden p-2">
      
      <div className="p-2 mb-2 border border-slate-200 rounded bg-white flex justify-between items-center shrink-0 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0"><Building size={16} className="text-slate-500" /><span className="text-sm font-bold text-slate-700">Lưới Lịch Excel</span></div>
        <form onSubmit={handleRoomSubmit} className="flex gap-2 items-center shrink-0 ml-4">
          <select value={roomAction} onChange={(e) => { setRoomAction(e.target.value); setRoomInput(""); setTargetRoom(""); }} className="px-2 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 focus:outline-none">
             <option value="add">➕ Thêm Phòng Mới</option>
             <option value="rename">✏️ Đổi Tên Phòng</option>
             <option value="delete">🗑️ Xóa Phòng</option>
          </select>
          
          {roomAction !== 'add' && (
            <select value={targetRoom} onChange={(e) => setTargetRoom(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded text-xs font-bold focus:outline-none w-32">
               <option value="">Chọn phòng...</option>
               {rooms.map((r: string) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}

          {roomAction !== 'delete' && (
             <input type="text" value={roomInput} onChange={(e) => setRoomInput(e.target.value)} placeholder={roomAction === 'add' ? "Nhập tên phòng mới..." : "Nhập tên muốn đổi..."} className="px-2 py-1.5 border border-slate-300 rounded text-xs w-36 focus:outline-none focus:border-emerald-500 font-bold"/>
          )}
          
          <button type="submit" className={`px-3 py-1.5 rounded text-xs font-bold text-white shadow-sm transition ${roomAction === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
             {roomAction === 'add' ? 'Thêm' : roomAction === 'rename' ? 'Cập Nhật' : 'Xóa Bỏ'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-sm inline-block min-w-full flex-1 overflow-auto">
        <table className="border-collapse w-full table-fixed bg-white">
          <thead className="sticky top-0 z-40 bg-yellow-300 shadow-sm">
            <tr>
              <th className="sticky left-0 z-50 bg-yellow-400 border border-slate-400 w-[60px] h-[35px] text-[11px] text-slate-800">GIỜ</th>
              {rooms.map((room: string) => (
                <th key={room} className="relative border border-slate-400 w-[140px] h-[35px] font-black text-slate-800 text-xs">
                  {room}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="sticky left-0 z-30 bg-yellow-100/80 border border-slate-400 font-bold text-center align-middle text-slate-700 text-[11px] h-[60px] leading-none">
                  {hour} - {hour + 1}
                </td>
                
                {rooms.map((room: string) => {
                  const cellId = `${room}|${hour}`;
                  const blocksToRender: any[] = [];
                  
                  bookings.forEach((b: any) => {
                    if (b.roomId === room) {
                      const actualDuration = b.duration + (b.extraTime || 0);
                      const startDecimal = (b.startHour !== null ? b.startHour : 0) + (b.startMinute || 0) / 60;
                      
                      if (b.startDate === selectedDate && b.startHour === hour) {
                        const visibleHours = Math.min(actualDuration, 24 - startDecimal); 
                        blocksToRender.push({ ...b, isCarryOver: false, displayDuration: visibleHours });
                      }
                      else if (b.startDate === yesterdayStr && hour === 0) {
                        const endHourTotal = startDecimal + actualDuration;
                        if (endHourTotal > 24) blocksToRender.push({ ...b, isCarryOver: true, displayDuration: endHourTotal - 24 });
                      }
                    }
                  });
                  return <DroppableCell key={cellId} room={room} hour={hour} blocksToRender={blocksToRender} onOpenSettings={onOpenSettings} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}