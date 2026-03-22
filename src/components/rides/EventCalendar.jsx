import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

export default function EventCalendar({ plannedEvents, onSelectDate, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group events by date
  const eventsByDate = {};
  plannedEvents.forEach((event) => {
    const dateStr = format(new Date(event.start_time), "yyyy-MM-dd");
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
    eventsByDate[dateStr].push(event);
  });

  const daysInCalendar = [];
  const firstDayOfWeek = monthStart.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysInCalendar.push(null);
  }
  days.forEach((day) => daysInCalendar.push(day));

  return (
    <div className="bg-secondary/40 rounded-xl border border-border/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-sm">{format(currentMonth, "MMMM yyyy")}</h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInCalendar.map((day, idx) => {
          const dateStr = day ? format(day, "yyyy-MM-dd") : "";
          const eventsOnDay = eventsByDate[dateStr] || [];
          const isSelected = day && selectedDate && isSameDay(day, selectedDate);
          const isToday = day && isSameDay(day, new Date());
          const isCurrentMonth = day && isSameMonth(day, currentMonth);

          return (
            <button
              key={idx}
              onClick={() => day && onSelectDate(day)}
              className={`
                aspect-square rounded-lg text-[11px] font-medium transition-all relative
                ${!isCurrentMonth ? "opacity-30 bg-transparent" : ""}
                ${isSelected ? "bg-primary text-primary-foreground" : ""}
                ${!isSelected && isCurrentMonth && "bg-card/60 hover:bg-card/80"}
                ${isToday && !isSelected ? "ring-1 ring-primary" : ""}
              `}
            >
              {day && (
                <>
                  <div className="pt-1">{format(day, "d")}</div>
                  {eventsOnDay.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {eventsOnDay.slice(0, 2).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            isSelected ? "bg-primary-foreground" : "bg-primary"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-border/50"
        >
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {format(selectedDate, "MMMM d, yyyy")}
          </p>
          <div className="space-y-2">
            {eventsByDate[format(selectedDate, "yyyy-MM-dd")]?.length > 0 ? (
              eventsByDate[format(selectedDate, "yyyy-MM-dd")].map((event) => (
                <div key={event.id} className="bg-card/60 rounded-lg p-2 border border-border/30">
                  <p className="text-xs font-medium leading-tight">{event.title}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {format(new Date(event.start_time), "h:mm a")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-muted-foreground">No events scheduled</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}