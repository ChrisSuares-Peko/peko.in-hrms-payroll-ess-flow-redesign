import { Button, Flex, Radio, Checkbox, Typography } from 'antd';

import { IQuestion, AnswerMap } from '../../types';

const { Text } = Typography;

type Step2Props = {
    generalQuestions: IQuestion[];
    currentGeneralIndex: number;
    generalAnswers: AnswerMap;
    handleGeneralAnswer: (key: string, questionText: string, value: string[]) => void;
    handleGeneralFollowUpAnswer: (key: string, followUpQuestion: string, value: string[]) => void;
    nextGeneralQuestion: () => void;
    prevGeneralQuestion: () => void;
    isLoading: boolean;
};

const Step2 = ({
    generalQuestions,
    currentGeneralIndex,
    generalAnswers,
    handleGeneralAnswer,
    handleGeneralFollowUpAnswer,
    nextGeneralQuestion,
    prevGeneralQuestion,
    isLoading,
}: Step2Props) => {
    const currentQuestion = generalQuestions[currentGeneralIndex];
    if (!currentQuestion) return null;

    const entry = generalAnswers[currentQuestion.key];
    const selected = entry?.answer ?? [];

    // find follow up from the currently selected option (single choice only)
    const selectedOption = currentQuestion.options.find(o => selected.includes(o.value));
    const followUp = selectedOption?.followUp;

    return (
        <>
            <Text className="text-lg font-semibold text-[#101828]">
                General question {currentGeneralIndex + 1} of {generalQuestions.length}
            </Text>

            <Text className="block mt-2 mb-6 text-[#667085]">{currentQuestion.question}</Text>

            {/* Main question */}
            {currentQuestion.type === 'singleChoice' ||
            currentQuestion.type === 'blockRadioCard' ||
            currentQuestion.type === 'inlineTextCard' ? (
                <Radio.Group
                    value={selected[0]}
                    onChange={e =>
                        handleGeneralAnswer(currentQuestion.key, currentQuestion.question, [
                            e.target.value,
                        ])
                    }
                    className="w-full mt-6"
                >
                    <div className="flex flex-col gap-4 w-full">
                        {currentQuestion.options.map(opt => (
                            <Radio
                                key={opt.value}
                                value={opt.value}
                                className="w-full flex border rounded-lg px-4 py-3"
                            >
                                {opt.label}
                            </Radio>
                        ))}
                    </div>
                </Radio.Group>
            ) : (
                <Checkbox.Group
                    value={selected}
                    onChange={values =>
                        handleGeneralAnswer(
                            currentQuestion.key,
                            currentQuestion.question,
                            values as string[]
                        )
                    }
                    className="w-full mt-6"
                >
                    <div className="flex flex-col gap-4 w-full">
                        {currentQuestion.options.map(opt => (
                            <Checkbox
                                key={opt.value}
                                value={opt.value}
                                className="w-full flex border rounded-lg px-4 py-3"
                            >
                                {opt.label}
                            </Checkbox>
                        ))}
                    </div>
                </Checkbox.Group>
            )}

            {/* Follow-up question — only shown when a main answer is selected and it has a follow up */}
            {followUp && selected.length > 0 && (
                <div className="mt-6 ms-10">
                    <Text className="block pb-4  text-[#667085]">{followUp.label}</Text>

                    {followUp.type === 'singleChoice' ||
                    followUp.type === 'blockRadioCard' ||
                    followUp.type === 'inlineTextCard' ? (
                        <Radio.Group
                            value={entry?.followUp?.answer?.[0]}
                            onChange={e =>
                                handleGeneralFollowUpAnswer(currentQuestion.key, followUp.label, [
                                    e.target.value,
                                ])
                            }
                            className="w-full"
                        >
                            <div className="flex flex-col gap-4 w-full">
                                {followUp.options.map(opt => (
                                    <Radio
                                        key={opt.value}
                                        value={opt.value}
                                        className="w-full flex border rounded-lg px-4 py-3"
                                    >
                                        {opt.label}
                                    </Radio>
                                ))}
                            </div>
                        </Radio.Group>
                    ) : (
                        <Checkbox.Group
                            value={entry?.followUp?.answer ?? []}
                            onChange={values =>
                                handleGeneralFollowUpAnswer(
                                    currentQuestion.key,
                                    followUp.label,
                                    values as string[]
                                )
                            }
                            className="w-full"
                        >
                            <div className="flex flex-col gap-4 w-full">
                                {followUp.options.map(opt => (
                                    <Checkbox
                                        key={opt.value}
                                        value={opt.value}
                                        className="w-full flex border rounded-lg px-4 py-3"
                                    >
                                        {opt.label}
                                    </Checkbox>
                                ))}
                            </div>
                        </Checkbox.Group>
                    )}
                </div>
            )}

            <Flex className="mt-10" gap={10}>
                <Button danger onClick={prevGeneralQuestion} className="w-1/2">
                    Go Back
                </Button>
                <Button
                    type="primary"
                    danger
                    onClick={nextGeneralQuestion}
                    className="w-1/2"
                    loading={isLoading}
                    disabled={isLoading}
                >
                    Next
                </Button>
            </Flex>
        </>
    );
};

export default Step2;
