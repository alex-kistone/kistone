import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, Settings2, Linkedin, CheckCircle2, Calendar, Clock, MessageSquare } from "lucide-react";
import type { FullProfile } from "@/components/connect2/ProfileDetailModal";

type Profile = FullProfile;

interface KanbanViewProps {
  profiles: Profile[];
  onClickProfile: (p: Profile) => void;
  onOpenChat: (p: Profile) => void;
  onOpenAdmin: (p: Profile) => void;
  onOpenWhatsApp?: (p: Profile) => void;
}

type Column = {
  key: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  filter: (p: Profile) => boolean;
};

const isWithin30Days = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
};

const columns: Column[] = [
  {
    key: "available",
    title: "Disponible",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    color: "border-green-500/30 bg-green-500/5",
    filter: (p) => p.available !== false,
  },
  {
    key: "soon",
    title: "Bientôt disponible",
    icon: <Calendar className="h-4 w-4 text-orange-500" />,
    color: "border-orange-500/30 bg-orange-500/5",
    filter: (p) => p.available === false && !!p.availability_date && isWithin30Days(p.availability_date),
  },
  {
    key: "unavailable",
    title: "Indisponible",
    icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    color: "border-muted bg-muted/30",
    filter: (p) => p.available === false && (!p.availability_date || !isWithin30Days(p.availability_date)),
  },
];

const KanbanCard = ({
  profile,
  onClick,
  onChat,
  onAdmin,
  onWhatsApp,
}: {
  profile: Profile;
  onClick: () => void;
  onChat: () => void;
  onAdmin: () => void;
  onWhatsApp?: () => void;
}) => (
  <div
    onClick={onClick}
    className="cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
  >
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        {profile.photo_url && <AvatarImage src={profile.photo_url} />}
        <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
          {profile.first_name[0]}{profile.last_name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{profile.first_name} {profile.last_name}</span>
          {profile.super_tam && <span title="Super TAM">🥇</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {profile.model && (
            <Badge variant={profile.model === "RPO" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
              {profile.model}
            </Badge>
          )}
          {profile.tjm && <span>{profile.tjm}€/j</span>}
          {(profile.admin_rating ?? 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {profile.admin_rating}
            </span>
          )}
        </div>
      </div>
    </div>

    {profile.skills && profile.skills.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-1">
        {profile.skills.slice(0, 3).map((s) => (
          <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
        ))}
        {profile.skills.length > 3 && (
          <span className="text-[10px] text-muted-foreground">+{profile.skills.length - 3}</span>
        )}
      </div>
    )}

    <div className="mt-3 flex items-center justify-end gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onAdmin(); }}
        className="rounded-md p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent"
        title="Fiche admin"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>
      {profile.user_id && (
        <button
          onClick={(e) => { e.stopPropagation(); onChat(); }}
          className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"
          title="Message"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </button>
      )}
      {profile.phone && onWhatsApp && (
        <button
          onClick={(e) => { e.stopPropagation(); onWhatsApp(); }}
          className="rounded-md p-1 text-muted-foreground hover:bg-green-500/10 hover:text-green-600"
          title="Envoyer un WhatsApp"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
      )}
      {profile.linkedin_url && (
        <a
          href={profile.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-1 text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Linkedin className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  </div>
);

const KanbanView = ({ profiles, onClickProfile, onOpenChat, onOpenAdmin, onOpenWhatsApp }: KanbanViewProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const items = profiles.filter(col.filter);
        return (
          <div key={col.key} className={`rounded-xl border p-4 ${col.color}`}>
            <div className="mb-4 flex items-center gap-2">
              {col.icon}
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
            </div>
            <div className="space-y-3">
              {items.map((p) => (
                <KanbanCard
                  key={p.id}
                  profile={p}
                  onClick={() => onClickProfile(p)}
                  onChat={() => onOpenChat(p)}
                  onAdmin={() => onOpenAdmin(p)}
                  onWhatsApp={onOpenWhatsApp ? () => onOpenWhatsApp(p) : undefined}
                />
              ))}
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Aucun freelance</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanView;
