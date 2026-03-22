import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { NewGoalModal } from "@/components/NewGoalModal";

export default function Goals() {
  const { goals, deleteGoal, updateGoal } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);

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
                  <span className="text-2xl">{goal.icon}</span>
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
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">{progress.toFixed(0)}%</p>
                  {!isComplete && (
                    <button onClick={() => updateGoal(goal.id, { current: Math.min(goal.current + 100, goal.target) })}
                      className="text-xs text-primary hover:underline">+ Depositar</button>
                  )}
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
