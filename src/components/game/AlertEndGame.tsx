import { countFounded, countPicked, FormattedDepartement, getTotalTime } from "@/lib/game/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { GameState } from "./Game";
import { CircleCheck, CircleX } from "lucide-react";
import moment from "moment";
import { ScrollArea } from "../ui/scroll-area";

interface AlertEndGameProps {
  gameState: GameState;
  open: boolean;
  setClose: () => void;
};

export default function AlertEndGame({ gameState, open, setClose }: AlertEndGameProps) {
  const downloadStats = () => {
    const json = JSON.stringify(
      gameState.departements.filter((departement) => departement.picked)
    );

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `departements_${Date.now()}.json`;
    a.click();

    // Libérer l’URL après usage
    URL.revokeObjectURL(url);
  };

  const renderStats = (departements: FormattedDepartement[]) => {
    return (
      <ScrollArea className="h-[200px] max-h-[300px] rounded-md border mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden md:table-cell">Temps de réponse</TableHead>
              <TableHead>Réponse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departements
              .filter(departement => departement.picked)
              .map((departement) => (
                <TableRow key={departement.code}>
                  <TableCell>{departement.code}</TableCell>
                  <TableCell>{departement.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{departement.answerTime! / 1000}s</TableCell>
                  <TableCell>
                    {departement.founded ? <CircleCheck color="#4f8007"/> : <CircleX color="#d31745"/>}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Fin de partie</AlertDialogTitle>
          <AlertDialogDescription>
            <p className="mt-1">
              Bravo, vous avez trouvé <span className="font-bold">{countFounded(gameState.departements)}</span> départements
               sur les <span className="font-bold">{countPicked(gameState.departements)}</span>.
            </p>
            <p className="mt-1">
              Temps total, {moment.utc(getTotalTime(gameState.departements)).minutes()} minutes
               et {moment.utc(getTotalTime(gameState.departements)).seconds()} secondes.
            </p>
            <p className="mt-3">
              Voici le bilan de votre partie :
            </p>
            {renderStats(gameState.departements)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={downloadStats}>Sauvegarder les données</AlertDialogCancel>
          <AlertDialogAction onClick={setClose}>{"D'accord"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
