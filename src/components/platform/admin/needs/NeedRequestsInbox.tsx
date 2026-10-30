import { useCallback, useEffect, useState } from "react";
import { Archive, Check, Inbox, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { needRequestLines, type Engagement } from "@/lib/needRequest";
import type { Vertical } from "@/lib/verticals";

type NeedRequestRow = {
  id: string;
  email: string;
  vertical: Vertical;
  engagement: Engagement;
  rhythm: string | null;
  duration: string | null;
  open_positions: string | null;
  start_window: string;
  brief: string | null;
  status: "new" | "done" | "archived";
  created_at: string;
};

const fmt = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

/**
 * Demandes déposées sans compte sur /besoin (email + 4 réponses), en tête de l'onglet Besoins.
 * Seules les demandes nouvelles sont affichées ; « Traitée » ou « Archiver » les retire de la liste.
 */
const NeedRequestsInbox = () => {
  const [rows, setRows] = useState<NeedRequestRow[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("need_requests" as never)
      .select("*")
      .eq("status", "new")
      .order("created_at", { ascending: false });
    setRows((data as NeedRequestRow[] | null) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: "done" | "archived") => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from("need_requests" as never).update({ status } as never).eq("id", id);
    if (error) load();
  };

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="need-requests-title" className="rounded-xl border border-border bg-card p-4">
      <h2 id="need-requests-title" className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        Demandes reçues sans compte ({rows.length})
      </h2>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-medium">
                <a href={`mailto:${r.email}`} className="underline underline-offset-2">{r.email}</a>
                <span className="ml-2 text-xs font-normal text-muted-foreground">{fmt(r.created_at)}</span>
              </p>
              <p className="text-muted-foreground">
                {needRequestLines(r).map((l) => `${l.label} : ${l.value}`).join(" · ")}
              </p>
              {r.brief && <p className="whitespace-pre-line text-muted-foreground">« {r.brief} »</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <a href={`mailto:${r.email}?subject=${encodeURIComponent("Votre besoin sur Kistone")}`}><Mail className="h-3.5 w-3.5" aria-hidden="true" /> Écrire</a>
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setStatus(r.id, "done")}>
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Traitée
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground" onClick={() => setStatus(r.id, "archived")}>
                <Archive className="h-3.5 w-3.5" aria-hidden="true" /> Archiver
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default NeedRequestsInbox;
