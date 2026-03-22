import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emojiOptions = ["🍔", "🚗", "🏠", "🎮", "🏥", "📚", "📱", "👕", "✈️", "🎁", "💰", "💻", "📈", "🛒", "⚡", "🎵"];

export function NewCategoryModal({ open, onOpenChange }: Props) {
  const { addCategory } = useFinance();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🍔");
  const [budgetLimit, setBudgetLimit] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({ name: name.trim(), type, icon: selectedEmoji, budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined });
    toast.success(`Categoria "${name}" criada!`);
    setName(""); setBudgetLimit("");
    onOpenChange(false);
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nova Categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Alimentação, Salário..." className={inputClass} />
          </div>
          {type === "expense" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Limite mensal (R$) - opcional</label>
              <input type="number" step="100" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} placeholder="Ex: 1500" className={`${inputClass} tabular-nums`} />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setSelectedEmoji(emoji)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all active:scale-95 ${
                    selectedEmoji === emoji ? "bg-primary/20 border-primary/60 border ring-2 ring-primary/30" : "bg-muted/50 border border-border/40 hover:border-primary/40"
                  }`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.97] glow-primary">
            Criar Categoria
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
