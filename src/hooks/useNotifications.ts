import { useCallback, useEffect, useId, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

const LIMIT = 30;

/** Notifications du compte connecté, tenues à jour en temps réel. */
export function useNotifications() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [available, setAvailable] = useState(true);
  // Plusieurs cloches peuvent être montées (menu latéral et barre mobile) : un canal chacune.
  const instance = useId();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from("notifications" as never).select("id, kind, title, body, link, read_at, created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(LIMIT);
    // Table absente (migration pas encore appliquée) : la cloche se masque.
    if (error) { setAvailable(false); return; }
    setAvailable(true);
    setItems((data ?? []) as unknown as AppNotification[]);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    load();
    const channel = supabase
      .channel(`notifications-${userId}-${instance}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, load, instance]);

  const markRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    const now = new Date().toISOString();
    setItems((list) => list.map((n) => (ids.includes(n.id) && !n.read_at ? { ...n, read_at: now } : n)));
    await supabase.from("notifications" as never).update({ read_at: now } as never).in("id", ids).is("read_at", null);
  }, []);

  const unread = items.filter((n) => !n.read_at);
  return { items, unreadCount: unread.length, available, markRead, markAllRead: () => markRead(unread.map((n) => n.id)) };
}
