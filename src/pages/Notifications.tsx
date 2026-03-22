import { AppLayout } from "@/components/AppLayout";
import { useFinance } from "@/lib/finance-store";
import { Bell, BellOff, CheckCheck, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";

const typeConfig = {
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15" },
  info: { icon: Info, color: "text-accent", bg: "bg-accent/15" },
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/15" },
  danger: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15" },
};

export default function Notifications() {
  const { notifications, markNotificationRead, clearNotifications, getUnreadNotifications } = useFinance();
  const unread = getUnreadNotifications();

  return (
    <AppLayout title="Notificações">
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-muted-foreground text-sm">
            {unread > 0 ? `${unread} notificação(ões) não lida(s)` : "Tudo em dia! 🎉"}
          </p>
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors active:scale-[0.97]">
              <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center animate-slide-up">
            <BellOff className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma notificação</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Alertas de vencimento, orçamento e metas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => {
              const config = typeConfig[n.type];
              const Icon = config.icon;
              return (
                <div key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`glass-card rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-primary/20 animate-slide-up ${!n.read ? "border-l-2 border-l-primary" : "opacity-60"}`}
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}>
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">{new Date(n.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
