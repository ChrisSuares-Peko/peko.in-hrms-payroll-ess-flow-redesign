import { useEffect, useState } from 'react';

import { Flex, Select, Input } from 'antd';

import { AnswerSheet, Category, question } from '../../../types/dashboard';

interface props {
    questions: question;
    category: Category;
    handleAnswerChange: (
        categoryID: number,
        questionId: number,
        optionId: number,
        selectedUnitId: number | null,
        value: any
    ) => void;
    answerSheet: AnswerSheet;
    handleElectricityChange: (
        categoryID: number,
        questionId: number,
        oldOptionId: number | undefined,
        newOptionId: number
    ) => void;
}
const ElectricityQuestion = ({
    questions,
    category,
    handleAnswerChange,
    answerSheet,
    handleElectricityChange,
}: props) => {
    const [electricityOption, setElectricityOption] = useState<number>();

    useEffect(() => {
        const electricID = questions.options.find(option => option.title === 'Middle East')?.id;
        setElectricityOption(electricID);
        handleAnswerChange(
            category.id,
            questions.id,
            electricID ?? 0,
            answerSheet[category.id].answers[0][questions.id][electricID ?? 0].selectedUnitId,
            null
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questions]);
    return (
        <Flex vertical gap={10} className="mt-5">
            <Select
                className="w-full"
                value={questions.options.find(option => option.id === electricityOption)?.title}
                placeholder="Select"
                disabled
            />
            <Flex gap={20} className="flex xs:flex-col md:flex-row">
                <Input
                    type="text"
                    placeholder="Enter value"
                    className="w-full"
                    disabled={electricityOption === undefined}
                    value={
                        answerSheet[category.id].answers[0][questions.id][electricityOption ?? 0]
                            ?.value
                    }
                    onChange={e => {
                        const { value } = e.target;
                        let filteredValue: any = value;
                        if (value === '') filteredValue = null;
                        else filteredValue = value.replace(/[^\d]/g, '');
                        handleAnswerChange(
                            category.id,
                            questions.id,
                            electricityOption ?? 0,
                            answerSheet[category.id].answers[0][questions.id][
                                electricityOption ?? 0
                            ].selectedUnitId,
                            filteredValue
                        );
                    }}
                />
                <Select
                    className="w-full"
                    disabled={electricityOption === undefined}
                    defaultValue={
                        questions.options.find(option => option.id === electricityOption)?.units[0]
                            ?.id ?? questions.options[0]?.units[0]?.id
                    }
                    onChange={e =>
                        handleAnswerChange(
                            category.id,
                            questions.id,
                            electricityOption ?? 0,
                            e,
                            answerSheet[category.id].answers[0][questions.id][
                                electricityOption ?? 0
                            ].value
                        )
                    }
                >
                    {(
                        questions.options.find(option => option.id === electricityOption) ||
                        questions.options[0]
                    ).units.map((unit, i) => (
                        <Select.Option key={i} value={unit.id}>
                            {unit.unit}
                        </Select.Option>
                    ))}
                </Select>
            </Flex>
        </Flex>
    );
};
export default ElectricityQuestion;
