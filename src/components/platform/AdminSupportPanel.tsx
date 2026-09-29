import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, CheckCircle2, Send, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminSupportChat, useAdminSupportThreads } from "@/hooks/useAssistant";
import { cn } from "@/lib/utils";

const statusLabel = (s: string) =>
  s === "escalated" ? "Humain demandé" : s === "resolved" ? "Résolue" : "Ouverte";

const AdminSupportPanel = () => {
  const { threads, loading, setStatus } = useAdminSupportThreads(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, sending, reply } = useAdminSupportChat(activeId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId && threads.length > 0) {
      setActiveId(threads.find((t) => t.status === "escalated")?.id ?? threads[0].id);
    }
  }, [threads, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const active = threads.find((t) => t.id === activeId) ?? null;

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const ok = await reply(text);
    if (ok) setDraft("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3 text-sm font-semibold">
          Conversations assistant ({threads.length})
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {loading && <p className="p-4 text-sm text-muted-foreground">Chargement…</p>}
          {!loading && threads.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucune conversation.</p>
          )}
          <ul>
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    "w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/60",
                    t.id === activeId && "bg-muted",
                  )}
                >
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant={t.status === "escalated" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {statusLabel(t.status)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(t.updated_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex min-h-[500px] flex-col rounded-lg border bg-card">
        {!active ? (
          <p className="m-auto text-sm text-muted-foreground">
            Sélectionnez une conversation pour répondre.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{active.title}</p>
                <p className="text-xs text-muted-foreground">{statusLabel(active.status)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setStatus(active.id, active.status === "resolved" ? "open" : "resolved")
                }
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {active.status === "resolved" ? "Rouvrir" : "Marquer résolue"}
              </Button>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-muted"
                        : m.role === "human"
                          ? "bg-primary text-primary-foreground"
                          : "border bg-background",
                    )}
                  >
                    <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-70">
                      {m.role === "user" ? (
                        <>
                          <UserRound className="h-3 w-3" /> Visiteur
                        </>
                      ) : m.role === "human" ? (
                        <>
                          <UserRound className="h-3 w-3" /> Vous
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3" /> Assistant IA
                        </>
                      )}
                    </p>
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-end gap-2 border-t p-3">
              <textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Répondre en tant qu'humain…"
                className="min-h-[44px] flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none"
              />
              <Button onClick={send} disabled={sending || !draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSupportPanel;
