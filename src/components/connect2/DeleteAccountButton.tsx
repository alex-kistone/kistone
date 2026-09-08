import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteAccountButtonProps {
  userId: string | null;
  navigate: (path: string) => void;
}

const DeleteAccountButton = ({ userId, navigate }: DeleteAccountButtonProps) => {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      await supabase.from("recruiter_profiles" as any).delete().eq("user_id", userId);
      await supabase.from("client_profiles" as any).delete().eq("user_id", userId);
      const { error } = await supabase.rpc("delete_own_account" as any);
      if (error) throw error;
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de supprimer le compte.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-xs">
          Supprimer mon compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer votre compte</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous certain de vouloir définitivement supprimer votre compte ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountButton;
