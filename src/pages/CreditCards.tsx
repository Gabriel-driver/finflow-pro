import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { Plus, CreditCard, Calendar } from "lucide-react";
import { useState } from "react";
import { NewCreditCardModal } from "@/components/NewCreditCardModal";

export default function CreditCards() {
  const { creditCards } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AppLayout title="Cartões de Crédito">
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-muted-foreground text-sm">Gerencie seus cartões e faturas</p>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Novo Cartão
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creditCards.map((cc, i) => {
            const usedPct = (cc.used / cc.limit) * 100;
            const available = cc.limit - cc.used;
            const isHigh = usedPct > 80;

            return (
              <div key={cc.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}>
                {/* Card visual */}
                <div className="relative rounded-2xl p-6 overflow-hidden h-48"
                  style={{
                    background: `linear-gradient(135deg, ${cc.color}, hsl(var(--card)))`,
                    boxShadow: `0 12px 40px -8px ${cc.color}40`,
                  }}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px]"
                    style={{ background: `${cc.color}30` }} />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-foreground/60 font-medium">Cartão de Crédito</p>
                        <p className="text-lg font-bold mt-0.5">{cc.name}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-foreground/40" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground/50 mb-0.5">•••• •••• •••• {String(Math.floor(Math.random() * 9000 + 1000))}</p>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                          <Calendar className="h-3 w-3" />
                          <span>Fecha dia {cc.closingDay}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                          <Calendar className="h-3 w-3" />
                          <span>Vence dia {cc.dueDay}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage bar */}
                <div className="glass-card rounded-xl p-5 -mt-4 relative z-10 mx-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Fatura atual</span>
                    <span className={`text-sm font-bold tabular-nums ${isHigh ? "text-destructive" : "text-foreground"}`}>{formatCurrency(cc.used)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-700 ${isHigh ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(usedPct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Disponível: {formatCurrency(available)}</span>
                    <span>Limite: {formatCurrency(cc.limit)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div onClick={() => setModalOpen(true)}
            className="border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer min-h-[280px] animate-slide-up"
            style={{ animationDelay: `${creditCards.length * 100}ms`, animationFillMode: "backwards" }}>
            <Plus className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Adicionar Cartão</span>
          </div>
        </div>
      </div>
      <NewCreditCardModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}
