import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTransactionModal({ open, onOpenChange }: Props) {
  const { accounts, categories, addTransaction } = useFinance();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState("");
  const [installments, setInstallments] = useState("");

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !accountId) return;
    const cat = categories.find(c => c.id === categoryId) || filteredCategories[0];
    addTransaction({
      accountId,
      type,
      amount: parseFloat(amount),
      category: cat?.name || "Outros",
      description: description.trim(),
      date,
      recurring: isRecurring,
      recurringDay: isRecurring ? parseInt(recurringDay) || new Date(date).getDate() : undefined,
      installments: installments ? parseInt(installments) : undefined,
    });
    toast.success(
      installments ? `Transação parcelada em ${installments}x criada!` : "Transação registrada!",
      { description: `${type === "income" ? "Entrada" : "Saída"} de R$ ${parseFloat(amount).toFixed(2)}` }
    );
    setDescription(""); setAmount(""); setInstallments(""); setIsRecurring(false);
    onOpenChange(false);
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {(["income", "expense"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  type === t
                    ? t === "income" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {t === "income" ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Descrição</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Supermercado" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Valor (R$)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className={`${inputClass} tabular-nums`} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Conta</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className={`${inputClass} appearance-none`}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Categoria</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={`${inputClass} appearance-none`}>
              {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Installments */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Parcelas (opcional)</label>
            <select value={installments} onChange={e => setInstallments(e.target.value)} className={`${inputClass} appearance-none`}>
              <option value="">À vista</option>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                <option key={n} value={n}>{n}x {amount ? `de R$ ${(parseFloat(amount) / n).toFixed(2)}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <p className="text-sm font-medium">Recorrente</p>
              <p className="text-xs text-muted-foreground">Repete todo mês</p>
            </div>
            <button type="button" onClick={() => setIsRecurring(!isRecurring)}
              className={`w-12 h-7 rounded-full transition-all duration-200 relative ${isRecurring ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${isRecurring ? "left-6" : "left-1"}`} />
            </button>
          </div>

          {isRecurring && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Dia do mês</label>
              <input type="number" min="1" max="31" value={recurringDay} onChange={e => setRecurringDay(e.target.value)}
                placeholder={String(new Date(date).getDate())} className={`${inputClass} tabular-nums`} />
            </div>
          )}

          <button type="submit" className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.97] glow-primary">
            Salvar Transação
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
