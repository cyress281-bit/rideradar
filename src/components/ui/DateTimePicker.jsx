import React, { useRef, useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(n) { return String(n).padStart(2, "0"); }

function ScrollColumn({ items, selected, onSelect, renderItem }) {
  const ref = useRef(null);
  const itemHeight = 40;

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * itemHeight - itemHeight; // center-ish
    }
  }, [selected]);

  return (
    <div className="relative flex-1">
      {/* Fade top */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none rounded-t-xl" />
      {/* Fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none rounded-b-xl" />
      {/* Center highlight */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-primary/10 border-y border-primary/20 z-0 pointer-events-none" />

      <div
        ref={ref}
        className="h-32 overflow-y-auto overflow-x-hidden scrollbar-hide relative"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {/* Padding top/bottom so items can center */}
        <div style={{ height: itemHeight * 1.5 }} />
        {items.map((item) => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{ height: itemHeight, scrollSnapAlign: "center" }}
            className={`flex items-center justify-center cursor-pointer text-sm font-bold transition-colors
              ${selected === item ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {renderItem ? renderItem(item) : pad(item)}
          </div>
        ))}
        <div style={{ height: itemHeight * 1.5 }} />
      </div>
    </div>
  );
}

export default function DateTimePicker({ value, onChange, minDate }) {
  const now = minDate ? new Date(minDate) : new Date();
  const parsed = value ? new Date(value) : null;

  const currentYear = now.getFullYear();
  const years = [currentYear, currentYear + 1];
  const allMonths = Array.from({ length: 12 }, (_, i) => i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const ampmOptions = ["AM", "PM"];

  const [month, setMonth] = React.useState(parsed ? parsed.getMonth() : now.getMonth());
  const [day, setDay] = React.useState(parsed ? parsed.getDate() : now.getDate());
  const [year, setYear] = React.useState(parsed ? parsed.getFullYear() : currentYear);
  const initHour24 = parsed ? parsed.getHours() : now.getHours();
  const [hour, setHour] = React.useState(initHour24 % 12 === 0 ? 12 : initHour24 % 12);
  const [ampm, setAmpm] = React.useState(initHour24 >= 12 ? "PM" : "AM");
  const [minute, setMinute] = React.useState(parsed ? Math.ceil(parsed.getMinutes() / 5) * 5 % 60 : Math.ceil(now.getMinutes() / 5) * 5 % 60);

  const to24 = (h12, ap) => {
    if (ap === "AM") return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
  };

  const emit = (m, d, y, h12, ap, min) => {
    const h24 = to24(h12, ap);
    const str = `${y}-${pad(m + 1)}-${pad(d)}T${pad(h24)}:${pad(min)}`;
    onChange?.(str);
  };

  const handleMonth = (v) => { setMonth(v); emit(v, day, year, hour, ampm, minute); };
  const handleDay = (v) => { setDay(v); emit(month, v, year, hour, ampm, minute); };
  const handleYear = (v) => { setYear(v); emit(month, day, v, hour, ampm, minute); };
  const handleHour = (v) => { setHour(v); emit(month, day, year, v, ampm, minute); };
  const handleAmpm = (v) => { setAmpm(v); emit(month, day, year, hour, v, minute); };
  const handleMinute = (v) => { setMinute(v); emit(month, day, year, hour, ampm, v); };

  return (
    <div className="space-y-3">
      {/* Date box */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <CalendarDays className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</span>
          <span className="ml-auto text-xs font-bold text-primary">
            {MONTHS[month]} {pad(day)}, {year}
          </span>
        </div>
        <div className="flex gap-1 px-3 py-2">
          <ScrollColumn items={allMonths} selected={month} onSelect={handleMonth} renderItem={(m) => MONTHS[m]} />
          <div className="w-px bg-border self-stretch my-2" />
          <ScrollColumn items={days} selected={day} onSelect={handleDay} />
          <div className="w-px bg-border self-stretch my-2" />
          <ScrollColumn items={years} selected={year} onSelect={handleYear} renderItem={(y) => String(y)} />
        </div>
      </div>

      {/* Time box */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</span>
          <span className="ml-auto text-xs font-bold text-primary">{pad(hour)}:{pad(minute)} {ampm}</span>
        </div>
        <div className="flex gap-1 px-3 py-2">
          <ScrollColumn items={hours12} selected={hour} onSelect={handleHour} />
          <div className="flex items-center justify-center text-lg font-black text-primary/40 px-1">:</div>
          <ScrollColumn items={minutes} selected={minute} onSelect={handleMinute} />
          <div className="w-px bg-border self-stretch my-2" />
          <ScrollColumn items={ampmOptions} selected={ampm} onSelect={handleAmpm} renderItem={(v) => v} />
        </div>
      </div>
    </div>
  );
}