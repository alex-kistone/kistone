import { useEffect, useState, type RefObject } from "react";
import { Copy, Download, Linkedin, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement>;
  open: boolean;
  postText: string;
  altText: string;
  fileName: string;
  /** Vrai quand la carte n'est pas anonyme : tous les boutons sont bloqués. */
  blocked: boolean;
};

/**
 * Boutons d'une carte LinkedIn : publication directe via l'API (compte LinkedIn de l'admin),
 * publication assistée (image copiée, fenêtre de post ouverte), image PNG et texte du post.
 */
export default function LinkedInPublishActions({ canvasRef, open, postText, altText, fileName, blocked }: Props) {
  const { toast } = useToast();
  const [li, setLi] = useState<{ configured: boolean; connected: boolean; name: string | null } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const check = () =>
      supabase.functions.invoke("linkedin-auth", { body: { action: "status" } }).then(({ data }) => {
        if (data && !data.error) setLi({ configured: !!data.configured, connected: !!data.connected, name: data.name ?? null });
      });
    check();
    // Après l'autorisation dans un autre onglet, l'état se met à jour au retour sur celui-ci
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, [open]);

  const connectLinkedin = async () => {
    const { data, error } = await supabase.functions.invoke("linkedin-auth", { body: { action: "start" } });
    if (error || data?.error) {
      toast({ title: "Connexion impossible", description: data?.error ?? error?.message, variant: "destructive" });
      return;
    }
    window.open(data.url, "_blank");
  };

  const publishDirect = async () => {
    if (!canvasRef.current) return;
    setPublishing(true);
    const { data, error } = await supabase.functions.invoke("linkedin-publish", {
      body: { image: canvasRef.current.toDataURL("image/png"), text: postText, altText },
    });
    setPublishing(false);
    setConfirming(false);
    if (error || data?.error) {
      const body = error ? await (error as { context?: { json?: () => Promise<{ error?: string; reconnect?: boolean }> } }).context?.json?.().catch(() => null) : data;
      if (body?.reconnect) setLi((v) => (v ? { ...v, connected: false } : v));
      toast({ title: "Publication impossible", description: body?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Publié sur LinkedIn", description: "Le post est en ligne sur votre profil." });
    window.open(data.url, "_blank");
  };

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${fileName}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  /**
   * Publication assistée : l'image part dans le presse-papier, LinkedIn s'ouvre avec la
   * fenêtre de post et le texte pré-rempli ; il reste à coller l'image (Cmd+V) et publier.
   */
  const publish = async () => {
    // L'onglet s'ouvre tout de suite (sinon le navigateur le bloque après une attente)
    const tab = window.open("about:blank", "_blank");
    let imageCopied = false;
    try {
      const blob = await new Promise<Blob | null>((ok) => canvasRef.current?.toBlob(ok, "image/png") ?? ok(null));
      if (blob && "ClipboardItem" in window) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        imageCopied = true;
      }
    } catch { /* presse-papier refusé : on télécharge l'image à la place */ }
    if (!imageCopied) download();
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`;
    if (tab) tab.location.href = url;
    else window.open(url, "_blank");
    toast({
      title: "LinkedIn s'ouvre avec votre texte",
      description: imageCopied ? "L'image est copiée : collez-la dans le post (Cmd+V), puis publiez." : "L'image a été téléchargée : ajoutez-la au post, puis publiez.",
    });
  };

  const copyPost = async () => {
    await navigator.clipboard.writeText(postText);
    toast({ title: "Texte du post copié", description: "Collez-le dans LinkedIn avec l'image." });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {li?.connected ? (
          <>
            <Button onClick={() => setConfirming(true)} disabled={blocked || publishing} className="gap-2 bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Publier sur LinkedIn
            </Button>
            <p className="text-center text-xs text-muted-foreground">Connecté en tant que {li.name ?? "votre profil"}</p>
          </>
        ) : li?.configured ? (
          <Button onClick={connectLinkedin} className="gap-2 bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90"><Linkedin className="h-4 w-4" />Connecter LinkedIn</Button>
        ) : null}
        <Button variant={li?.connected || li?.configured ? "outline" : "default"} onClick={publish} disabled={blocked} className="gap-2"><Linkedin className="h-4 w-4" />Publication assistée (coller l'image)</Button>
        <Button variant="outline" onClick={download} disabled={blocked} className="gap-2"><Download className="h-4 w-4" />Télécharger l'image (PNG)</Button>
        <Button variant="outline" onClick={copyPost} disabled={blocked} className="gap-2"><Copy className="h-4 w-4" />Copier le texte du post</Button>
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publier sur LinkedIn ?</AlertDialogTitle>
            <AlertDialogDescription>
              La carte et son texte seront publiés publiquement sur le profil de {li?.name ?? "votre compte LinkedIn"}. Vérifiez qu'aucune information
              confidentielle n'y figure : une fois en ligne, le post se supprime depuis LinkedIn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); publishDirect(); }} disabled={publishing}>
              {publishing ? "Publication…" : "Publier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
