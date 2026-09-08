import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
}

const ChatPanel = ({
  open,
  onOpenChange,
  currentUserId,
  otherUserId,
  otherUserName,
}: ChatPanelProps) => {
  const { messages, loading, sendMessage, markAsRead } = useChat(
    currentUserId,
    otherUserId
  );
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark as read when panel opens
  useEffect(() => {
    if (open) markAsRead();
  }, [open, markAsRead, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Chat avec {otherUserName}</SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {loading && (
            <p className="text-center text-sm text-muted-foreground">Chargement…</p>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Aucun message. Commencez la conversation !
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  <p>{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 border-t pt-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Votre message…"
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ChatPanel;
