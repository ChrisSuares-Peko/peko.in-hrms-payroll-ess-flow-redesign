import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getQuestions } from '../api/index';
import { AnswerSheet, Category, questionsResponse } from '../types/dashboard';

const useGetQuestions = (advanced: boolean) => {
    const [advancedCal, setAdvancedCal] = useState<boolean>(false);
    const [answerSheet, setAnswerSheet] = useState<AnswerSheet>({});
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [questionSheet, setQuestionSheet] = useState<Category[]>();
    const getData = useCallback(
        async (questionType: string) => {
            const data: questionsResponse | false = await getQuestions({
                userId: id,
                userType: role,
                questionType,
            });
            if (data) {
                setQuestionSheet(data.data.questionSheet);
                setAnswerSheet(data.data.answerSheet);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    useEffect(() => {
        if (advanced) {
            setAdvancedCal(true);
            getData('ADVANCED');
        } else {
            setAdvancedCal(false);
            getData('BASIC');
        }
    }, [advanced, getData]);

    return { questionSheet, isLoading, answerSheet, setAnswerSheet, advancedCal };
};

export default useGetQuestions;
