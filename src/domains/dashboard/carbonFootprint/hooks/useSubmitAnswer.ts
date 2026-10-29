import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { submitAnswers } from '../api/index';
import { AnswerSheet, AnswersResponse } from '../types/dashboard';

export default function useSubmitAnswer() {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const getData = useCallback(
        async (questionType: string, answers: AnswerSheet) => {
            setIsLoading(true);
            const data: AnswersResponse | false = await submitAnswers({
                userId: id,
                userType: role,
                questionType,
                answers,
            });
            if (data) {
                navigate(paths.zeroCarbon.result, {
                    state: {
                        data: data.data,
                        advanced: questionType !== 'ADVANCED',
                    },
                });
            }
            setIsLoading(false);
        },
        [id, role, navigate]
    );
    return { getData, btnLoading: isLoading };
}
