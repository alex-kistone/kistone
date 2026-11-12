import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/platform/AppShell";
import MeetingRequestsList from "@/components/platform/MeetingRequestsList";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { clientHomePath } from "@/lib/clientOnboarding";

/** /client/visios : les demandes de visio du client et les visios confirmées. */
export default function ClientMeetings() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/client"); return; }
      const home = await clientHomePath(session.user.id);
      if (home !== "/client/dashboard") { navigate(home); return; }
      setReady(true);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background lg:pl-[248px]">
      <AppShell role="client" />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Mes visios</h1>
            <p className="mt-1 text-sm text-muted-foreground">Vos demandes de visio et les rendez-vous confirmés avec les freelances.</p>
          </div>
          <Button size="sm" onClick={() => navigate("/client/profils")}>Trouver un profil</Button>
        </div>
        {ready && <MeetingRequestsList mode="client" />}
      </main>
    </div>
  );
}
