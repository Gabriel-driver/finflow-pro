import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const goalIcons = ["🛡️", "✈️", "💻", "📈", "🏠", "🚗", "💍", "🎓", "🎯", "💰"];

export function NewGoalModal({ open, onOpenChange }: Props) {
  const { addGoal } = useFinance();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("🎯");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target) return;
    addGoal({ name: name.trim(), target: parseFloat(target), current: parseFloat(current) || 0, icon, deadline: deadline || undefined });
    toast.success(`Meta "${name}" criada!`);
    setName(""); setTarget(""); setCurrent(""); setDeadline("");
    onOpenChange(false);
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nova Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome da Meta</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem, Emergência..." className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Valor Alvo (R$)</label>
              <input type="number" step="0.01" value={target} onChange={e => setTarget(e.target.value)} placeholder="10.000" className={`${inputClass} tabular-nums`} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Já Guardado (R$)</label>
              <input type="number" step="0.01" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0,00" className={`${inputClass} tabular-nums`} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Prazo</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {goalIcons.map((ic) => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all active:scale-95 ${
                    icon === ic ? "bg-primary/20 border-primary/60 border ring-2 ring-primary/30" : "bg-muted/50 border border-border/40 hover:border-primary/40"
                  }`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.97] glow-primary">
            Criar Meta
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
