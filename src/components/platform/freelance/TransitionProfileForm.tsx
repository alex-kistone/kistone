import { useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/components/platform/admin/adv";
import { ENGLISH_LEVELS, FONCTIONS, fonctionLabel, isFonction } from "@/lib/fonctions";

type Language = { language: string; level: string };

/** Ligne recruiter_profiles telle que lue par la page profil (champs utiles ici). */
export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  fonction: string | null;
  tjm: number | null;
  available: boolean | null;
  availability_date: string | null;
  languages: Language[] | null;
  intro_text: string | null;
}

interface Props {
  userId: string;
  email: string;
  /** Profil existant, ou null à la première visite. */
  profile: ProfileRow | null;
  /** Prénom et nom du compte (Google, LinkedIn) pour la première visite. */
  defaultNames: { first: string; last: string };
  /** Appelé après l'enregistrement, avec l'identifiant du profil. */
  onSaved: (id: string) => void;
}

const isEnglish = (l: Language) => /^(anglais|english)$/i.test(l.language.trim());
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Profil du manager de transition, en un seul écran : métier, TJM, disponibilité, anglais et
 * présentation libre (réécrite par l'IA à la demande). Les autres champs des anciens profils RPO
 * (missions, secteurs, LinkedIn…) restent en base et ne sont pas modifiés.
 */
export default function TransitionProfileForm({ userId, email, profile, defaultNames, onSaved }: Props) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(profile?.first_name ?? defaultNames.first);
  const [lastName, setLastName] = useState(profile?.last_name ?? defaultNames.last);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [fonction, setFonction] = useState(isFonction(profile?.fonction) ? profile!.fonction! : "");
  const [tjm, setTjm] = useState(profile?.tjm ? String(profile.tjm) : "");
  const [availableNow, setAvailableNow] = useState(profile ? profile.available !== false : true);
  const [availableFrom, setAvailableFrom] = useState(profile?.availability_date ?? "");
  const [english, setEnglish] = useState(profile?.languages?.find(isEnglish)?.level ?? "");
  const [intro, setIntro] = useState(profile?.intro_text ?? "");
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const fail = (id: string, title: string, description: string) => {
    document.getElementById(id)?.focus();
    toast({ title, description, variant: "destructive" });
  };

  const optimize = async () => {
    if (intro.trim().length < 20) {
      fail("intro", "Quelques lignes d'abord", "Écrivez votre parcours en vrac : l'IA le remet en forme.");
      return;
    }
    setOptimizing(true);
    const { data, error } = await supabase.functions.invoke("optimize-intro", {
      body: {
        profile: {
          jobTitle: fonctionLabel(fonction) ?? undefined,
          tjm: Number(tjm) || undefined,
          languages: english ? [{ language: "Anglais", level: english }] : [],
          currentIntro: intro,
        },
      },
    });
    setOptimizing(false);
    if (error || !data?.intro) {
      toast({ title: "Optimisation impossible", description: error ? await functionErrorMessage(error) : "Réessayez dans un instant.", variant: "destructive" });
      return;
    }
    setIntro(data.intro);
    toast({ title: "Présentation réécrite", description: "Relisez-la et ajustez-la avant d'enregistrer." });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return fail(firstName.trim() ? "lastName" : "firstName", "Nom requis", "Indiquez votre prénom et votre nom.");
    if (phone.replace(/\D/g, "").length < 9) return fail("phone", "Téléphone requis", "Un associé vous appelle pour qualifier votre profil.");
    if (!isFonction(fonction)) return fail("fonction", "Métier requis", "Choisissez votre fonction.");
    if (!(Number(tjm) > 0)) return fail("tjm", "TJM requis", "Indiquez votre tarif journalier HT.");
    if (!availableNow && (!availableFrom || availableFrom < today())) return fail("availableFrom", "Date de disponibilité requise", "Indiquez à partir de quand vous serez disponible.");
    if (!english) return fail("english", "Niveau d'anglais requis", "Choisissez votre niveau.");
    if (intro.trim().length < 20) return fail("intro", "Présentation requise", "Présentez votre parcours en quelques lignes.");

    setSaving(true);
    const others = (profile?.languages ?? []).filter((l) => !isEnglish(l));
    const row = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      fonction,
      job_title: fonctionLabel(fonction),
      tjm: Math.round(Number(tjm)),
      available: availableNow,
      availability_date: availableNow ? null : availableFrom,
      languages: [{ language: "Anglais", level: english }, ...others],
      intro_text: intro.trim(),
    };
    const { data, error } = profile
      ? await supabase.from("recruiter_profiles").update(row as never).eq("id", profile.id).select("id").single()
      : await supabase.from("recruiter_profiles").insert({ ...row, user_id: userId, email, vertical: "rpo" } as never).select("id").single();
    setSaving(false);
    if (error || !data) {
      const message = error?.message.includes("ROLE_CONFLICT") ? "Cette adresse est déjà utilisée pour un espace client." : error?.message ?? "Erreur inconnue.";
      toast({ title: "Enregistrement impossible", description: message, variant: "destructive" });
      return;
    }
    toast({ title: profile ? "Profil mis à jour" : "Bienvenue dans le réseau", description: profile ? "Vos informations sont enregistrées." : "Un associé du cabinet vous contacte pour faire connaissance." });
    onSaved((data as { id: string }).id);
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="firstName">Prénom</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" /></div>
        <div className="space-y-2"><Label htmlFor="lastName">Nom</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" /></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="06 12 34 56 78" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fonction">Votre métier</Label>
        <Select value={fonction} onValueChange={setFonction}>
          <SelectTrigger id="fonction"><SelectValue placeholder="Choisissez votre fonction" /></SelectTrigger>
          <SelectContent>{FONCTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tjm">TJM (€ HT / jour)</Label>
          <Input id="tjm" type="number" inputMode="numeric" min={1} step={10} value={tjm} onChange={(e) => setTjm(e.target.value)} placeholder="Ex. 900" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="english">Niveau d'anglais</Label>
          <Select value={english} onValueChange={setEnglish}>
            <SelectTrigger id="english"><SelectValue placeholder="Choisissez" /></SelectTrigger>
            <SelectContent>{ENGLISH_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Disponibilité</legend>
        <div className="flex flex-wrap gap-2">
          {[true, false].map((now) => (
            <Button key={String(now)} type="button" size="sm" variant={availableNow === now ? "default" : "outline"} aria-pressed={availableNow === now} onClick={() => setAvailableNow(now)}>
              {now ? "Disponible maintenant" : "Disponible à partir du…"}
            </Button>
          ))}
        </div>
        {!availableNow && (
          <Input id="availableFrom" type="date" min={today()} value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="max-w-[220px]" aria-label="Date de disponibilité" />
        )}
      </fieldset>

      <div className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <Label htmlFor="intro">Votre parcours, en quelques lignes</Label>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={optimize} disabled={optimizing}>
            {optimizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {optimizing ? "Réécriture…" : "Améliorer avec l'IA"}
          </Button>
        </div>
        <Textarea id="intro" rows={7} value={intro} onChange={(e) => setIntro(e.target.value)}
          placeholder="Postes occupés, entreprises, missions de transition menées, résultats obtenus, secteurs… Écrivez librement : l'IA peut ensuite le remettre en forme." />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? "Enregistrement…" : profile ? "Mettre à jour mon profil" : "Rejoindre le réseau"}
      </Button>
    </form>
  );
}
