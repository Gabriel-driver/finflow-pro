import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { NewCategoryModal } from "@/components/NewCategoryModal";

export default function Categories() {
  const { categories, deleteCategory, getCategorySpending } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  return (
    <AppLayout title="Categorias">
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-muted-foreground text-sm">Organize suas finanças com categorias personalizadas</p>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Nova Categoria
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
            <h3 className="text-sm font-medium text-success mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" /> Entradas
            </h3>
            <div className="glass-card rounded-xl divide-y divide-border/30">
              {incomeCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-success/15 text-success font-medium">Entrada</span>
                    <button onClick={() => deleteCategory(cat.id)} className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
            <h3 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" /> Saídas
            </h3>
            <div className="glass-card rounded-xl divide-y divide-border/30">
              {expenseCategories.map((cat) => {
                const spent = getCategorySpending(cat.name, currentMonth);
                const pct = cat.budgetLimit ? (spent / cat.budgetLimit) * 100 : 0;
                return (
                  <div key={cat.id} className="px-5 py-4 hover:bg-muted/20 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.icon}</span>
                        <div>
                          <span className="font-medium text-sm">{cat.name}</span>
                          {cat.budgetLimit && (
                            <p className="text-xs text-muted-foreground">{formatCurrency(spent)} / {formatCurrency(cat.budgetLimit)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-destructive/15 text-destructive font-medium">Saída</span>
                        <button onClick={() => deleteCategory(cat.id)} className="p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {cat.budgetLimit && (
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                        <div className={`h-full rounded-full ${pct > 100 ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-primary"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <NewCategoryModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}
