"use client";

import React, { useState } from "react";
import _ from "lodash";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Form, FormField } from "../ui/form";
import { ScrollArea } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CircleCheck, CircleX } from "lucide-react";
import {
  checkAnswer,
  countFounded,
  countPicked,
  pick,
  FormattedDepartement,
  getFormattedDepartements,
  countAnswered,
} from "@/lib/game/utils";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertEndGame from "./AlertEndGame";

enum Step {
  NOMBRE_GUESS,
  GUESS,
}

export interface GameState {
  nbGuess: number;
  departements: FormattedDepartement[];
  goodAnswer?: FormattedDepartement;
  lastGoodAnswer?: FormattedDepartement;
}

const STEP_LANCEMENT = Step.NOMBRE_GUESS;

const FormSchema = z.object({
  saisie: z.string(),
  nbGuess: z.number(),
});

export default function Game() {
  const initGameState = () => ({
    departements: getFormattedDepartements(),
    nbGuess: 0,
  });

  const [step, setStep] = useState<Step>(STEP_LANCEMENT);
  const [gameState, setGameState] = useState<GameState>(initGameState());
  const [showAlertEndGame, setShowAlertEndGame] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      saisie: "",
      nbGuess: 20,
    },
  });

  const handleInput = (data: z.infer<typeof FormSchema>) => {
    if (!data.saisie.trim() && step !== Step.NOMBRE_GUESS) {
      return;
    }

    switch (step) {
      case Step.NOMBRE_GUESS:
        handleNbGuess(data.nbGuess);
        break;
      case Step.GUESS:
        handleGuess(data.saisie);
        break;
    }
  };

  const handleNbGuess = (nbGuess: number) => {
    const newGameState = {
      ...initGameState(),
      nbGuess,
    };

    const { departements } = newGameState;
    nextGuess(newGameState, departements, nbGuess);

    setStep(Step.GUESS);
  };

  const handleGuess = (saisie: string) => {
    const { departements, nbGuess, goodAnswer } = gameState;
    if (goodAnswer) {
      verify(goodAnswer, saisie);
      nextGuess(gameState, departements, nbGuess, goodAnswer);
    }
    form.setValue("saisie", "");
  }

  const nextGuess = (gameState: GameState, departements: FormattedDepartement[], nbGuess: number, lastGoodAnswer?: FormattedDepartement) => {
    if (
      countPicked(departements) < departements.length &&
      countPicked(departements) < nbGuess
    ) {
      const nbPickRestants = departements.length - countPicked(departements);
      const randomIndex = Math.floor(Math.random() * nbPickRestants);

      const goodAnswer = pick(departements, randomIndex);

      const startQuestionTime = Date.now();
      goodAnswer.startQuestionTime = startQuestionTime;

      setGameState({
        ...gameState,
        nbGuess,
        goodAnswer,
        lastGoodAnswer,
      });
    } else {
      setShowAlertEndGame(true);
      setStep(Step.NOMBRE_GUESS);
    }
  };

  const verify = (goodAnswer: FormattedDepartement, answer: string) => {
    const correct = checkAnswer(answer, goodAnswer);

    goodAnswer.answer = answer;
    goodAnswer.founded = correct;
    goodAnswer.answerTime = Date.now() - goodAnswer.startQuestionTime!;
  };

  const isGameStarted = () =>
    countPicked(gameState.departements) > 0;

  const getGameDisplay = (gameState: GameState) => {
    const { goodAnswer, lastGoodAnswer } = gameState;

    console.log(gameState);

    switch (step) {
      case Step.NOMBRE_GUESS:
        return (
          <div>
            {isGameStarted() && <div className="mb-4">Nouvelle partie ?</div>}
            {getNbGuessQuestion()}
          </div>
        );
      case Step.GUESS:
        return (
          <div>
            {lastGoodAnswer && (
              <React.Fragment>
                {lastGoodAnswer.founded
                    ? <div className="mb-6">Bonne réponse : <span className="font-bold">{lastGoodAnswer.name}</span></div>
                    : <div className="mb-6">
                        <p>Mince alors, perdu! La bonne réponse était : <span className="font-bold">{lastGoodAnswer.name}</span></p>
                        <p>Votre réponse : <span className="font-bold">{lastGoodAnswer.answer}</span></p>
                      </div>
                }
              </React.Fragment>
            )}
            {goodAnswer && <div>Quel est le département suivant : <span className="font-bold">{goodAnswer.code}</span></div>}
          </div>
        );
      default:
        return "";
    }
  };

  const renderStats = (departements: FormattedDepartement[]) => (
    <ScrollArea className="h-[200px] max-h-[300px] md:h-[300px] md:max-h-[500px] min-w-[260px] max-w-[300px] rounded-md border mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Code</TableHead>
            <TableHead className="font-bold">Nom</TableHead>
            <TableHead className="font-bold">Réponse</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departements
            .filter(departement => departement.picked)
            .map((departement) => (
              <TableRow key={departement.code}>
                <TableCell>{departement.code}</TableCell>
                <TableCell>{departement.name}</TableCell>
                <TableCell className="flex justify-center">
                  {departement.founded ? <CircleCheck color="#4f8007"/> : <CircleX color="#d31745"/>}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  const getNbGuessQuestion = () =>
    <div>Combien de départements voulez vous deviner ?</div>;

  const getAnswerTimeOrderedDepartements = () => _.orderBy(
    gameState.departements.filter((departement) => departement.answerTime),
    (departement) => departement.startQuestionTime
  ).reverse();

  return (
    <div>
      <div className="w-full flex flex-col md:flex-row justify-center h-screen">
        <div className="flex flex-col gap-2 flex-1 justify-center items-center">
          <div className="grid grid-cols-[3fr_1fr] gap-2">
            <span className="text-sm">Question : </span>
            <div className="flex justify-center">
              <Badge className="align-center">
                {`${countPicked(gameState.departements)}/${gameState.nbGuess}`}
              </Badge>
            </div>
            <span className="text-sm">Nombre de départements trouvés : </span>
            <div className="flex justify-center">
              <Badge className="bg-green-600">
                {`${countFounded(gameState.departements)}/${countAnswered(gameState.departements)}`}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 w-full flex flex-col justify-center">
          <Form {...form}>
            <Card className="w-full m-[10px] md:m-0 h-[400px]">
              <CardHeader>
                <div className="flex w-full justify-center">
                  <h1 className="text-xl font-bold">Quiz des départements</h1>
                </div>
              </CardHeader>
              <CardContent className="w-full flex-1 flex flex-col justify-center m-2 text-center">
                {getGameDisplay(gameState)}
              </CardContent>
              <CardFooter>
                <form
                  onSubmit={form.handleSubmit(handleInput)}
                  className="w-full"
                >
                  <div className="flex gap-2">
                    {step === Step.NOMBRE_GUESS
                      ? <FormField
                          control={form.control}
                          name="nbGuess"
                          render={({ field }) => (
                            <SliderPrimitive.Root
                              className="ml-4 mr-4 relative flex w-full touch-none select-none items-center"
                              step={1}
                              min={1}
                              max={gameState.departements.length}
                              value={[field.value]}
                              onValueChange={(val) => field.onChange(val[0])}
                            >
                              <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
                                <SliderPrimitive.Range className="absolute h-full bg-primary" />
                              </SliderPrimitive.Track>
                              <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                                <Badge className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 -top-5">
                                  <span>{field.value}</span>
                                  <div className="absolute border-[6px] left-1/2 -translate-x-1/2 border-transparent border-t-primary top-full" />
                                </Badge>
                              </SliderPrimitive.Thumb>
                            </SliderPrimitive.Root>
                          )}
                        />
                      : <FormField
                          control={form.control}
                          name="saisie"
                          render={({ field }) => (
                            <Input
                              placeholder="Votre réponse (vous pouvez appuyez sur la touche Entrée)"
                              {...field}
                            />
                          )}
                        />
                    }
                    <Button className="bg-black text-white" type="submit">
                      Confirmer
                    </Button>
                  </div>
                </form>
              </CardFooter>
            </Card>
          </Form>
        </div>
        <div className="flex flex-col gap-0.5 flex-1 justify-center items-center overflow-auto">
          <div>
            {countAnswered(gameState.departements) > 0 && renderStats(getAnswerTimeOrderedDepartements())}
          </div>
        </div>
      </div>
      <AlertEndGame
        gameState={gameState}
        open={showAlertEndGame}
        setClose={() => setShowAlertEndGame(false)}
      />
    </div>
  );
}
