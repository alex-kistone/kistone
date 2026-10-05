import {
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardList,
  FilePlus2,
  GitBranch,
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  Receipt,
  Search,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type PlatformRole = "admin" | "client" | "freelance";

export interface NavItem {
  label: string;
  path: string;
  /** Onglet de la page (?tab=…) ; absent = onglet par défaut. */
  tab?: string;
  icon: LucideIcon;
  /** Autres chemins qui rendent l'entrée active (ex. modification d'un besoin). */
  alsoActive?: string[];
}

export const SPACE_LABEL: Record<PlatformRole, string> = {
  admin: "Administration",
  client: "Espace client",
  freelance: "Espace freelance",
};

export const PLATFORM_NAV: Record<PlatformRole, NavItem[]> = {
  freelance: [
    { label: "Mon profil", path: "/profile", icon: UserRound },
    { label: "Mes opportunités", path: "/open-needs", icon: Search },
    { label: "Mes missions & CRA", path: "/profile", tab: "missions", icon: CalendarCheck },
    { label: "Mon administratif", path: "/profile", tab: "admin", icon: ShieldCheck },
  ],
  client: [
    { label: "Déposer un besoin", path: "/client/new-need", icon: FilePlus2 },
    { label: "Mes besoins", path: "/client/dashboard", icon: ClipboardList, alsoActive: ["/client/edit-need"] },
    { label: "Missions & CRA", path: "/client/dashboard", tab: "missions", icon: CalendarCheck },
    { label: "Factures", path: "/client/dashboard", tab: "invoices", icon: Receipt },
    { label: "Mon dossier", path: "/client/profile", icon: ShieldCheck },
  ],
  admin: [
    { label: "Vue d'ensemble", path: "/dashboard", icon: LayoutDashboard },
    { label: "Besoins", path: "/dashboard", tab: "needs", icon: ClipboardList },
    { label: "Pipeline", path: "/dashboard", tab: "pipeline", icon: GitBranch },
    { label: "Freelances", path: "/dashboard", tab: "recruiters", icon: Users },
    { label: "Clients", path: "/dashboard", tab: "clients", icon: Building2 },
    { label: "Missions", path: "/dashboard", tab: "missions", icon: Briefcase },
    { label: "CRA", path: "/dashboard", tab: "timesheets", icon: CalendarCheck },
    { label: "Factures", path: "/dashboard", tab: "invoices", icon: Receipt },
    { label: "Trésorerie", path: "/dashboard", tab: "treasury", icon: Wallet },
    { label: "Messages", path: "/dashboard", tab: "messages", icon: MessageSquare },
    { label: "Assistant", path: "/dashboard", tab: "assistant", icon: Sparkles },
  ],
};

/** Onglet par défaut de chaque page (ce qu'affiche l'URL sans ?tab=). */
export const DEFAULT_TAB: Record<string, string> = {
  "/dashboard": "kpi",
  "/client/dashboard": "needs",
  "/profile": "profile",
};
