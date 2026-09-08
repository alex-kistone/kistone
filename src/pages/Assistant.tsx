import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAssistantThreads } from "@/hooks/useAssistant";
import AssistantChat from "@/components/assistant/AssistantChat";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";

const Assistant = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const { threads, createThread, deleteThread, refresh } = useAssistantThreads(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
  }, []);

  // Sans thread dans l'URL : on ouvre la dernière conversation ou on en crée une.
  useEffect(() => {
    if (!ready || !userId || threadId) return;
    (async () => {
      if (threads.length > 0) {
        navigate(`/assistant/${threads[0].id}`, { replace: true });
      } else {
        const created = await createThread();
        if (created) navigate(`/assistant/${created.id}`, { replace: true });
      }
    })();
  }, [ready, userId, threadId, threads, createThread, navigate]);

  if (ready && !userId) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <SEO title="Assistant Kistone" description="Assistant de support Kistone." path="/assistant" />
        <h1 className="mb-3 text-2xl font-bold">Assistant Kistone</h1>
        <p className="mb-6 text-neutral-600">
          Connectez-vous pour retrouver l'historique de vos conversations, ou utilisez la bulle
          d'assistance en bas à droite du site.
        </p>
        <Link
          to="/login"
          className="inline-block rounded-xl border-2 border-black bg-[#E54D2A] px-5 py-2.5 font-semibold text-white shadow-[4px_4px_0_0_#000]"
        >
          Se connecter
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[100dvh] max-w-6xl gap-4 p-4">
      <SEO title="Assistant Kistone" description="Assistant de support Kistone." path="/assistant" />
      <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border-2 border-black bg-white p-3 md:flex">
        <button
          type="button"
          onClick={async () => {
            const created = await createThread();
            if (created) navigate(`/assistant/${created.id}`);
          }}
          className="mb-3 flex items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#E54D2A] px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Nouvelle conversation
        </button>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {threads.map((t) => (
            <li
              key={t.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border-2 px-3 py-2",
                t.id === threadId ? "border-black bg-neutral-50" : "border-neutral-200",
              )}
            >
              <button
                type="button"
                onClick={() => navigate(`/assistant/${t.id}`)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(t.updated_at).toLocaleDateString("fr-FR")}
                </p>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteThread(t.id);
                  if (t.id === threadId) navigate("/assistant", { replace: true });
                }}
                aria-label="Supprimer la conversation"
                className="text-neutral-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-black bg-white">
        <AssistantChat
          key={threadId ?? "none"}
          threadId={threadId ?? null}
          persist={Boolean(threadId)}
          escalated={threads.find((t) => t.id === threadId)?.status === "escalated"}
          onTitle={() => refresh()}
          onEscalated={() => refresh()}
        />
      </section>
    </main>
  );
};

export default Assistant;
