import { useState, useEffect } from "react";
import { MessageCircle, Building2, MapPin, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company_name: string;
  job_title: string;
  cities: string[];
  created_at: string;
}

interface AdminClientsPanelProps {
  onOpenChat: (userId: string, name: string) => void;
}

const AdminClientsPanel = ({ onOpenChat }: AdminClientsPanelProps) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setClients((data as any) || []);
    }
    setLoading(false);
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.company_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement des clients…</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher un client…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {clients.length === 0 ? "Aucun client inscrit pour le moment." : "Aucun client ne correspond à votre recherche."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Card key={client.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
                      {client.first_name[0]}{client.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{client.first_name} {client.last_name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{client.job_title}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.cities.length > 0 && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {client.cities.map((city) => (
                          <Badge key={city} variant="outline" className="text-xs">{city}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Inscrit le {new Date(client.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => onOpenChat(client.user_id, `${client.first_name} ${client.last_name}`)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminClientsPanel;
