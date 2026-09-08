import { useEffect, useMemo, useRef, useState } from 'react';
import { Database, LayoutPanelTop, Zap, Workflow, Users, Lightbulb, Mic, X, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CALENDLY_URL = 'https://calendly.com/alexandre-kistone/30mins-meetup';
const MIN_CHARS = 20;

const PROJECT_TYPES = [
  { id: 'ats', label: 'Créer / optimiser mon ATS', Icon: Database },
  { id: 'sirh', label: 'Créer / optimiser mon SIRH', Icon: LayoutPanelTop },
  { id: 'productivite', label: 'Productivité / Automatisations', Icon: Zap },
  { id: 'process', label: 'Process de recrutement', Icon: Workflow },
  { id: 'clients', label: 'Clients / Prospection', Icon: Users },
  { id: 'autre', label: 'Autre / À définir', Icon: Lightbulb },
];

const EXISTING_PROJECTS = [
  { id: 'gotam', label: 'Hiring Plan' },
  { id: 'connect', label: 'Plateforme Freelance' },
  { id: 'portail-client', label: 'Plateforme CDI' },
  { id: 'kit', label: 'Assistant sourcing' },
];

type Props = { open: boolean; onClose: () => void; preselectedExistingProject?: string | null };

const StudioOnboardingDialog = ({ open, onClose, preselectedExistingProject = null }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState<string | null>(null);
  const [existingProject, setExistingProject] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Voice dictation
  const recognitionRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);
  const speechSupported = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (open) {
      if (preselectedExistingProject) {
        setExistingProject(preselectedExistingProject);
        setProjectType(null);
      }
    } else {
      // reset on close
      setTimeout(() => {
        setStep(1); setProjectType(null); setExistingProject(null);
        setDescription(''); setFirstName(''); setLastName(''); setEmail(''); setPhone('');
      }, 300);
    }
  }, [open, preselectedExistingProject]);


  useEffect(() => {
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, []);

  const toggleDictation = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (recording) { recognitionRef.current?.stop(); setRecording(false); return; }
    const rec = new SR();
    rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e: any) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setDescription((prev) => (prev ? prev + ' ' : '') + txt.trim());
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start(); setRecording(true);
  };

  const remaining = Math.max(0, MIN_CHARS - description.trim().length);
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const canNext1 = !!projectType || !!existingProject;
  const canNext2 = description.trim().length >= MIN_CHARS;
  const phoneValid = useMemo(() => /^[+\d][\d\s().-]{7,}$/.test(phone.trim()), [phone]);
  const canSubmit = firstName.trim() && lastName.trim() && emailValid && phoneValid;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const typeLabel = PROJECT_TYPES.find((p) => p.id === projectType)?.label
      ?? EXISTING_PROJECTS.find((p) => p.id === existingProject)?.label
      ?? 'Non précisé';
    const payload = {
      theme: typeLabel,
      project_type: projectType,
      existing_project: existingProject,
      description: description.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
    };
    const { error } = await supabase.from('studio_requests').insert(payload as any);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    // Fire-and-forget email notification to admin
    supabase.functions.invoke('notify-studio-request', { body: payload }).catch((e) => {
      console.error('notify-studio-request failed', e);
    });
    toast({ title: 'Merci !', description: 'Nous vous redirigeons vers le calendrier.' });
    window.location.href = CALENDLY_URL;
    onClose();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'auto',
          background: '#FAF7F0', border: '2px solid #0A0A0A', borderRadius: 20,
          boxShadow: '10px 10px 0 0 #0A0A0A',
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 0' }}>
          <span style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 999,
            background: '#F4E4C7', color: '#B7791F',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11, letterSpacing: '0.14em', fontWeight: 700,
          }}>
            DÉMARRER UN PROJET
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 12, color: 'rgba(10,10,10,0.6)' }}>
              Étape {step} / 3
            </span>
            <button onClick={onClose} aria-label="Fermer" style={{
              width: 32, height: 32, borderRadius: 8, border: '1.5px solid rgba(10,10,10,0.2)',
              background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center',
            }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: '12px 28px 0' }}>
          <div style={{ height: 4, background: 'rgba(10,10,10,0.08)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: '#E59500', transition: 'width .3s' }} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 6px', color: '#0A0A0A' }}>Quel type de projet ?</h2>
              <p style={{ fontSize: 14, color: 'rgba(10,10,10,0.65)', marginBottom: 18 }}>
                Choisissez un type ou un projet existant qui vous inspire.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {PROJECT_TYPES.map(({ id, label, Icon }) => {
                  const active = projectType === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setProjectType(id); setExistingProject(null); }}
                      style={{
                        background: active ? '#FFF4DF' : '#FFFFFF',
                        border: active ? '2px solid #1E40AF' : '1.5px solid rgba(10,10,10,0.12)',
                        borderRadius: 14, padding: '20px 12px', cursor: 'pointer',
                        textAlign: 'center', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 10, minHeight: 110,
                        boxShadow: active ? '0 2px 0 rgba(30,64,175,0.15)' : 'none',
                        transition: 'all .15s',
                      }}
                    >
                      <Icon size={22} strokeWidth={1.6} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3 }}>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 14px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(10,10,10,0.12)' }} />
                <span style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 11, letterSpacing: '0.16em', color: 'rgba(10,10,10,0.55)',
                }}>OU UN PROJET KISTONE</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(10,10,10,0.12)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {EXISTING_PROJECTS.map((p) => {
                  const active = existingProject === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setExistingProject(p.id); setProjectType(null); }}
                      style={{
                        background: active ? '#FFF4DF' : '#FFFFFF',
                        border: active ? '2px solid #1E40AF' : '1.5px solid rgba(10,10,10,0.12)',
                        borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                        fontSize: 14, fontWeight: 600, color: '#0A0A0A',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 6px', color: '#0A0A0A' }}>Décrivez votre besoin</h2>
              <p style={{ fontSize: 14, color: 'rgba(10,10,10,0.7)', marginBottom: 14, lineHeight: 1.55 }}>
                Quel problème vous voulez résoudre ? Quel volume ? Quels outils utilisez-vous aujourd'hui ?<br />
                {speechSupported && <>Vous pouvez aussi <strong>dicter</strong> à la voix 🎙️</>}
              </p>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : on reçoit ~200 CV/mois pour des postes tech, on perd un temps fou à les trier. On utilise un Trello + Gmail aujourd'hui, on aimerait un outil qui score les CV automatiquement…"
                  rows={7}
                  style={{
                    width: '100%', padding: '14px 50px 14px 14px',
                    border: '2px solid #E59500', borderRadius: 12, background: '#FFFFFF',
                    fontSize: 14, lineHeight: 1.55, fontFamily: 'inherit',
                    resize: 'vertical', outline: 'none', color: '#0A0A0A',
                  }}
                />
                {speechSupported && (
                  <button
                    onClick={toggleDictation}
                    title={recording ? 'Arrêter' : 'Dicter'}
                    style={{
                      position: 'absolute', bottom: 12, right: 12,
                      width: 36, height: 36, borderRadius: '50%',
                      border: '1.5px solid rgba(10,10,10,0.15)',
                      background: recording ? '#E54D2A' : '#FFFFFF', color: recording ? '#fff' : '#0A0A0A',
                      cursor: 'pointer', display: 'grid', placeItems: 'center',
                    }}
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
              <div style={{
                marginTop: 10, fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 12, color: remaining > 0 ? 'rgba(10,10,10,0.6)' : '#059669',
              }}>
                {remaining > 0 ? (
                  <>Encore <strong style={{ color: '#E59500' }}>{remaining}</strong> caractères pour valider ({description.trim().length}/{MIN_CHARS})</>
                ) : (
                  <>✓ Description suffisante ({description.trim().length} caractères)</>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 6px', color: '#0A0A0A' }}>Vos coordonnées</h2>
              <p style={{ fontSize: 14, color: 'rgba(10,10,10,0.65)', marginBottom: 18 }}>
                Pour vous recontacter sous 24h et planifier un échange.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <Field label="Prénom *" value={firstName} onChange={setFirstName} placeholder="Alex" />
                <Field label="Nom *" value={lastName} onChange={setLastName} placeholder="Dupont" />
                <Field label="Email *" value={email} onChange={setEmail} placeholder="alex@entreprise.com" type="email" full />
                <Field label="Téléphone *" value={phone} onChange={setPhone} placeholder="+33 6 12 34 56 78" type="tel" full />
              </div>
              <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(10,10,10,0.55)' }}>
                À la validation, vous serez redirigé vers notre calendrier pour réserver un créneau de 30 minutes.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 28px 24px', borderTop: '1px solid rgba(10,10,10,0.08)',
        }}>
          <button
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'rgba(10,10,10,0.65)', fontWeight: 600,
            }}
          >
            <ArrowLeft size={14} /> {step === 1 ? 'Annuler' : 'Retour'}
          </button>
          {step < 3 ? (
            <button
              disabled={step === 1 ? !canNext1 : !canNext2}
              onClick={() => setStep(step + 1)}
              style={primaryBtn(step === 1 ? !canNext1 : !canNext2)}
            >
              Continuer <ArrowRight size={16} />
            </button>
          ) : (
            <button disabled={!canSubmit || submitting} onClick={submit} style={primaryBtn(!canSubmit || submitting)}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Valider & réserver un créneau <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 8,
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 12, letterSpacing: '0.06em', fontWeight: 700, textTransform: 'uppercase',
  background: disabled ? 'rgba(10,10,10,0.15)' : '#E59500',
  color: '#0A0A0A',
  padding: '12px 18px', border: '2px solid ' + (disabled ? 'rgba(10,10,10,0.15)' : '#0A0A0A'),
  borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '3px 3px 0 0 #0A0A0A',
});

const Field = ({ label, value, onChange, placeholder, type = 'text', full }: any) => (
  <label style={{ display: 'block', gridColumn: full ? '1 / -1' : undefined }}>
    <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A0A0A', marginBottom: 6 }}>{label}</span>
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', padding: '11px 14px',
        border: '1.5px solid rgba(10,10,10,0.18)', borderRadius: 10,
        fontSize: 14, fontFamily: 'inherit', background: '#FFFFFF', outline: 'none',
      }}
    />
  </label>
);

export default StudioOnboardingDialog;
