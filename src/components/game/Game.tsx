"use client";

import React, { useState } from "react";
import _ from "lodash";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Form, FormField } from "../ui/form";
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
  RELANCE,
  NOMBRE_GUESS,
  GUESS,
  VERIFY,
}

export interface GameState {
  nbGuess: number;
  departements: FormattedDepartement[];
  goodAnswer?: FormattedDepartement;
}

const CONTENT_START = <div>Combien de départements voulez vous deviner ?</div>;
const STEP_LANCEMENT = Step.NOMBRE_GUESS;

const FormSchema = z.object({
  saisie: z.string(),
  nbGuess: z.number(),
});

export default function Game() {
  const initGameState = () => ({
    nbGuess: 0,
    departements: getFormattedDepartements(),
  });

  const [content, setContent] = useState(CONTENT_START);
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
    if (!data.saisie.trim() && ![Step.NOMBRE_GUESS, Step.RELANCE].includes(step)) {
      return;
    }

    switch (step) {
      case Step.RELANCE:
      case Step.NOMBRE_GUESS:
        const newGameState = {
          ...(step === Step.RELANCE ? initGameState() : gameState),
          nbGuess: data.nbGuess,
        };
        setGameState(newGameState);
        guess(newGameState);
        setStep(Step.VERIFY);
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
    const { nbGuess, departements, goodAnswer: lastGoodAnswer } = gameState;
    if (
      countPicked(departements) < departements.length &&
      countPicked(departements) < nbGuess
    ) {
      const nbPickRestants = departements.length - countPicked(departements);
      const randomIndex = Math.floor(Math.random() * nbPickRestants);

      const goodAnswer = pick(departements, randomIndex);

      setContent(
        <div>
          {lastGoodAnswer && (
            <React.Fragment>
              {lastGoodAnswer.founded
                  ? <div className="mb-6">Bonne réponse : {lastGoodAnswer.name}</div>
                  : <div className="mb-6">
                      <p>Mince alors, perdu! La bonne réponse était : <span className="font-bold">{lastGoodAnswer.name}</span></p>
                      <p>Votre réponse : {lastGoodAnswer.answer}</p>
                    </div>
              }
            </React.Fragment>
          )}
          <div>Quel est le département suivant : <span className="font-bold">{goodAnswer.code}</span></div>
        </div>
      );
      const startQuestionTime = Date.now();
      setGameState((prev) => {
        goodAnswer.startQuestionTime = startQuestionTime;
        prev.goodAnswer = goodAnswer;
        return prev;
      });
    } else {
      setShowAlertEndGame(true);
      setContent(
        <div>
          <div className="mb-4">Nouvelle partie ?</div>
          {CONTENT_START}
        </div>
      );
      setStep(Step.RELANCE);
    }
  };

  const verify = (answer: string) => {
    const { goodAnswer } = gameState;
    if (goodAnswer && goodAnswer.startQuestionTime) {
      const correct = checkAnswer(answer, goodAnswer);

      goodAnswer.answer = answer;
      goodAnswer.founded = correct;
      goodAnswer.answerTime = Date.now() - goodAnswer.startQuestionTime;
    }
  };

  return (
    <div>
      <div className="flex w-full justify-center h-screen">
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
            <Card className="w-full mt-10 mb-10 h-[400px]">
              <CardHeader>
                <div className="flex w-full justify-center">
                  <h1 className="text-xl font-bold">Quiz des départements</h1>
                </div>
              </CardHeader>
              <CardContent className="w-full flex-1 flex flex-col justify-center m-2 text-center">
                {content}
              </CardContent>
              <CardFooter>
                <form
                  onSubmit={form.handleSubmit(handleInput)}
                  className="w-full"
                >
                  <div className="flex gap-2">
                    {[Step.NOMBRE_GUESS, Step.RELANCE].includes(step)
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
        <div className="flex flex-col gap-0.5 flex-1 justify-center items-center">
          <div className="grid grid-cols-[1fr_3fr] gap-2">
            {_.orderBy(
              gameState.departements.filter(
                (departement) => departement.answerTime
              ),
              (departement) => departement.startQuestionTime
            ).map((departement, key) => (
              <React.Fragment key={key}>
                <span className={departement.founded ? "text-green-600" : "text-red-500"}>
                  {departement.code}
                </span>
                <span className={departement.founded ? "text-green-600" : "text-red-500"}>
                  {departement.name}
                </span>
              </React.Fragment>
            ))}
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
