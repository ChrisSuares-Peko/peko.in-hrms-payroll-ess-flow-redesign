import { Answer, AnswerSheet, ValidateAnswers } from '../types/dashboard';

interface Props {
    setQuestionNum: (value: any) => void;
    setAnswerSheet: (value: any) => void;
    answerSheet: AnswerSheet;
    questionNum: ValidateAnswers | undefined;
    advancedCal: boolean;
    getData: (type: string, answerSheet: AnswerSheet) => void;
}

const useCarbonHandles = ({
    setAnswerSheet,
    setQuestionNum,
    answerSheet,
    questionNum,
    advancedCal,
    getData,
}: Props) => {
    const handleAnswerChange = (
        categoryID: number,
        questionId: number,
        optionId: number,
        selectedUnitId: number | null,
        value: any
    ) => {
        const updatedVal = Number.isNaN(parseFloat(value)) ? null : parseInt(value, 10);
        setAnswerSheet((prevSheet: AnswerSheet) => {
            const questionIndex = prevSheet[categoryID].answers.findIndex(q => q[questionId]);
            const updatedSheet: AnswerSheet = { ...prevSheet };
            updatedSheet[categoryID].answers[questionIndex] = {
                ...updatedSheet[categoryID].answers[questionIndex],
                [questionId]: {
                    ...updatedSheet[categoryID].answers[questionIndex][questionId],
                    [optionId]: {
                        selectedUnitId,
                        value: updatedVal,
                    },
                },
            };

            if (checkAllAnswers(categoryID, updatedSheet)) {
                if (updatedVal || updatedVal === 0)
                    setQuestionNum((prev: ValidateAnswers) => ({ ...prev, [categoryID]: true }));
            } else if (questionNum && questionNum[categoryID]) {
                setQuestionNum((prev: ValidateAnswers) => {
                    const updatedQuestionNum = { ...prev };
                    delete updatedQuestionNum[categoryID];
                    return updatedQuestionNum;
                });
            }

            return updatedSheet;
        });
    };

    const checkAllAnswers = (categoryID: number, updatedSheet: AnswerSheet) => {
        const allAnswered = updatedSheet[categoryID].answers.every(question =>
            Object.values(question).every(option =>
                Object.values(option).every((answer: Answer) => answer.value !== null)
            )
        );
        return allAnswered;
    };
    const handleSubmit = () => {
        getData(advancedCal ? 'ADVANCED' : 'BASIC', answerSheet);
    };

    const handleElectricityChange = (
        categoryID: number,
        questionId: number,
        oldOptionId: number | undefined,
        newOptionId: number
    ) => {
        const updatedVal = oldOptionId
            ? answerSheet[categoryID].answers[0][questionId][oldOptionId].value
            : 0;
        setAnswerSheet((prevSheet: AnswerSheet) => {
            const updatedSheet: AnswerSheet = {
                ...prevSheet,
                [categoryID]: {
                    ...prevSheet[categoryID],
                    answers: [
                        {
                            ...prevSheet[categoryID].answers[0],
                            [questionId]: {
                                ...prevSheet[categoryID].answers[0][questionId],
                                ...(oldOptionId && {
                                    [oldOptionId]: {
                                        ...prevSheet[categoryID].answers[0][questionId][
                                            oldOptionId
                                        ],
                                        value: 0,
                                    },
                                }),
                                [newOptionId]: {
                                    ...prevSheet[categoryID].answers[0][questionId][newOptionId],
                                    value: updatedVal,
                                },
                            },
                        },
                    ],
                },
            };

            return updatedSheet;
        });
    };

    return { handleAnswerChange, handleElectricityChange, handleSubmit };
};

export default useCarbonHandles;
