import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const icons = ["💳", "🏦", "👛", "🟧", "💰", "🏧", "💎", "🪙"];
const types = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "wallet", label: "Carteira" },
  { value: "credit_card", label: "Cartão" },
] as const;

export function NewAccountModal({ open, onOpenChange }: Props) {
  const { addAccount } = useFinance();
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [icon, setIcon] = useState("💳");
  const [type, setType] = useState<"checking" | "savings" | "wallet" | "credit_card">("checking");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addAccount({ name: name.trim(), balance: parseFloat(balance) || 0, icon, color: "hsl(var(--primary))", type });
    toast.success(`Conta "${name}" criada!`);
    setName(""); setBalance(""); setIcon("💳");
    onOpenChange(false);
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nova Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome da Conta</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank, Carteira..." className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value as any)} className={`${inputClass} appearance-none`}>
              {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Saldo Inicial (R$)</label>
            <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0,00" className={`${inputClass} tabular-nums`} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((ic) => (
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
            Criar Conta
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
