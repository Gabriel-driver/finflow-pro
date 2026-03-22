import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewCreditCardModal({ open, onOpenChange }: Props) {
  const { addCreditCard } = useFinance();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("25");
  const [dueDay, setDueDay] = useState("5");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !limit) return;
    addCreditCard({
      name: name.trim(),
      icon: "💳",
      limit: parseFloat(limit),
      used: 0,
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color: `hsl(${Math.floor(Math.random() * 360)} 70% 50%)`,
    });
    toast.success(`Cartão "${name}" criado!`);
    setName(""); setLimit("");
    onOpenChange(false);
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Novo Cartão de Crédito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome do Cartão</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank Platinum" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Limite (R$)</label>
            <input type="number" step="100" value={limit} onChange={e => setLimit(e.target.value)} placeholder="15.000" className={`${inputClass} tabular-nums`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Dia do Fechamento</label>
              <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className={`${inputClass} tabular-nums`} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Dia do Vencimento</label>
              <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className={`${inputClass} tabular-nums`} />
            </div>
          </div>
          <button type="submit" className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.97] glow-primary">
            Criar Cartão
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
