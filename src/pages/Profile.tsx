import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import AppShell from "@/components/platform/AppShell";
import ChatPanel from "@/components/platform/ChatPanel";
import DeleteAccountButton from "@/components/platform/DeleteAccountButton";
import ExportDataButton from "@/components/platform/ExportDataButton";
import FreelanceMissionsSection from "@/components/platform/FreelanceMissionsSection";
import KycDossierPanel from "@/components/platform/KycDossierPanel";
import TransitionProfileForm, { type ProfileRow } from "@/components/platform/freelance/TransitionProfileForm";
import { useUnreadCount } from "@/hooks/useChat";
import { supabase } from "@/integrations/supabase/client";

/**
 * Espace freelance : profil (un seul écran), missions et CRA, dossier administratif, messages.
 * À la première visite, le profil se crée en remplissant le formulaire.
 */
const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [defaultNames, setDefaultNames] = useState({ first: "", last: "" });
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const unreadCount = useUnreadCount(userId);

  // Onglet piloté par le menu latéral (?tab=missions | admin) ; ils n'existent qu'une fois le profil créé
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = profile && (tabParam === "missions" || tabParam === "admin") ? tabParam : "profile";

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/register");
      return;
    }
    setUserId(session.user.id);
    setEmail(session.user.email || "");

    // /profile est l'espace freelance : l'admin et le client sont renvoyés vers le leur
    const [{ data: isAdmin }, { data: isClient }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "client" }),
    ]);
    if (isAdmin || isClient) {
      navigate(isAdmin ? "/dashboard" : "/client/dashboard", { replace: true });
      return;
    }

    const { data } = await supabase.from("recruiter_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
    setProfile((data as unknown as ProfileRow | null) ?? null);
    if (!data) {
      // Première visite : prénom et nom repris du compte Google / LinkedIn
      const meta = (session.user.user_metadata ?? {}) as Record<string, string | undefined>;
      const fullName = (meta.full_name ?? meta.name ?? "").trim();
      setDefaultNames({ first: meta.given_name ?? fullName.split(" ")[0] ?? "", last: meta.family_name ?? fullName.split(" ").slice(1).join(" ") });
    }

    const { data: adminId } = await supabase.rpc("get_admin_user_id" as never);
    if (adminId) setAdminUserId(adminId as string);
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-background lg:pl-[248px]">
        <AppShell role="freelance" />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const heading = activeTab === "missions"
    ? ["Mes missions & CRA", "Vos missions en cours et vos comptes rendus d'activité."]
    : activeTab === "admin"
    ? ["Mon administratif", "Les informations et documents administratifs de votre société."]
    : profile
    ? ["Mon profil", "Modifiez vos informations à tout moment."]
    : ["Rejoindre le réseau", "Cinq informations et quelques lignes sur votre parcours : un associé du cabinet vous contacte ensuite."];

  return (
    <div className="min-h-screen bg-background lg:pl-[248px]">
      <AppShell role="freelance" />
      <main className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{heading[0]}</h1>
          <p className="mt-1 text-muted-foreground">{heading[1]}</p>
        </div>

        {activeTab === "missions" ? (
          <FreelanceMissionsSection userId={userId} />
        ) : activeTab === "admin" ? (
          <KycDossierPanel party="freelance" userId={userId} email={email} />
        ) : (
          <>
            <TransitionProfileForm
              key={profile?.id ?? "new"}
              userId={userId}
              email={email}
              profile={profile}
              defaultNames={defaultNames}
              onSaved={() => loadProfile()}
            />
            {profile && (
              <div className="mt-8 flex items-center justify-between">
                <ExportDataButton userId={userId} profileType="freelance" />
                <DeleteAccountButton userId={userId} navigate={navigate} />
              </div>
            )}
          </>
        )}
      </main>

      {adminUserId && (
        <>
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
            title="Messages"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </button>
          <ChatPanel open={chatOpen} onOpenChange={setChatOpen} currentUserId={userId} otherUserId={adminUserId} otherUserName="Kistone" />
        </>
      )}
    </div>
  );
};

export default Profile;
