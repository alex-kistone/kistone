import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MissionEndAction } from "./missionStatus";

interface Props {
  /** Action à confirmer, ou null (fenêtre fermée). */
  action: MissionEndAction | null;
  onCancel: () => void;
  onConfirm: (action: MissionEndAction) => void;
}

/** Confirmation avant de terminer ou d'annuler une mission (liste et détail). */
const MissionEndDialog = ({ action, onCancel, onConfirm }: Props) => (
  <AlertDialog open={!!action} onOpenChange={(v) => !v && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {action === "completed" ? "Terminer la mission ?" : "Annuler la mission ?"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {action === "completed"
            ? "Cette action marquera la mission comme terminée. Le freelance sera de nouveau marqué comme disponible."
            : "Cette action annulera la mission. Cette opération est irréversible."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Non, revenir</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => action && onConfirm(action)}
          className={action === "cancelled" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
        >
          {action === "completed" ? "Oui, terminer" : "Oui, annuler"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default MissionEndDialog;
