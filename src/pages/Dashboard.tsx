import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Linkedin, Calendar, LogOut, Trash2, MessageCircle, Building2, Star, Settings2, CheckCircle2, FileText, Users, Receipt, Briefcase, BarChart3, Send, X, MessageSquare, Sparkles, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/KistoneHeader";
import ChatPanel from "@/components/connect2/ChatPanel";
import AdminNeedsPanel from "@/components/connect2/AdminNeedsPanel";
import AdminProfilePanel from "@/components/connect2/AdminProfilePanel";
import ProfileDetailModal, { type FullProfile } from "@/components/connect2/ProfileDetailModal";
import DashboardSkeletons from "@/components/connect2/DashboardSkeletons";
import KanbanView from "@/components/connect2/KanbanView";
import AdminBlogPanel from "@/components/connect2/AdminBlogPanel";
import AdminClientsPanel from "@/components/connect2/AdminClientsPanel";
import AdminTimesheetsPanel from "@/components/connect2/AdminTimesheetsPanel";
import { WhatsAppDialog } from "@/components/connect2/WhatsAppDialog";
import AdminMissionsPanel from "@/components/connect2/AdminMissionsPanel";
import DashboardFilters from "@/components/connect2/DashboardFilters";
import AdminKPIPanel from "@/components/connect2/AdminKPIPanel";
import AdminMessagesPanel from "@/components/connect2/AdminMessagesPanel";
import AdminSupportPanel from "@/components/connect2/AdminSupportPanel";
import AdminGlobalPipelinePanel from "@/components/connect2/AdminGlobalPipelinePanel";
import AdminStudioPanel from "@/components/connect2/AdminStudioPanel";

type Profile = FullProfile;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "kpi";
  const initialNeedId = searchParams.get("need");
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<Profile | null>(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminPanelProfile, setAdminPanelProfile] = useState<Profile | null>(null);
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [clientChatOpen, setClientChatOpen] = useState(false);
  const [clientChatTarget, setClientChatTarget] = useState<{ userId: string; name: string } | null>(null);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappTarget, setWhatsappTarget] = useState<Profile | null>(null);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkBarOpen, setBulkBarOpen] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  // Fetch unread messages count
  useEffect(() => {
    if (!adminId) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", adminId)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    fetchUnread();

    const channel = supabase
      .channel("unread-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${adminId}` }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [adminId]);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const redirectPath = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
      return;
    }
    
    // Vérifier le rôle admin
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
    if (!isAdmin) {
      toast({ title: "Accès refusé", description: "Vous n'avez pas les droits administrateur.", variant: "destructive" });
      navigate("/");
      return;
    }
    
    setAdminId(session.user.id);
    loadProfiles();
  };

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recruiter_profiles" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les profils.", variant: "destructive" });
    } else {
      setProfiles((data as any) || []);
    }
    setLoading(false);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteProfileName = deleteConfirmId
    ? (() => { const p = profiles.find((p) => p.id === deleteConfirmId); return p ? `${p.first_name} ${p.last_name}` : ""; })()
    : "";

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("recruiter_profiles" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Profil supprimé" });
    }
    setDeleteConfirmId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const toggleSelect = (profileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProfiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProfiles.map((p) => p.id)));
    }
  };

  const handleBulkSend = async () => {
    if (!adminId || !bulkMessage.trim() || selectedIds.size === 0) return;
    setBulkSending(true);
    let sent = 0;
    let skipped = 0;
    const selectedProfiles = profiles.filter((p) => selectedIds.has(p.id));
    for (const profile of selectedProfiles) {
      if (!profile.user_id) { skipped++; continue; }
      const conversationId = [adminId, profile.user_id].sort().join("_");
      const { error } = await supabase.from("messages" as any).insert({
        conversation_id: conversationId,
        sender_id: adminId,
        receiver_id: profile.user_id,
        content: bulkMessage.trim(),
      });
      if (!error) sent++;
    }
    setBulkSending(false);
    const desc = skipped > 0
      ? `${sent} envoyé${sent > 1 ? "s" : ""}, ${skipped} ignoré${skipped > 1 ? "s" : ""} (pas de compte).`
      : `${sent} freelance${sent > 1 ? "s" : ""} contacté${sent > 1 ? "s" : ""}.`;
    toast({ title: "Messages envoyés ✅", description: desc });
    setSelectedIds(new Set());
    setBulkMessage("");
    setBulkBarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Dashboard Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gérez les freelances et les besoins clients.</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} msg non lu{unreadCount > 1 ? "s" : ""}</Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} className="w-full" onValueChange={(v) => { const next = new URLSearchParams(searchParams); next.set("tab", v); setSearchParams(next, { replace: true }); }}>
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="kpi" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              KPI
            </TabsTrigger>
            <TabsTrigger value="recruiters" className="text-xs sm:text-sm">Freelances ({profiles.length})</TabsTrigger>
            <TabsTrigger value="needs" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Besoins
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Pipeline global
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="missions" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Missions
            </TabsTrigger>
            <TabsTrigger value="timesheets" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              CRA
            </TabsTrigger>
            <TabsTrigger value="studio" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Studio
            </TabsTrigger>
            <TabsTrigger value="assistant" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] h-4 min-w-[16px] flex items-center justify-center px-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kpi">
            <AdminKPIPanel />
          </TabsContent>

          <TabsContent value="recruiters">
            <DashboardFilters
              profiles={profiles}
              onFiltered={setFilteredProfiles}
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {/* Selection bar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={toggleSelectAll}>
                <Checkbox checked={filteredProfiles.length > 0 && selectedIds.size === filteredProfiles.length} className="pointer-events-none" />
                {selectedIds.size > 0 ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? "s" : ""}` : "Tout sélectionner"}
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <Button size="sm" className="gap-2" onClick={() => setBulkBarOpen(true)}>
                    <Send className="h-3.5 w-3.5" />
                    Message groupé ({selectedIds.size})
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-3 w-3" /> Désélectionner
                  </Button>
                </>
              )}
            </div>

            {/* Bulk message input */}
            {bulkBarOpen && selectedIds.size > 0 && (
              <div className="mb-4 rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Envoyer à {selectedIds.size} freelance{selectedIds.size > 1 ? "s" : ""}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBulkBarOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Ex: Pensez à mettre à jour votre disponibilité 📅"
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
                <Button onClick={handleBulkSend} disabled={bulkSending || !bulkMessage.trim()} className="gap-2">
                  <Send className="h-4 w-4" />
                  {bulkSending ? "Envoi…" : "Envoyer"}
                </Button>
              </div>
            )}

            {loading ? (
              <DashboardSkeletons />
            ) : viewMode === "kanban" ? (
              <KanbanView
                profiles={filteredProfiles}
                onClickProfile={(p) => setDetailProfile(p)}
                onOpenChat={(p) => { setChatTarget(p); setChatOpen(true); }}
                onOpenAdmin={(p) => { setAdminPanelProfile(p); setAdminPanelOpen(true); }}
                onOpenWhatsApp={(p) => { setWhatsappTarget(p); setWhatsappOpen(true); }}
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProfiles.map((profile) => (
                    <Card key={profile.id} className={`group relative cursor-pointer transition-shadow hover:shadow-lg ${selectedIds.has(profile.id) ? "ring-2 ring-primary" : ""}`} onClick={() => setDetailProfile(profile)}>
                      <div className="absolute left-3 top-3 z-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(profile.id)}
                          onCheckedChange={() => toggleSelect(profile.id)}
                        />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(profile.id); }}
                        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <CardContent className="p-4 sm:p-6">
                        <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
                          <Avatar className="h-10 w-10 sm:h-14 sm:w-14">
                            {profile.photo_url && <AvatarImage src={profile.photo_url} />}
                            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground sm:text-lg">
                              {profile.first_name[0]}{profile.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold sm:text-base flex items-center gap-1.5">
                              {profile.first_name} {profile.last_name}
                              {profile.super_tam && <span title="Super TAM">🥇</span>}
                            </h3>
                            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                              {profile.model && (
                                <Badge variant={profile.model === "RPO" ? "default" : "secondary"} className="text-[10px] sm:text-xs">{profile.model}</Badge>
                              )}
                              {profile.tjm && <span>{profile.tjm}€/j</span>}
                              {(profile.admin_rating ?? 0) > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="text-xs">{profile.admin_rating}/5</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {profile.skills && profile.skills.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {profile.skills.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        )}

                        {profile.clients && profile.clients.length > 0 && (
                          <div className="mb-3 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Clients : </span>
                            {profile.clients.join(", ")}
                          </div>
                        )}

                        <div className="mb-3 flex items-center gap-2 text-sm">
                          {profile.available !== false ? (
                            <span className="flex items-center gap-1.5 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />Disponible
                            </span>
                          ) : profile.availability_date ? (
                            <span className="flex items-center gap-1.5 text-orange-500">
                              <Calendar className="h-3.5 w-3.5" />
                              Dispo. {new Date(profile.availability_date).toLocaleDateString("fr-FR")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-orange-500">
                              <Calendar className="h-3.5 w-3.5" />Indisponible
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 text-sm">
                          <button onClick={(e) => { e.stopPropagation(); setAdminPanelProfile(profile); setAdminPanelOpen(true); }} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent" title="Fiche admin">
                            <Settings2 className="h-4 w-4" />
                          </button>
                          {profile.user_id && (
                            <button onClick={(e) => { e.stopPropagation(); setChatTarget(profile); setChatOpen(true); }} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" title="Envoyer un message">
                              <MessageCircle className="h-4 w-4" />
                            </button>
                          )}
                          {profile.phone && (
                            <button onClick={(e) => { e.stopPropagation(); setWhatsappTarget(profile); setWhatsappOpen(true); }} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-green-500/10 hover:text-green-600" title="Envoyer un WhatsApp">
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                          {profile.phone && <span className="text-xs text-muted-foreground">{profile.phone}</span>}
                          {profile.linkedin_url && (
                            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredProfiles.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    {profiles.length === 0 ? "Aucun freelance inscrit pour le moment." : "Aucun freelance ne correspond à vos critères."}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="needs">
            <AdminNeedsPanel initialNeedId={initialNeedId} />
          </TabsContent>

          <TabsContent value="pipeline">
            <AdminGlobalPipelinePanel />
          </TabsContent>

          <TabsContent value="blog">
            <AdminBlogPanel />
          </TabsContent>

          <TabsContent value="clients">
            <AdminClientsPanel onOpenChat={(userId, name) => { setClientChatTarget({ userId, name }); setClientChatOpen(true); }} />
          </TabsContent>

          <TabsContent value="missions">
            <AdminMissionsPanel />
          </TabsContent>

          <TabsContent value="timesheets">
            <AdminTimesheetsPanel />
          </TabsContent>

          <TabsContent value="studio">
            <AdminStudioPanel />
          </TabsContent>

          <TabsContent value="assistant">
            <AdminSupportPanel />
          </TabsContent>

          <TabsContent value="messages">
            {adminId && <AdminMessagesPanel adminId={adminId} />}
          </TabsContent>
        </Tabs>
      </main>

      {adminId && chatTarget?.user_id && (
        <ChatPanel open={chatOpen} onOpenChange={setChatOpen} currentUserId={adminId} otherUserId={chatTarget.user_id} otherUserName={`${chatTarget.first_name} ${chatTarget.last_name}`} />
      )}

      {adminId && clientChatTarget && (
        <ChatPanel open={clientChatOpen} onOpenChange={setClientChatOpen} currentUserId={adminId} otherUserId={clientChatTarget.userId} otherUserName={clientChatTarget.name} />
      )}

      {adminPanelProfile && (
        <AdminProfilePanel profileId={adminPanelProfile.id} profileName={`${adminPanelProfile.first_name} ${adminPanelProfile.last_name}`} open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} onSaved={() => loadProfiles()} />
      )}

      {whatsappTarget && (
        <WhatsAppDialog
          open={whatsappOpen}
          onOpenChange={(o) => { setWhatsappOpen(o); if (!o) setWhatsappTarget(null); }}
          recipientName={`${whatsappTarget.first_name} ${whatsappTarget.last_name}`}
          recipientPhone={whatsappTarget.phone}
        />
      )}

      {detailProfile && (
        <ProfileDetailModal
          profile={detailProfile}
          open={!!detailProfile}
          onClose={() => setDetailProfile(null)}
          onOpenChat={(p) => { setChatTarget(p); setChatOpen(true); }}
          onOpenAdmin={(p) => { setAdminPanelProfile(p); setAdminPanelOpen(true); }}
        />
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce profil</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le profil de <strong>{deleteProfileName}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
