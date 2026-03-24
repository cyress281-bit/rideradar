import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function pad(n) { return String(n).padStart(2, "0"); }

export default function DateTimePicker({ value, onChange, minDate }) {
  const now = minDate ? new Date(minDate) : new Date();
  const parsed = value ? new Date(value) : null;

  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : now.getMonth());
  const [selectedDate, setSelectedDate] = useState(parsed ? {
    y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate()
  } : null);
  const [hour, setHour] = useState(parsed ? parsed.getHours() : now.getHours());
  const [minute, setMinute] = useState(parsed ? Math.ceil(parsed.getMinutes() / 5) * 5 : Math.ceil(now.getMinutes() / 5) * 5);

  const emitChange = (date, h, min) => {
    if (!date) return;
    const dt = new Date(date.y, date.m, date.d, h, min);
    // Format as datetime-local string
    const str = `${date.y}-${pad(date.m + 1)}-${pad(date.d)}T${pad(h)}:${pad(min)}`;
    onChange?.(str);
  };

  const handleDayClick = (d) => {
    const nd = { y: viewYear, m: viewMonth, d };
    setSelectedDate(nd);
    emitChange(nd, hour, minute);
  };

  const handleHour = (h) => {
    setHour(h);
    if (selectedDate) emitChange(selectedDate, h, minute);
  };

  const handleMinute = (min) => {
    setMinute(min);
    if (selectedDate) emitChange(selectedDate, hour, min);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) =>
    selectedDate && selectedDate.y === viewYear && selectedDate.m === viewMonth && selectedDate.d === d;

  const isPast = (d) => {
    const cellDate = new Date(viewYear, viewMonth, d, 23, 59);
    return cellDate < now;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden select-none">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-bold">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 pt-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center">
            {d ? (
              <button
                type="button"
                disabled={isPast(d)}
                onClick={() => handleDayClick(d)}
                className={`w-8 h-8 rounded-full text-xs font-semibold transition-all
                  ${isPast(d) ? "text-muted-foreground/30 cursor-not-allowed" :
                    isSelected(d) ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,240,50,0.4)]" :
                    "hover:bg-secondary text-foreground"
                  }`}
              >
                {d}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Time picker */}
      <div className="border-t border-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Clock className="w-3.5 h-3.5" /> Time
        </div>
        <div className="flex gap-3">
          {/* Hour scroll */}
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1.5">Hour</p>
            <div className="h-32 overflow-y-auto rounded-xl bg-secondary/50 border border-border">
              {hours.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHour(h)}
                  className={`w-full text-center py-1.5 text-sm font-semibold transition-colors
                    ${hour === h ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}
                >
                  {pad(h)}
                </button>
              ))}
            </div>
          </div>
          {/* Minute scroll */}
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1.5">Minute</p>
            <div className="h-32 overflow-y-auto rounded-xl bg-secondary/50 border border-border">
              {minutes.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinute(m)}
                  className={`w-full text-center py-1.5 text-sm font-semibold transition-colors
                    ${minute === m ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}
                >
                  {pad(m)}
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="text-2xl font-black text-primary tabular-nums">
                {pad(hour)}:{pad(minute)}
              </div>
              {selectedDate && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  {MONTHS[selectedDate.m].slice(0,3)} {selectedDate.d}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}