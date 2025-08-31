import { departements } from "./departements";

export const countFounded = <T extends { founded: boolean }>(data: T[]) =>
    data
        .filter(({ founded }) => founded)
        .length;

export const countPicked = <T extends { picked: boolean }>(data: T[]) =>
    data
        .filter(({ picked }) => picked)
        .length;

export const countAnswered = <T extends { answerTime?: number }>(data: T[]) => 
    data
        .filter(({ answerTime }) => answerTime)
        .length;

export const pick = <T extends { picked: boolean }>(data: T[], randomIndex: number) => {
    const departement = data.filter(({ picked }) => !picked)[randomIndex];
    departement.picked = true;
    return departement;
}

export const normalize = (str: string) =>
    str
        .normalize('NFD')
        .replace(/[\u0300-\u036f\s\-]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

export const checkAnswer = <T extends { name: string }>(answer: string, goodAnswer: T) =>
    normalize(answer) === normalize(goodAnswer.name);

export const logStats = <T extends { founded: boolean, picked: boolean }[]>(formattedDepartements: T) =>
    console.log(`${countFounded(formattedDepartements)}/${countPicked(formattedDepartements)}`);

export interface FormattedDepartement {
    code: string;
    name: string;
    founded: boolean;
    picked: boolean;
    answerTime?: number;
    startQuestionTime?: number;
    answer?: string;
};

export const getFormattedDepartements: () => FormattedDepartement[] = () => departements.map(departement => ({
    code: departement.code,
    name: departement.name,
    founded: false,
    picked: false
}));

export const getTotalTime = <T extends { answerTime?: number }>(data: T[]) =>
    data
        .filter(departement => departement.answerTime)
        .reduce((acc, current) => acc + current.answerTime!, 0);
