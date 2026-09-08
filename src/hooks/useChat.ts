import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useChat(currentUserId: string | null, otherUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Build a stable conversation_id from two user IDs
  const conversationId =
    currentUserId && otherUserId
      ? [currentUserId, otherUserId].sort().join("_")
      : null;

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data } = await supabase
      .from("messages" as any)
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data as any) || []);
    setLoading(false);
  }, [conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    await supabase
      .from("messages" as any)
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .eq("receiver_id", currentUserId)
      .eq("read", false);
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !currentUserId || !otherUserId || !content.trim()) return;

      // Optimistic update: show message immediately
      const optimisticMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: content.trim(),
        read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const { error } = await supabase.from("messages" as any).insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: content.trim(),
      });

      if (error) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      }
    },
    [conversationId, currentUserId, otherUserId]
  );

  // Load + subscribe
  useEffect(() => {
    if (!conversationId) return;
    loadMessages();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id || (m.sender_id === newMsg.sender_id && m.content === newMsg.content && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000))) {
                return prev;
              }
              return [...prev, newMsg];
            });
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === (payload.new as Message).id ? (payload.new as Message) : m))
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages]);

  return { messages, loading, sendMessage, markAsRead, conversationId };
}

// Hook to get unread count for a user
export function useUnreadCount(userId: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const { count: c } = await supabase
        .from("messages" as any)
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("read", false);
      setCount(c || 0);
    };
    load();

    const channel = supabase
      .channel(`unread-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
