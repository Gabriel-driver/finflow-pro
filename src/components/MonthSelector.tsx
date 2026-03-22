import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthSelectorProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSelector({ currentDate, onPrev, onNext }: MonthSelectorProps) {
  const label = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-3">
      <button onClick={onPrev} className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors active:scale-95">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-semibold capitalize whitespace-nowrap">{label}</span>
      </div>
      <button onClick={onNext} className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors active:scale-95">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useMonthNav(initial?: Date) {
  const [currentDate, setCurrentDate] = useState(initial || new Date());
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const prevMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
  const nextMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });
  return { currentDate, monthKey, prevMonth, nextMonth };
}
