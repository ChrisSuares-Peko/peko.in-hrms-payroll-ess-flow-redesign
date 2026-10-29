import React from 'react';

import { Button, Flex, Typography, Divider } from 'antd';

import { FinalPayload, FinalPayloadQuestion } from '../../types';

const { Text, Title } = Typography;

type Props = {
    prevQuestionFromReview: () => void;
    buildPayload: () => FinalPayload;
    onSubmit: (payload: FinalPayload) => void;
    isSubmitting: boolean;
};

const AnswerItem = ({ answer }: { answer: string }) => (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#F9FAFB] border border-gray-200 rounded-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        <Text className="text-sm text-[#101828]">{answer}</Text>
    </div>
);

const AnswerDisplay = ({ item, index }: { item: FinalPayloadQuestion; index: number }) => {
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];

    let followUpAnswers: string[] = [];
    if (item.followUp) {
        followUpAnswers = Array.isArray(item.followUp.answer)
            ? item.followUp.answer
            : [item.followUp.answer];
    }

    return (
        <div className="flex items-start gap-3">
            {/* Q number badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-xs font-semibold mt-0.5">
                Q{index + 1}
            </div>

            <div className="flex-1 flex flex-col gap-2">
                <Text strong className="text-sm text-[#101828]">
                    {item.question}
                </Text>

                <div className="flex flex-col gap-2">
                    {answers.map((ans, i) => (
                        <AnswerItem key={i} answer={ans} />
                    ))}
                </div>

                {item.followUp && followUpAnswers.length > 0 && (
                    <div className="ms-4 flex flex-col gap-2">
                        <Text className="text-sm font-bold">{item.followUp.question}</Text>
                        <div className="flex flex-col gap-2">
                            {followUpAnswers.map((ans, i) => (
                                <AnswerItem key={i} answer={ans} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Step4: React.FC<Props> = ({
    prevQuestionFromReview,
    buildPayload,
    onSubmit,
    isSubmitting,
}) => {
    const payload = buildPayload();

    return (
        <div className="relative">
            <Title level={4} className="!mb-1">
                Review Your Answers
            </Title>
            <Text type="secondary" className="text-sm">
                Please review all your responses before submitting the questionnaire
            </Text>

            <Divider className="my-4" />

            <Flex vertical className="h-96 overflow-scroll" style={{ scrollbarWidth: 'none' }}>
                {/* General questions */}
                {Object.values(payload.generalQuestions).length > 0 && (
                    <div className="mb-6">
                        <div className="flex flex-col gap-5">
                            {Object.values(payload.generalQuestions).map((item, i) => (
                                <AnswerDisplay key={i} item={item} index={i} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Specialized questions */}
                {Object.values(payload.specializedQuestions).length > 0 && (
                    <div className="mb-6">
                        <div className="flex flex-col gap-5">
                            {Object.values(payload.specializedQuestions).map((item, i) => (
                                <AnswerDisplay
                                    key={i}
                                    item={item}
                                    index={Object.values(payload.generalQuestions).length + i}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </Flex>
            {/* Footer */}
            <Flex className="mt-6" gap={12}>
                <Button
                    danger
                    onClick={() => prevQuestionFromReview()}
                    className="w-1/2"
                    disabled={isSubmitting}
                >
                    Go Back
                </Button>
                <Button
                    type="primary"
                    danger
                    onClick={() => onSubmit(payload)}
                    className="w-1/2"
                    loading={isSubmitting}
                >
                    Submit
                </Button>
            </Flex>
        </div>
    );
};

export default Step4;
