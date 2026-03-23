import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useFinance, type CreditCard } from "@/lib/finance-store";
import { toast } from "sonner";
import { getBank } from "@/lib/bank-utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCard?: CreditCard | null;
}

export function NewCreditCardModal({ open, onOpenChange, editingCard }: Props) {
  const { addCreditCard, updateCreditCard } = useFinance();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [used, setUsed] = useState("");
  const [closingDay, setClosingDay] = useState("25");
  const [dueDay, setDueDay] = useState("5");

  useEffect(() => {
    if (editingCard) {
      setName(editingCard.name);
      setLimit(editingCard.limit.toString());
      setUsed(editingCard.used.toString());
      setClosingDay(editingCard.closingDay.toString());
      setDueDay(editingCard.dueDay.toString());
    } else {
      setName("");
      setLimit("");
      setUsed("0");
      setClosingDay("25");
      setDueDay("5");
    }
  }, [editingCard, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !limit) return;
    
    const bank = getBank(name.trim());
    const data = {
      name: name.trim(),
      icon: "💳",
      limit: parseFloat(limit),
      used: parseFloat(used) || 0,
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color: bank?.color || editingCard?.color || `hsl(${Math.floor(Math.random() * 360)} 70% 50%)`,
    };

    try {
      if (editingCard) {
        await updateCreditCard(editingCard.id, data);
        toast.success(`Cartão "${name}" atualizado!`);
      } else {
        await addCreditCard(data);
        toast.success(`Cartão "${name}" criado!`);
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cartão");
    }
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{editingCard ? "Editar Cartão" : "Novo Cartão de Crédito"}</DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os dados abaixo para gerenciar seu cartão de crédito.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome do Cartão</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank Platinum" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Limite (R$)</label>
              <input type="number" step="100" value={limit} onChange={e => setLimit(e.target.value)} placeholder="15.000" className={`${inputClass} tabular-nums`} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Fatura Atual (R$)</label>
              <input type="number" step="0.01" value={used} onChange={e => setUsed(e.target.value)} placeholder="0,00" className={`${inputClass} tabular-nums`} />
            </div>
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
            {editingCard ? "Salvar Alterações" : "Criar Cartão"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
