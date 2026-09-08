import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Circle, Award, Users, CheckCircle2, AlertTriangle, Search, ExternalLink, Building2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ClientNeed {
  id: string;
  company_name: string;
  job_title: string;
  user_id: string;
  status: string;
}

interface ProfileSuggestion {
  id: string;
  need_id: string;
  anonymous_label: string;
  pipeline_status: string;
  recruiter_profile_id: string;
  match_score: number;
  status_updated_at: string | null;
  created_at: string | null;
}

interface RecruiterMini {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
}

const PIPELINE_STEPS = [
  { key: "suggested", label: "Suggéré", icon: Circle, color: "text-muted-foreground", bg: "bg-muted/50", stale: 5 },
  { key: "shortlisted", label: "Shortlisté", icon: Award, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30", stale: 5 },
  { key: "interview", label: "Entretien", icon: Users, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", stale: 7 },
  { key: "validated", label: "Validé", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", stale: 14 },
];

const daysSince = (iso: string | null) => {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const AdminGlobalPipelinePanel = () => {
  const [, setSearchParams] = useSearchParams();
  const [needs, setNeeds] = useState<ClientNeed[]>([]);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [recruiters, setRecruiters] = useState<Record<string, RecruiterMini>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [staleOnly, setStaleOnly] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [needsRes, sugRes, recRes] = await Promise.all([
      supabase.from("client_needs" as any).select("id, company_name, job_title, user_id, status"),
      supabase.from("profile_suggestions" as any).select("id, need_id, anonymous_label, pipeline_status, recruiter_profile_id, match_score, status_updated_at, created_at"),
      supabase.from("recruiter_profiles" as any).select("id, first_name, last_name, job_title"),
    ]);

    if (!needsRes.error) setNeeds((needsRes.data as any) || []);
    if (!sugRes.error) setSuggestions((sugRes.data as any) || []);
    if (!recRes.error && recRes.data) {
      const map: Record<string, RecruiterMini> = {};
      (recRes.data as any[]).forEach((r) => { map[r.id] = r; });
      setRecruiters(map);
    }
    setLoading(false);
  };

  const companies = useMemo(() => {
    const set = new Set<string>();
    needs.forEach((n) => { if (n.company_name && n.company_name.trim()) set.add(n.company_name); });
    return Array.from(set).sort();
  }, [needs]);

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      const need = needs.find((n) => n.id === s.need_id);
      if (!need) return false;
      if (companyFilter !== "all" && need.company_name !== companyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const r = recruiters[s.recruiter_profile_id];
        const name = r ? `${r.first_name} ${r.last_name}`.toLowerCase() : "";
        const haystack = `${name} ${need.company_name} ${need.job_title}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (staleOnly) {
        const step = PIPELINE_STEPS.find((p) => p.key === s.pipeline_status);
        const days = daysSince(s.status_updated_at || s.created_at);
        if (!step || days < step.stale) return false;
      }
      return true;
    });
  }, [suggestions, needs, recruiters, search, companyFilter, staleOnly]);

  // Global stats
  const stats = useMemo(() => {
    const out: Record<string, number> = { suggested: 0, shortlisted: 0, interview: 0, validated: 0, stale: 0 };
    suggestions.forEach((s) => {
      out[s.pipeline_status] = (out[s.pipeline_status] || 0) + 1;
      const step = PIPELINE_STEPS.find((p) => p.key === s.pipeline_status);
      if (step && daysSince(s.status_updated_at || s.created_at) >= step.stale) {
        out.stale += 1;
      }
    });
    return out;
  }, [suggestions]);

  const goToNeed = (needId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "needs");
      next.set("need", needId);
      return next;
    }, { replace: false });
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Chargement du pipeline global...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PIPELINE_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className={cn("rounded-lg border p-3", step.bg)}>
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", step.color)} />
                <span className="text-xs font-medium">{step.label}</span>
              </div>
              <div className="mt-1 text-2xl font-bold">{stats[step.key] || 0}</div>
            </div>
          );
        })}
        <button
          onClick={() => setStaleOnly((v) => !v)}
          className={cn(
            "rounded-lg border p-3 text-left transition",
            staleOnly ? "border-destructive bg-destructive/10" : "bg-orange-50 dark:bg-orange-950/30 hover:border-orange-400"
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium">À relancer</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.stale || 0}</div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher candidat, client, poste..."
            className="pl-10 h-9 text-sm"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="h-9 sm:w-56 text-xs">
            <SelectValue placeholder="Tous les clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={staleOnly ? "default" : "outline"}
          size="sm"
          className="gap-1.5 h-9"
          onClick={() => setStaleOnly((v) => !v)}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          À relancer uniquement
        </Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STEPS.map((step) => {
          const StepIcon = step.icon;
          const items = filteredSuggestions
            .filter((s) => s.pipeline_status === step.key)
            .sort((a, b) => daysSince(b.status_updated_at || b.created_at) - daysSince(a.status_updated_at || a.created_at));

          return (
            <div
              key={step.key}
              className={cn(
                "flex min-w-[260px] flex-1 flex-col rounded-xl border border-border",
                step.bg
              )}
            >
              <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
                <StepIcon className={cn("h-4 w-4", step.color)} />
                <span className="text-xs font-semibold">{step.label}</span>
                <Badge variant="secondary" className="ml-auto text-[10px] h-5 min-w-5 justify-center">
                  {items.length}
                </Badge>
              </div>

              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2 p-2 min-h-[120px]">
                  {items.map((s) => {
                    const need = needs.find((n) => n.id === s.need_id);
                    const r = recruiters[s.recruiter_profile_id];
                    const days = daysSince(s.status_updated_at || s.created_at);
                    const isStale = days >= step.stale;
                    return (
                      <button
                        key={s.id}
                        onClick={() => need && goToNeed(need.id)}
                        className={cn(
                          "w-full text-left rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md hover:border-primary/40",
                          isStale && "border-orange-400/60"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {r ? `${r.first_name} ${r.last_name}` : s.anonymous_label}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                        {r?.job_title && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{r.job_title}</p>
                        )}
                        {need && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{need.company_name} — {need.job_title}</span>
                          </div>
                        )}
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          {s.match_score > 0 && (
                            <Badge variant="outline" className="text-[9px] h-4">{s.match_score}%</Badge>
                          )}
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] ml-auto",
                            isStale ? "text-orange-600 font-medium" : "text-muted-foreground"
                          )}>
                            <Clock className="h-3 w-3" />
                            {days === 0 ? "Aujourd'hui" : `${days}j`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                      Aucun candidat
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminGlobalPipelinePanel;
