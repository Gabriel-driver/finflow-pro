import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useState } from "react";
import { NewGoalModal } from "@/components/NewGoalModal";
import { toast } from "sonner";

export default function Goals() {
  const { goals, deleteGoal, updateGoal, addTransaction, accounts } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);

  const handleDeposit = async (goal: any, amount: number) => {
    if (accounts.length === 0) {
      toast.error("Você precisa de uma conta para realizar depósitos");
      return;
    }

    try {
      // 1. Create a transaction
      await addTransaction({
        accountId: accounts[0].id,
        type: "expense",
        amount: amount,
        category: "Metas",
        description: `Depósito na meta: ${goal.name}`,
        date: new Date().toISOString().split('T')[0]
      });

      // 2. Update goal current value
      await updateGoal(goal.id, { ...goal, current: goal.current + amount });
      
      toast.success(`R$ ${amount.toFixed(2)} depositados com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar depósito");
    }
  };

  const handleWithdraw = async (goal: any, amount: number) => {
    if (accounts.length === 0) {
      toast.error("Você precisa de uma conta para realizar retiradas");
      return;
    }

    if (goal.current < amount) {
      toast.error("Saldo insuficiente na meta");
      return;
    }

    try {
      // 1. Create a transaction (income)
      await addTransaction({
        accountId: accounts[0].id,
        type: "income",
        amount: amount,
        category: "Metas",
        description: `Retirada da meta: ${goal.name}`,
        date: new Date().toISOString().split('T')[0]
      });

      // 2. Update goal current value
      await updateGoal(goal.id, { ...goal, current: goal.current - amount });
      
      toast.success(`R$ ${amount.toFixed(2)} retirados com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar retirada");
    }
  };

  return (
    <AppLayout title="Metas Financeiras">
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-muted-foreground text-sm">Acompanhe seu progresso financeiro</p>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Nova Meta
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal, i) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const isComplete = progress >= 100;
            const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={goal.id} className="glass-card-hover rounded-xl p-5 animate-slide-up group" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{goal.icon || "🎯"}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">{formatCurrency(goal.current)} de {formatCurrency(goal.target)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isComplete && <span className="text-xs px-2.5 py-1 rounded-full bg-success/15 text-success font-medium">Concluída!</span>}
                    {daysLeft !== null && daysLeft > 0 && !isComplete && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${daysLeft <= 30 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
                        {daysLeft}d restantes
                      </span>
                    )}
                    <button onClick={() => deleteGoal(goal.id)} className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-success" : "bg-primary"}`} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xs text-muted-foreground font-medium">{progress.toFixed(0)}% concluído</p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleWithdraw(goal, 100)}
                      className="flex items-center gap-1 text-[11px] font-bold text-destructive hover:opacity-80 transition-all"
                    >
                      <ArrowDownCircle className="h-3.5 w-3.5" /> Retirar
                    </button>
                    <button 
                      onClick={() => handleDeposit(goal, 100)}
                      className="flex items-center gap-1 text-[11px] font-bold text-success hover:opacity-80 transition-all"
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5" /> Depositar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <NewGoalModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}
