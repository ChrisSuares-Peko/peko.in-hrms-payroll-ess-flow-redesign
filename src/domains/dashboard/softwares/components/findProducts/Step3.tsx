import { Button, Flex, Radio, Checkbox, Typography } from 'antd';

import { IQuestion, AnswerMap } from '../../types';

const { Text } = Typography;

type Props = {
    categoryQuestions: IQuestion[];
    currentCategoryIndex: number;
    categoryAnswers: AnswerMap;
    handleCategoryAnswer: (key: string, questionText: string, value: string[]) => void;
    handleCategoryFollowUpAnswer: (key: string, followUpQuestion: string, value: string[]) => void;
    nextCategoryQuestion: () => void;
    prevCategoryQuestion: () => void;
};

const Step3 = ({
    categoryQuestions,
    currentCategoryIndex,
    categoryAnswers,
    handleCategoryAnswer,
    handleCategoryFollowUpAnswer,
    nextCategoryQuestion,
    prevCategoryQuestion,
}: Props) => {
    const currentQuestion = categoryQuestions?.[currentCategoryIndex];
    if (!currentQuestion) return null;

    const entry = categoryAnswers[currentQuestion.key];
    const selected = entry?.answer ?? [];

    const selectedOption = currentQuestion.options.find(o => selected.includes(o.value));
    const followUp = selectedOption?.followUp;

    return (
        <>
            <Text className="text-lg font-semibold text-[#101828]">
                Specialized question {currentCategoryIndex + 1} of {categoryQuestions.length}
            </Text>

            <Text className="block mt-2 mb-6 text-[#667085]">{currentQuestion.question}</Text>

            {currentQuestion.type === 'singleChoice' ||
            currentQuestion.type === 'blockRadioCard' ||
            currentQuestion.type === 'inlineTextCard' ? (
                <Radio.Group
                    value={selected[0]}
                    onChange={e =>
                        handleCategoryAnswer(currentQuestion.key, currentQuestion.question, [
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
                        handleCategoryAnswer(
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

            {followUp && selected.length > 0 && (
                <div className="mt-6  ms-10">
                    <Text className="block mb-2 text-[#667085]">{followUp.label}</Text>

                    {followUp.type === 'singleChoice' ||
                    followUp.type === 'blockRadioCard' ||
                    followUp.type === 'inlineTextCard' ? (
                        <Radio.Group
                            value={entry?.followUp?.answer?.[0]}
                            onChange={e =>
                                handleCategoryFollowUpAnswer(currentQuestion.key, followUp.label, [
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
                                handleCategoryFollowUpAnswer(
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
                <Button danger onClick={prevCategoryQuestion} className="w-1/2">
                    Go Back
                </Button>
                <Button type="primary" danger onClick={nextCategoryQuestion} className="w-1/2">
                    {currentCategoryIndex === categoryQuestions.length - 1 ? 'Review' : 'Next'}
                </Button>
            </Flex>
        </>
    );
};

export default Step3;
