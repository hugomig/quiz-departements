"use client";

import { useState } from "react";
import _ from "lodash";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  checkAnswer,
  countFounded,
  countPicked,
  pick,
  FormattedDepartement,
  getFormattedDepartements,
  countAnswered,
} from "@/lib/game/utils";
import { Form, FormField } from "../ui/form";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "../ui/badge";

const FormSchema = z.object({
  saisie: z.string(),
});

enum Step {
  RELANCE,
  NOMBRE_GUESS,
  GUESS,
  VERIFY,
}

interface GameState {
  nbGuess: number;
  departements: FormattedDepartement[];
  goodAnswer?: FormattedDepartement;
}

const PHRASE_LANCEMENT = "Combien de départements voulez vous deviner ?";
const STEP_LANCEMENT = Step.NOMBRE_GUESS;

export default function Game() {
  const initGameState = () => ({
    nbGuess: 0,
    departements: getFormattedDepartements(),
  });

  const [lignes, setLignes] = useState([PHRASE_LANCEMENT]);
  const [step, setStep] = useState<Step>(STEP_LANCEMENT);
  const [gameState, setGameState] = useState<GameState>(initGameState());

  const log: (ligne?: string) => void = (ligne = "\u00A0") => {
    setLignes((prev) => [...prev, ligne]);
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      saisie: "",
    },
  });

  const handleInput = (data: z.infer<typeof FormSchema>) => {
    if (!data.saisie.trim()) {
      return;
    }

    log(`> ${data.saisie}`);

    switch (step) {
      case Step.RELANCE:
      case Step.NOMBRE_GUESS:
        const nbGuess = Number.parseInt(data.saisie);
        if (Number.isInteger(nbGuess)) {
          const newGameState = {
            ...(step === Step.RELANCE ? initGameState() : gameState),
            nbGuess,
          };
          setGameState(newGameState);
          guess(newGameState);
          setStep(Step.VERIFY);
        } else {
          log("Veuillez entrer un nombre cerrect");
        }
        break;
      case Step.GUESS:
        guess(gameState);
        break;
      case Step.VERIFY:
        verify(data.saisie);
        guess(gameState);
    }

    form.setValue("saisie", "");
  };

  const guess = (gameState: GameState) => {
    const { nbGuess, departements } = gameState;
    if (
      countPicked(departements) < departements.length &&
      countPicked(departements) < nbGuess
    ) {
      const nbPickRestants = departements.length - countPicked(departements);
      const randomIndex = Math.floor(Math.random() * nbPickRestants);

      const goodAnswer = pick(departements, randomIndex);

      log(`Quel est le département suivant : ${goodAnswer.code}`);
      const startQuestionTime = Date.now();
      setGameState((prev) => {
        goodAnswer.startQuestionTime = startQuestionTime;
        prev.goodAnswer = goodAnswer;
        return prev;
      });
    } else {
      log();
      log("Nouvelle partie :");
      log(PHRASE_LANCEMENT);
      setStep(Step.RELANCE);
    }
  };

  const verify = (answer: string) => {
    const { goodAnswer } = gameState;
    if (goodAnswer && goodAnswer.startQuestionTime) {
      const correct = checkAnswer(answer, goodAnswer);

      goodAnswer.founded = correct;
      goodAnswer.answerTime = Date.now() - goodAnswer.startQuestionTime;

      log(
        correct
          ? `Bonne réponse : ${goodAnswer.name}`
          : `Mince alors, perdu! La bonne réponse était : ${goodAnswer.name}`
      );
    }
  };

  const downloadStats = () => {
    const json = JSON.stringify(gameState.departements.filter(departement => departement.picked));

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `departements_${Date.now()}.json`;
    a.click();

    // Libérer l’URL après usage
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex w-full justify-center h-screen">
      <div className="flex flex-col gap-2 flex-2 justify-center items-center">
        <div>
          <span className="text-sm">Question : </span>
          <Badge>{`${countPicked(gameState.departements)}/${
            gameState.nbGuess
          }`}</Badge>
        </div>
        <div>
          <span className="text-sm">Nombre de départements trouvés : </span>
          <Badge className="bg-green-600">{`${countFounded(
            gameState.departements
          )}/${countAnswered(gameState.departements)}`}</Badge>
        </div>
        <Button variant={"secondary"} className="mt-2 bg-slate-200" onClick={() => downloadStats()}>Sauvegarder le score</Button>
      </div>
      <div className="flex-5 w-full">
        <Form {...form}>
          <Card className="w-full mt-10 mb-10 h-150">
            <CardHeader>
              <div className="flex w-full justify-center">
                <h1 className="text-xl">Quiz des départements</h1>
              </div>
            </CardHeader>
            <CardContent className="w-full bg-slate-50 flex-1 flex flex-col justify-end overflow-y-auto space-y-1 m-2 pb-2">
              {lignes.map((content, k) => (
                <div key={k}>{content}</div>
              ))}
            </CardContent>
            <CardFooter>
              <form
                onSubmit={form.handleSubmit(handleInput)}
                className="w-full"
              >
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="saisie"
                    render={({ field }) => (
                      <Input
                        placeholder="Votre réponse (vous pouvez appuyez sur la touche Entrée)"
                        {...field}
                      />
                    )}
                  />
                  <Button className="bg-black text-white" type="submit">
                    Confirmer
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </Form>
      </div>
      <div className="flex flex-col gap-0.5 flex-2 justify-center items-center">
        {_.orderBy(
          gameState.departements.filter(
            (departement) => departement.answerTime
          ),
          (departement) => departement.startQuestionTime
        ).map((departement, key) => (
          <span
            key={key}
            className={departement.founded ? "text-green-600" : "text-red-500"}
          >{`${departement.code} ${departement.name}`}</span>
        ))}
      </div>
    </div>
  );
}
