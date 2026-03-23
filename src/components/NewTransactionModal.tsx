import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useFinance } from "@/lib/finance-store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTransaction?: any;
  isRecurringRule?: boolean;
}

export function NewTransactionModal({ open, onOpenChange, editTransaction, isRecurringRule = false }: Props) {
  const { 
    accounts, 
    categories, 
    creditCards, 
    addTransaction, 
    updateTransaction,
    addRecurringRule,
    updateRecurringRule
  } = useFinance();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [paymentMethod, setPaymentMethod] = useState<"account" | "credit_card">("account");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isRecurring, setIsRecurring] = useState(isRecurringRule);
  const [recurringDay, setRecurringDay] = useState("");
  const [installments, setInstallments] = useState("");

  // Update form when editTransaction changes or modal opens
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      if (editTransaction.date) setDate(editTransaction.date);
      if (editTransaction.endDate || editTransaction.end_date) setEndDate(editTransaction.endDate || editTransaction.end_date);
      setPaymentMethod(editTransaction.creditCardId ? "credit_card" : "account");
      setAccountId(editTransaction.accountId?.toString() || editTransaction.account_id?.toString() || "");
      setCreditCardId(editTransaction.creditCardId?.toString() || editTransaction.credit_card_id?.toString() || "");
      setCategoryId(editTransaction.categoryId?.toString() || editTransaction.category || "");
      setIsRecurring(editTransaction.recurring || isRecurringRule);
      setRecurringDay(editTransaction.recurringDay?.toString() || editTransaction.recurring_day?.toString() || "");
      setInstallments(editTransaction.installments?.toString() || "");
    } else if (open) {
      setIsRecurring(isRecurringRule);
      if (isRecurringRule) {
        setRecurringDay(new Date().getDate().toString());
      }
      // For new transaction, reset or set default account
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id.toString());
      }
      if (creditCards.length > 0 && !creditCardId) {
        setCreditCardId(creditCards[0].id.toString());
      }
      // Set default category if none selected
      const firstCat = categories.find(c => c.type === type);
      if (firstCat && !categoryId) {
        setCategoryId(firstCat.id.toString());
      }
    }
  }, [editTransaction, open, accounts, creditCards, categories, type, isRecurringRule]);

  const filteredCategories = categories.filter(c => c.type === type);

  // Sync categoryId if type changes and current category is not in filtered list
  useEffect(() => {
    if (!editTransaction && open) {
      const firstCat = categories.find(c => c.type === type);
      if (firstCat) {
        setCategoryId(firstCat.id.toString());
      }
    }
  }, [type, categories, editTransaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form...", { description, amount, categoryId, accountId, creditCardId, paymentMethod, isRecurringRule });
    
    if (!description.trim()) {
      toast.error("Por favor, informe uma descrição");
      return;
    }
    if (!amount || parseFloat(amount.toString().replace(',', '.')) <= 0) {
      toast.error("Por favor, informe um valor válido");
      return;
    }
    
    const cat = categories.find(c => c.id === parseInt(categoryId)) || 
                categories.find(c => c.name === categoryId) || 
                filteredCategories[0];
    
    const finalAmount = parseFloat(amount.toString().replace(',', '.'));
    const finalAccountId = (type === "income" || (type === "expense" && paymentMethod === "account")) ? parseInt(accountId || (accounts[0]?.id.toString())) : undefined;
    const finalCreditCardId = (type === "expense" && paymentMethod === "credit_card") ? parseInt(creditCardId || (creditCards[0]?.id.toString())) : undefined;

    try {
      if (isRecurringRule) {
        const ruleData = {
          accountId: finalAccountId,
          creditCardId: finalCreditCardId,
          type,
          amount: finalAmount,
          category: cat?.name || "Outros",
          description: description.trim(),
          recurringDay: parseInt(recurringDay) || new Date().getDate(),
          endDate: endDate || undefined,
          active: true,
          startDate: new Date().toISOString().split('T')[0]
        };

        if (editTransaction) {
          await updateRecurringRule(editTransaction.id, ruleData);
          toast.success("Regra de conta recorrente atualizada!");
        } else {
          await addRecurringRule(ruleData);
          toast.success("Nova conta recorrente cadastrada!");
        }
      } else {
        const data = {
          accountId: finalAccountId,
          creditCardId: finalCreditCardId,
          type,
          amount: finalAmount,
          category: cat?.name || "Outros",
          description: description.trim(),
          date,
          recurring: isRecurring,
          recurringDay: isRecurring ? parseInt(recurringDay) || new Date(date).getDate() : undefined,
          installments: installments ? parseInt(installments) : undefined,
        };

        if (editTransaction) {
          await updateTransaction(editTransaction.id, data);
          toast.success("Transação atualizada!");
        } else {
          await addTransaction(data);
          toast.success(
            installments ? `Transação parcelada em ${installments}x criada!` : "Transação registrada!",
            { description: `${type === "income" ? "Entrada" : "Saída"} de R$ ${finalAmount.toFixed(2)}` }
          );
        }
      }
      
      if (!editTransaction) {
        setDescription(""); 
        setAmount(""); 
        setInstallments(""); 
        setIsRecurring(isRecurringRule);
        setEndDate("");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar. Tente novamente.");
    }
  };

  const inputClass = "w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/60 sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isRecurringRule ? (editTransaction ? "Editar Conta Recorrente" : "Nova Conta Recorrente") : (editTransaction ? "Editar Transação" : "Nova Transação")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preencha os dados abaixo para salvar sua transação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {(['income', 'expense'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  type === t
                    ? t === 'income' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t === 'income' ? 'Entrada' : 'Saída'}
              </button>
            ))}
          </div>

          {/* Payment Method toggle */}
          {type === "expense" && (
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              <button type="button" onClick={() => setPaymentMethod("account")} className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${paymentMethod === "account" ? "bg-background" : "text-muted-foreground hover:text-foreground"}`}>Conta</button>
              <button type="button" onClick={() => setPaymentMethod("credit_card")} className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${paymentMethod === "credit_card" ? "bg-background" : "text-muted-foreground hover:text-foreground"}`}>Cartão de Crédito</button>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Descrição</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Aluguel, Netflix..." className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Valor (R$)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className={`${inputClass} tabular-nums`} />
            </div>
            <div>
              {isRecurringRule ? (
                <>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Até quando? (opcional)</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                </>
              ) : (
                <>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
                </>
              )}
            </div>
          </div>

          {type === 'income' || (type === 'expense' && paymentMethod === 'account') ? (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Conta</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={`${inputClass} appearance-none`}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
            </div>
          ) : null}

          {type === 'expense' && paymentMethod === 'credit_card' ? (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Cartão de Crédito</label>
              <select value={creditCardId} onChange={e => setCreditCardId(e.target.value)} className={`${inputClass} appearance-none`}>
                {creditCards.map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Categoria</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={`${inputClass} appearance-none`}>
              {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Installments - only for normal transactions */}
          {!isRecurringRule && type === 'expense' && paymentMethod === 'credit_card' && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Parcelas (opcional)</label>
              <select value={installments} onChange={e => setInstallments(e.target.value)} className={`${inputClass} appearance-none`}>
                <option value="">À vista</option>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                  <option key={n} value={n}>{n}x {amount ? `de R$ ${(parseFloat(amount.replace(',', '.')) / n).toFixed(2)}` : ""}</option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring Day - always for recurring rules, optional toggle for normal transactions */}
          {isRecurringRule ? (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Dia do mês</label>
              <input type="number" min="1" max="31" value={recurringDay} onChange={e => setRecurringDay(e.target.value)}
                placeholder={String(new Date().getDate())} className={`${inputClass} tabular-nums`} />
            </div>
          ) : (
            <>
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
            </>
          )}

          <button type="submit" className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-[0.97] glow-primary">
            {editTransaction ? "Salvar Alterações" : "Salvar"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
