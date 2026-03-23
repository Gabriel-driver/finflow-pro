import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { RefreshCw, ArrowUpRight, ArrowDownRight, Trash2, Pencil, Calendar, AlertCircle, Plus } from "lucide-react";
import { useState } from "react";
import { NewTransactionModal } from "@/components/NewTransactionModal";

export default function RecurringTransactions() {
  const { recurringRules, accounts, categories, creditCards, deleteRecurringRule } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState<any>(null);

  const handleEdit = (rule: any) => {
    setEditRule(rule);
    setModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setModalOpen(open);
    if (!open) setEditRule(null);
  };

  return (
    <AppLayout title="Contas Recorrentes">
      <div className="space-y-6">
        <div className="animate-fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">
              Gerencie suas despesas e receitas que se repetem todos os meses, como aluguel, assinaturas e salários.
            </p>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Nova Conta Recorrente
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          <div className="glass-card p-5 rounded-xl border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Recorrente</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(recurringRules.filter(r => r.active).reduce((sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount), 0))}
            </p>
          </div>
          
          <div className="glass-card p-5 rounded-xl border-l-4 border-l-success">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Entradas Fixas</span>
            </div>
            <p className="text-2xl font-bold text-success tabular-nums">
              {formatCurrency(recurringRules.filter(r => r.active && r.type === 'income').reduce((sum, r) => sum + r.amount, 0))}
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border-l-4 border-l-destructive">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Saídas Fixas</span>
            </div>
            <p className="text-2xl font-bold text-destructive tabular-nums">
              {formatCurrency(recurringRules.filter(r => r.active && r.type === 'expense').reduce((sum, r) => sum + r.amount, 0))}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20 bg-muted/30">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dia</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conta/Cartão</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Mensal</th>
                  <th className="px-3 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {recurringRules.map(rule => {
                  const account = accounts.find(a => a.id === rule.accountId);
                  const card = creditCards.find(c => c.id === rule.creditCardId);
                  const category = categories?.find(c => c.name === rule.category);
                  
                  return (
                    <tr key={rule.id} className="border-b border-border/20 hover:bg-muted/15 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${rule.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            <RefreshCw className={`h-4 w-4 ${rule.active ? "" : "opacity-30"}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${rule.active ? "" : "text-muted-foreground line-through"}`}>{rule.description}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{rule.type === 'income' ? 'Receita' : 'Despesa'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span>{category?.icon || "📁"}</span>
                          {rule.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground tabular-nums">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 opacity-50" />
                          Dia {rule.recurringDay}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {account ? (
                          <span className="flex items-center gap-1.5">
                            <span>{account.icon}</span>
                            {account.name}
                          </span>
                        ) : card ? (
                          <span className="flex items-center gap-1.5">
                            <span>💳</span>
                            {card.name}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${rule.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {rule.active ? "Ativa" : "Pausada"}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-sm font-semibold text-right tabular-nums ${rule.type === "income" ? "text-success" : "text-destructive"}`}>
                        {rule.type === "income" ? "+" : "-"}{formatCurrency(rule.amount)}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => handleEdit(rule)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteRecurringRule(rule.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {recurringRules.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 opacity-20" />
                </div>
                <p className="text-muted-foreground text-sm">Nenhuma conta recorrente cadastrada.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Crie uma nova conta recorrente para gerenciar seus gastos fixos.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-primary mb-1">O que são Contas Recorrentes?</p>
            <p className="text-muted-foreground leading-relaxed">
              Diferente das transações comuns, as Contas Recorrentes são **regras** que geram automaticamente uma nova transação todo mês. 
              Ideal para aluguel, condomínio, internet, Netflix e salários. O sistema gera a transação para você no dia escolhido.
            </p>
          </div>
        </div>
      </div>
      <NewTransactionModal 
        open={modalOpen} 
        onOpenChange={handleCloseModal} 
        editTransaction={editRule} 
        isRecurringRule={true}
      />
    </AppLayout>
  );
}
