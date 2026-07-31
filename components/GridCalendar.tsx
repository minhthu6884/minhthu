import { useState } from "react";
import { Building, X } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import DraggableBlock from "./DraggableBlock";
import { HOURS } from "../lib/constants";

function DroppableCell({ id, blocksToRender, onOpenSettings }: any) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    // Đã thay đổi h-[29px] thành h-[60px]
    <td ref={setNodeRef} className={`relative border border-slate-300 min-w-[140px] h-[60px] p-0 align-top transition-colors ${isOver ? "bg-amber-100 outline-dashed outline-2 outline-amber-500 outline-offset-[-2px] z-20" : "bg-white"}`}>
      {blocksToRender.map((block: any) => <DraggableBlock key={`${block.id}-${block.isCarryOver ? 'tail' : 'head'}`} booking={block} displayDuration={block.displayDuration} isCarryOver={block.isCarryOver} onOpenSettings={onOpenSettings} />)}
    </td>
  );
}

export default function GridCalendar({ bookings, rooms, setRooms, selectedDate, yesterdayStr, onOpenSettings }: any) {
  const [newRoom, setNewRoom] = useState("");

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.trim()) return;
    if (rooms.includes(newRoom.trim().toUpperCase())) return alert("Phòng đã tồn tại!");
    setRooms([...rooms, newRoom.trim().toUpperCase()]);
    setNewRoom("");
  };

  return (
    <main className="flex-1 bg-[#eef2f6] flex flex-col relative overflow-hidden p-2">
      <div className="p-2 mb-2 border border-slate-200 rounded bg-white flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-2"><Building size={16} className="text-slate-500" /><span className="text-sm font-bold text-slate-700">Lưới Lịch Excel</span></div>
        <form onSubmit={handleAddRoom} className="flex gap-1">
          <input type="text" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Tên phòng..." className="px-2 py-1 border border-slate-300 rounded text-xs w-28 focus:outline-none focus:border-emerald-500"/>
          <button type="submit" className="bg-slate-800 text-white px-2 py-1 rounded text-xs font-medium">Thêm</button>
        </form>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-sm inline-block min-w-full flex-1 overflow-auto">
        <table className="border-collapse w-full table-fixed bg-white">
          <thead className="sticky top-0 z-40 bg-yellow-300 shadow-sm">
            <tr>
              <th className="sticky left-0 z-50 bg-yellow-400 border border-slate-400 w-[60px] h-[35px] text-[11px] text-slate-800">GIỜ</th>
              {rooms.map((room: string) => (
                <th key={room} className="group relative border border-slate-400 w-[140px] h-[35px] font-black text-slate-800 text-xs">
                  {room}
                  <button onClick={() => setRooms(rooms.filter((r:string) => r !== room))} className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 text-rose-600 hover:bg-rose-100 p-0.5 rounded transition-all"><X size={14} strokeWidth={3} /></button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                {/* Đã thay đổi h-[29px] thành h-[60px] */}
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
                  return <DroppableCell key={cellId} id={cellId} blocksToRender={blocksToRender} onOpenSettings={onOpenSettings} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}