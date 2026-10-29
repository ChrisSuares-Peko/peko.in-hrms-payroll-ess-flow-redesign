import { useState } from 'react';

import { Flex } from 'antd';
import { useLocation } from 'react-router-dom';

import CalculatorSkeleton from '../components/CalculatorSkeleton';
import Question from '../components/dashboard/CarbonForm/Question';
import useCarbonHandles from '../hooks/useCarbonHandles';
import useGetQuestions from '../hooks/useGetQuestions';
import useSubmitAnswer from '../hooks/useSubmitAnswer';
import { ValidateAnswers } from '../types/dashboard';

const CarbonForm = () => {
    const [questionNum, setQuestionNum] = useState<ValidateAnswers | undefined>({});
    const { state } = useLocation();
    const { getData, btnLoading } = useSubmitAnswer();
    const { questionSheet, isLoading, answerSheet, setAnswerSheet, advancedCal } = useGetQuestions(
        !!state?.advanced
    );
    const { handleAnswerChange, handleElectricityChange, handleSubmit } = useCarbonHandles({
        setAnswerSheet,
        setQuestionNum,
        answerSheet,
        questionNum,
        advancedCal,
        getData,
    });
    return (
        <Flex vertical justify="center">
            {isLoading ? (
                <CalculatorSkeleton />
            ) : (
                <Question
                    questionNum={questionNum}
                    questionSheet={questionSheet}
                    handleSubmit={handleSubmit}
                    handleAnswerChange={handleAnswerChange}
                    answerSheet={answerSheet}
                    btnLoading={btnLoading}
                    handleElectricityChange={handleElectricityChange}
                />
            )}
        </Flex>
    );
};

export default CarbonForm;
