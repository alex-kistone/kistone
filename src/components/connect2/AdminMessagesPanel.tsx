import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import ChatPanel from "./ChatPanel";
import BulkMessageDialog from "./BulkMessageDialog";

interface Conversation {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserInitials: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  role: "freelance" | "client";
}

interface AdminMessagesPanelProps {
  adminId: string;
}

const AdminMessagesPanel = ({ adminId }: AdminMessagesPanelProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);

    // Get all messages involving the admin
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
      .order("created_at", { ascending: false });

    if (!messages || messages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Group by conversation_id, find the other user
    const convMap = new Map<string, {
      otherUserId: string;
      lastMessage: string;
      lastMessageAt: string;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const convId = msg.conversation_id;
      const otherUserId = msg.sender_id === adminId ? msg.receiver_id : msg.sender_id;

      if (!convMap.has(convId)) {
        convMap.set(convId, {
          otherUserId,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: 0,
        });
      }

      if (msg.receiver_id === adminId && !msg.read) {
        const conv = convMap.get(convId)!;
        conv.unreadCount++;
      }
    }

    // Look up user names from recruiter_profiles and client_profiles
    const otherUserIds = [...new Set([...convMap.values()].map((c) => c.otherUserId))];

    const [{ data: recruiterProfiles }, { data: clientProfiles }] = await Promise.all([
      supabase
        .from("recruiter_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", otherUserIds),
      supabase
        .from("client_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", otherUserIds),
    ]);

    const nameMap = new Map<string, { name: string; initials: string; role: "freelance" | "client" }>();
    for (const p of recruiterProfiles || []) {
      if (p.user_id) {
        nameMap.set(p.user_id, {
          name: `${p.first_name} ${p.last_name}`,
          initials: `${p.first_name?.[0] || ""}${p.last_name?.[0] || ""}`,
          role: "freelance",
        });
      }
    }
    for (const p of clientProfiles || []) {
      if (p.user_id && !nameMap.has(p.user_id)) {
        nameMap.set(p.user_id, {
          name: `${p.first_name} ${p.last_name}`,
          initials: `${p.first_name?.[0] || ""}${p.last_name?.[0] || ""}`,
          role: "client",
        });
      }
    }

    const result: Conversation[] = [];
    for (const [convId, conv] of convMap) {
      const info = nameMap.get(conv.otherUserId);
      result.push({
        conversationId: convId,
        otherUserId: conv.otherUserId,
        otherUserName: info?.name || "Utilisateur inconnu",
        otherUserInitials: info?.initials || "??",
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount,
        role: info?.role || "freelance",
      });
    }

    // Sort: unread first, then by date
    result.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    setConversations(result);
    setLoading(false);
  }, [adminId]);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel("admin-messages-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  const handleOpenChat = (conv: Conversation) => {
    setSelectedConv(conv);
    setChatOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `il y a ${mins < 1 ? "1" : mins} min`;
    }
    if (diffHours < 24) {
      return `il y a ${Math.floor(diffHours)}h`;
    }
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messagerie
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalUnread} non lu{totalUnread > 1 ? "s" : ""}
            </Badge>
          )}
        </h2>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setBulkOpen(true)}>
          <Users className="h-4 w-4" />
          Message groupé
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Aucune conversation pour le moment.
        </div>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => handleOpenChat(conv)}
                className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                  conv.unreadCount > 0 ? "bg-accent/20" : ""
                }`}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className={`text-sm font-semibold ${
                    conv.role === "client"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  }`}>
                    {conv.otherUserInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                      {conv.otherUserName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-xs ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          conv.role === "client"
                            ? "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                            : "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {conv.role === "client" ? "Client" : "Freelance"}
                      </Badge>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px] flex items-center justify-center">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {adminId && selectedConv && (
        <ChatPanel
          open={chatOpen}
          onOpenChange={(open) => {
            setChatOpen(open);
            if (!open) loadConversations();
          }}
          currentUserId={adminId}
          otherUserId={selectedConv.otherUserId}
          otherUserName={selectedConv.otherUserName}
        />
      )}

      <BulkMessageDialog open={bulkOpen} onOpenChange={setBulkOpen} adminId={adminId} />
    </div>
  );
};

export default AdminMessagesPanel;
