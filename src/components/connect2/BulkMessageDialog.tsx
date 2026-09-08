import { useState, useEffect } from "react";
import { Send, Users, Filter, CheckSquare, Square, Loader2, MessageCircle, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FreelanceProfile {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  photo_url: string | null;
  available: boolean | null;
  model: string | null;
  sectors: string[] | null;
  phone: string | null;
}

interface BulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
}

const BulkMessageDialog = ({ open, onOpenChange, adminId }: BulkMessageDialogProps) => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<FreelanceProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<"chat" | "whatsapp">("chat");

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("recruiter_profiles")
        .select("id, user_id, first_name, last_name, email, photo_url, available, model, sectors, phone")
        .order("first_name");
      setProfiles((data as FreelanceProfile[]) || []);
      setLoading(false);
    };
    load();
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setMessage("");
      setSearch("");
      setFilterAvailability("all");
      setFilterModel("all");
      setChannel("chat");
    }
  }, [open]);

  const filtered = profiles.filter((p) => {
    if (!p.user_id) return false;
    if (channel === "whatsapp" && !p.phone) return false;
    const matchSearch =
      `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase());
    const matchAvail =
      filterAvailability === "all" ||
      (filterAvailability === "available" && p.available !== false) ||
      (filterAvailability === "unavailable" && p.available === false);
    const matchModel =
      filterModel === "all" || p.model === filterModel;
    return matchSearch && matchAvail && matchModel;
  });

  const withoutPhoneCount = profiles.filter((p) => p.user_id && !p.phone).length;

  const models = [...new Set(profiles.map((p) => p.model).filter(Boolean))] as string[];

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.user_id!)));
    }
  };

  const toggleOne = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = async () => {
    if (!message.trim() || selected.size === 0) return;
    setSending(true);

    let sent = 0;
    let errors = 0;

    if (channel === "chat") {
      for (const userId of selected) {
        const conversationId = [adminId, userId].sort().join("_");
        const { error } = await supabase.from("messages" as any).insert({
          conversation_id: conversationId,
          sender_id: adminId,
          receiver_id: userId,
          content: message.trim(),
        });
        if (error) {
          errors++;
          console.error("Bulk message error:", error);
        } else {
          sent++;
        }
      }
    } else {
      // WhatsApp: invoke send-whatsapp edge function per recipient
      const selectedProfiles = profiles.filter((p) => p.user_id && selected.has(p.user_id));
      for (const p of selectedProfiles) {
        if (!p.phone) {
          errors++;
          continue;
        }
        try {
          const { data, error } = await supabase.functions.invoke("send-whatsapp", {
            body: { to: p.phone, message: message.trim() },
          });
          if (error) throw error;
          if ((data as any)?.error) throw new Error((data as any).error);
          sent++;
        } catch (err) {
          errors++;
          console.error("Bulk WhatsApp error for", p.email, err);
        }
      }
    }

    setSending(false);

    const channelLabel = channel === "whatsapp" ? "WhatsApp" : "Messages";
    if (errors === 0) {
      toast({
        title: `${channelLabel} envoyé${sent > 1 ? "s" : ""} ✅`,
        description: `${sent} freelance${sent > 1 ? "s" : ""} contacté${sent > 1 ? "s" : ""}.`,
      });
    } else {
      toast({
        title: "Envoi partiel",
        description: `${sent} envoyé${sent > 1 ? "s" : ""}, ${errors} erreur${errors > 1 ? "s" : ""}.`,
        variant: "destructive",
      });
    }

    onOpenChange(false);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.user_id!));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Message groupé
          </DialogTitle>
          <DialogDescription>
            {channel === "chat"
              ? "Envoyez un message à plusieurs freelances dans leur conversation privée."
              : "Envoyez un WhatsApp à plusieurs freelances. Seuls ceux ayant un numéro renseigné apparaissent."}
          </DialogDescription>
        </DialogHeader>

        {/* Channel switcher */}
        <Tabs value={channel} onValueChange={(v) => { setChannel(v as "chat" | "whatsapp"); setSelected(new Set()); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Chat in-app
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {channel === "whatsapp" && withoutPhoneCount > 0 && (
          <p className="text-xs text-muted-foreground -mt-1">
            {withoutPhoneCount} freelance{withoutPhoneCount > 1 ? "s" : ""} sans numéro masqué{withoutPhoneCount > 1 ? "s" : ""}.
          </p>
        )}

        {/* Message */}
        <div>
          <Textarea
            placeholder={channel === "whatsapp"
              ? "Votre message WhatsApp… (max 1500 caractères)"
              : "Votre message… ex: Pensez à mettre à jour votre disponibilité 📅"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={channel === "whatsapp" ? 1500 : undefined}
            className="resize-none"
          />
          {channel === "whatsapp" && (
            <p className="text-xs text-muted-foreground mt-1 text-right">{message.length} / 1500</p>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-40 text-xs"
          />
          <Select value={filterAvailability} onValueChange={setFilterAvailability}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="unavailable">Indisponibles</SelectItem>
            </SelectContent>
          </Select>
          {models.length > 0 && (
            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout modèle</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Select all */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {allFilteredSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {allFilteredSelected ? "Tout désélectionner" : `Tout sélectionner (${filtered.length})`}
          </button>
          <Badge variant="secondary" className="text-xs">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Profile list */}
        <ScrollArea className="flex-1 min-h-0 max-h-[300px] border rounded-lg">
          <div className="p-1 space-y-0.5">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Chargement…</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Aucun freelance trouvé.</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.user_id}
                  onClick={() => toggleOne(p.user_id!)}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/50 ${
                    selected.has(p.user_id!) ? "bg-primary/5" : ""
                  }`}
                >
                  <Checkbox
                    checked={selected.has(p.user_id!)}
                    className="pointer-events-none"
                  />
                  <Avatar className="h-8 w-8 shrink-0">
                    {p.photo_url && <AvatarImage src={p.photo_url} />}
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs font-semibold">
                      {p.first_name[0]}{p.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{p.first_name} {p.last_name}</span>
                      {p.model && <Badge variant="outline" className="text-[10px] px-1 py-0">{p.model}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground truncate block">{p.email}</span>
                  </div>
                  <div className="shrink-0">
                    {p.available !== false ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-orange-400 block" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={sending || !message.trim() || selected.size === 0}
          className="w-full gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi en cours… ({selected.size})
            </>
          ) : (
            <>
              {channel === "whatsapp" ? <MessageSquare className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {channel === "whatsapp" ? "Envoyer WhatsApp" : "Envoyer"} à {selected.size} freelance{selected.size > 1 ? "s" : ""}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BulkMessageDialog;
