import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant" | "human";
  content: string;
  created_at: string;
}

export interface AssistantThread {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  user_id?: string;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-assistant`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Liste des conversations de l'utilisateur connecté. */
export function useAssistantThreads(userId: string | null) {
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setThreads([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("support_threads")
      .select("id, title, status, updated_at")
      .order("updated_at", { ascending: false });
    if (error) console.error("load threads", error);
    setThreads((data as AssistantThread[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createThread = useCallback(async () => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("support_threads")
      .insert({ user_id: userId })
      .select("id, title, status, updated_at")
      .single();
    if (error) {
      console.error("create thread", error);
      return null;
    }
    setThreads((prev) => [data as AssistantThread, ...prev]);
    return data as AssistantThread;
  }, [userId]);

  const setStatus = useCallback(async (threadId: string, status: string) => {
    const { error } = await supabase
      .from("support_threads")
      .update({ status })
      .eq("id", threadId);
    if (error) return console.error("update thread", error);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, status } : t)));
  }, []);

  const deleteThread = useCallback(async (threadId: string) => {
    const { error } = await supabase.from("support_threads").delete().eq("id", threadId);
    if (error) return console.error("delete thread", error);
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
  }, []);

  // Rafraîchit la liste quand un fil change (réponse humaine, escalade...).
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`support-threads-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_threads" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return { threads, loading, refresh, createThread, setStatus, deleteThread };
}

/** Toutes les conversations (admin). */
export function useAdminSupportThreads(enabled: boolean) {
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("support_threads")
      .select("id, title, status, updated_at, user_id")
      .order("updated_at", { ascending: false });
    if (error) console.error("load admin threads", error);
    setThreads((data as AssistantThread[]) ?? []);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-support-threads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_threads" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, refresh]);

  const setStatus = useCallback(async (threadId: string, status: string) => {
    const { error } = await supabase
      .from("support_threads")
      .update({ status })
      .eq("id", threadId);
    if (error) return console.error("update thread", error);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, status } : t)));
  }, []);

  return { threads, loading, refresh, setStatus };
}

/** Messages d'une conversation + envoi en streaming. */
export function useAssistantChat(threadId: string | null, persist: boolean, escalated = false) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages([]);
    setError(null);
    if (!threadId || !persist) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("support_messages")
        .select("id, role, content, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (active) setMessages((data as AssistantMessage[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [threadId, persist]);

  // Temps réel : réceptionne les réponses humaines (et les messages de l'autre côté).
  useEffect(() => {
    if (!threadId || !persist) return;
    const channel = supabase
      .channel(`support-messages-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const msg = payload.new as AssistantMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            // évite le doublon avec l'optimistic update local
            if (
              prev.some(
                (m) =>
                  m.role === msg.role &&
                  m.content === msg.content &&
                  Math.abs(
                    new Date(m.created_at).getTime() - new Date(msg.created_at).getTime(),
                  ) < 5000,
              )
            ) {
              return prev;
            }
            return [...prev, msg];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, persist]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  /** Bascule le fil en attente d'une réponse humaine + notifie l'équipe. */
  const escalate = useCallback(async () => {
    if (!persist || !threadId) return false;
    const { error: upErr } = await supabase
      .from("support_threads")
      .update({ status: "escalated" })
      .eq("id", threadId);
    if (upErr) {
      console.error("escalate thread", upErr);
      setError("Impossible de contacter l'équipe pour le moment.");
      return false;
    }
    const notice: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "J'ai transmis votre demande à l'équipe Kistone. Un humain vous répondra directement dans cette conversation.",
      created_at: new Date().toISOString(),
    };
    await supabase
      .from("support_messages")
      .insert({ thread_id: threadId, role: "assistant", content: notice.content });
    setMessages((prev) => [...prev, notice]);
    supabase.functions
      .invoke("notify-support-escalation", { body: { thread_id: threadId } })
      .catch((e) => console.error("notify escalation", e));
    return true;
  }, [persist, threadId]);

  const sendMessage = useCallback(
    async (text: string, onTitle?: (title: string) => void) => {
      const content = text.trim();
      if (!content || streaming) return;
      setError(null);

      const userMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      const history = [...messages, userMsg];
      setMessages(history);

      if (persist && threadId) {
        const { error: insErr } = await supabase
          .from("support_messages")
          .insert({ thread_id: threadId, role: "user", content });
        if (insErr) console.error("save user message", insErr);
        if (messages.length === 0) {
          const title = content.length > 60 ? `${content.slice(0, 57)}…` : content;
          await supabase.from("support_threads").update({ title }).eq("id", threadId);
          onTitle?.(title);
        } else {
          await supabase
            .from("support_threads")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", threadId);
        }
      }

      // Fil escaladé : c'est un humain qui répond, on n'appelle pas l'IA.
      if (escalated) return;

      setStreaming(true);
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", created_at: new Date().toISOString() },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;
      let full = "";

      try {
        const res = await fetch(FN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ANON_KEY}`,
            apikey: ANON_KEY,
          },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "L'assistant est momentanément indisponible.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)),
          );
        }

        if (!full.trim()) {
          full = "Je n'ai pas réussi à formuler de réponse. Pouvez-vous reformuler ?";
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)),
          );
        }

        if (persist && threadId) {
          const { error: aErr } = await supabase
            .from("support_messages")
            .insert({ thread_id: threadId, role: "assistant", content: full });
          if (aErr) console.error("save assistant message", aErr);
          await supabase
            .from("support_threads")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", threadId);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
        } else {
          setError(e instanceof Error ? e.message : "Erreur inconnue");
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [escalated, messages, persist, streaming, threadId],
  );

  return { messages, loading, streaming, error, sendMessage, stop, escalate };
}

/** Côté admin : messages d'un fil + réponse humaine. */
export function useAdminSupportChat(threadId: string | null) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("support_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) console.error("load admin messages", error);
    setMessages((data as AssistantMessage[]) ?? []);
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`admin-support-messages-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const msg = payload.new as AssistantMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  const reply = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!threadId || !content) return false;
      setSending(true);
      const { data, error } = await supabase
        .from("support_messages")
        .insert({ thread_id: threadId, role: "human", content })
        .select("id, role, content, created_at")
        .single();
      if (error) {
        console.error("send human reply", error);
        setSending(false);
        return false;
      }
      setMessages((prev) =>
        prev.some((m) => m.id === (data as AssistantMessage).id)
          ? prev
          : [...prev, data as AssistantMessage],
      );
      await supabase
        .from("support_threads")
        .update({ status: "escalated", updated_at: new Date().toISOString() })
        .eq("id", threadId);
      setSending(false);
      return true;
    },
    [threadId],
  );

  return { messages, loading, sending, reply, reload: load };
}
