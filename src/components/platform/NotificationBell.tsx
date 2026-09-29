import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const ago = (iso: string) => {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return d < 7 ? `il y a ${d} j` : new Date(iso).toLocaleDateString("fr-FR");
};

/** Cloche des notifications : pastille du nombre non lu, liste, lien vers l'écran concerné. */
export default function NotificationBell({ className }: { className?: string }) {
  const { items, unreadCount, available, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!available) return null;

  const openItem = (n: AppNotification) => {
    markRead([n.id]);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Notifications"}
          className={cn("relative flex h-11 w-11 items-center justify-center rounded-full border border-input bg-card transition-colors hover:bg-muted", className)}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground" aria-hidden="true">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Tout lire
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Rien de nouveau pour le moment.</p>
        ) : (
          <ul className="max-h-[60vh] overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="border-b border-border last:border-0">
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60", !n.read_at && "bg-primary/5")}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className={cn("block text-sm", !n.read_at && "font-semibold")}>{n.title}</span>
                    {n.body ? <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span> : null}
                    <span className="mt-1 block text-xs text-muted-foreground">{ago(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
