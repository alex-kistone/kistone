import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAssistantThreads } from "@/hooks/useAssistant";
import AssistantChat from "./AssistantChat";
import { cn } from "@/lib/utils";

const AssistantWidget = () => {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [guestKey, setGuestKey] = useState(() => crypto.randomUUID());

  const { threads, createThread, setStatus, deleteThread, refresh } = useAssistantThreads(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setActiveId(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Ouvre / crée une conversation quand le panneau s'ouvre pour un utilisateur connecté.
  useEffect(() => {
    if (!open || !userId || activeId) return;
    (async () => {
      await refresh();
      const openThread = threads.find((t) => t.status !== "resolved");
      if (openThread) {
        setActiveId(openThread.id);
      } else {
        const created = await createThread();
        if (created) setActiveId(created.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const handleNew = async () => {
    const created = await createThread();
    if (created) setActiveId(created.id);
    setShowList(false);
  };

  const handleResolve = async () => {
    if (!activeId) return;
    await setStatus(activeId, activeThread?.status === "resolved" ? "open" : "resolved");
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant Kistone"
          className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-[#E54D2A] text-white shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-[60] flex h-[min(640px,calc(100vh-2.5rem))] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0_0_#000]">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#E54D2A] via-[#E59500] to-[#E54D2A]" />

          <header className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {showList ? (
                <button
                  type="button"
                  onClick={() => setShowList(false)}
                  aria-label="Retour à la conversation"
                  className="text-neutral-500 hover:text-black"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E54D2A] text-sm font-bold text-white">
                  K
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-black">Assistant Kistone</p>
                <p className="truncate text-xs text-neutral-500">
                  {showList ? "Vos conversations" : "Produits, tarifs et support portail"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {userId && !showList && (
                <button
                  type="button"
                  onClick={() => setShowList(true)}
                  className="text-xs font-medium text-neutral-600 hover:text-black"
                >
                  Conversations
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer l'assistant"
                className="text-neutral-500 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {userId && !showList && activeThread && (
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs">
              <span className="truncate text-neutral-600">
                {activeThread.title} ·{" "}
                {activeThread.status === "resolved"
                  ? "résolue"
                  : activeThread.status === "escalated"
                    ? "avec l'équipe"
                    : "ouverte"}
              </span>
              <button
                type="button"
                onClick={handleResolve}
                className="flex shrink-0 items-center gap-1 font-medium text-neutral-700 hover:text-[#E54D2A]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activeThread.status === "resolved" ? "Rouvrir" : "Marquer résolue"}
              </button>
            </div>
          )}

          {showList ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <button
                type="button"
                onClick={handleNew}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E54D2A] px-3 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" /> Nouvelle conversation
              </button>
              {threads.length === 0 && (
                <p className="py-6 text-center text-sm text-neutral-500">
                  Aucune conversation pour le moment.
                </p>
              )}
              <ul className="space-y-2">
                {threads.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 px-3 py-2",
                      t.id === activeId ? "border-black bg-neutral-50" : "border-neutral-200",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(t.id);
                        setShowList(false);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-black">{t.title}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(t.updated_at).toLocaleDateString("fr-FR")} ·{" "}
                        {t.status === "resolved"
                          ? "résolue"
                          : t.status === "escalated"
                            ? "avec l'équipe"
                            : "ouverte"}
                      </p>
                    </button>
                    <Link
                      to={`/assistant/${t.id}`}
                      onClick={() => setOpen(false)}
                      className="shrink-0 text-xs text-neutral-500 underline hover:text-black"
                    >
                      Ouvrir
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        deleteThread(t.id);
                        if (t.id === activeId) setActiveId(null);
                      }}
                      aria-label="Supprimer la conversation"
                      className="shrink-0 text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <AssistantChat
                key={userId ? activeId ?? "pending" : guestKey}
                threadId={userId ? activeId : guestKey}
                persist={Boolean(userId && activeId)}
                escalated={activeThread?.status === "escalated"}
                onTitle={() => refresh()}
                onEscalated={() => refresh()}
              />
              {!userId && (
                <p className="border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-500">
                  <Link to="/login" className="underline">
                    Connectez-vous
                  </Link>{" "}
                  pour conserver l'historique de vos conversations.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AssistantWidget;
