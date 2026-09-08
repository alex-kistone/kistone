import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Request = {
  id: string;
  project_type: string | null;
  existing_project: string | null;
  theme: string | null;
  description: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
};

const STATUSES = [
  { id: 'new', label: 'Nouveau' },
  { id: 'contacted', label: 'Contacté' },
  { id: 'qualified', label: 'Qualifié' },
  { id: 'won', label: 'Signé' },
  { id: 'lost', label: 'Perdu' },
];

const AdminStudioPanel = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('studio_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('studio_requests' as any).update({ status }).eq('id', id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else { setItems((prev) => prev.map((r) => r.id === id ? { ...r, status } : r)); }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette demande ?')) return;
    const { error } = await supabase.from('studio_requests' as any).delete().eq('id', id);
    if (error) toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    else setItems((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement…</div>;

  if (items.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">Aucune demande Studio pour le moment.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {items.length} demande{items.length > 1 ? 's' : ''} Studio · Prospects ayant rempli le formulaire "Démarrer un projet"
      </div>
      <div className="grid gap-3">
        {items.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold">{r.first_name} {r.last_name}</h3>
                    <Badge variant="secondary">{r.theme || r.project_type || 'Non précisé'}</Badge>
                    {r.existing_project && <Badge>Inspiration : {r.existing_project}</Badge>}
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3 w-3" /> {r.email}
                    </a>
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" /> {r.phone}
                      </a>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-foreground/80">{r.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    className="rounded border bg-background px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminStudioPanel;
