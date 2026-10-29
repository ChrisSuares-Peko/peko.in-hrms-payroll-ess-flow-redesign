import { InfoCircleOutlined } from '@ant-design/icons';
import { Typography, Flex, Select, Tooltip, Input } from 'antd';

import ElectricityQuestion from './ElectricityQuestion';
import { AnswerSheet, Category, question } from '../../../types/dashboard';

const { Text } = Typography;

interface props {
    idx: number;
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
const QuestionSteps = ({
    idx,
    questions,
    category,
    handleAnswerChange,
    answerSheet,
    handleElectricityChange,
}: props) => (
    <Flex vertical className="mt-2" key={idx}>
        <Text className="text-sm font-medium xs:mt-0 ">
            {questions.question}
            <Tooltip showArrow title={questions.toolTip} className="ml-1">
                <InfoCircleOutlined />
            </Tooltip>
        </Text>
        {category.category === 'Electricity' ? (
            <ElectricityQuestion
                answerSheet={answerSheet}
                category={category}
                handleAnswerChange={handleAnswerChange}
                handleElectricityChange={handleElectricityChange}
                questions={questions}
            />
        ) : (
            questions.options.map((option, i) => (
                <Flex key={i} gap={20} align="center" className="mt-5 flex xs:flex-col md:flex-row">
                    <Input
                        type="text"
                        onChange={e => {
                            const { value } = e.target;
                            let filteredValue: any = value;
                            if (value === '') filteredValue = null;
                            else filteredValue = value.replace(/[^\d]/g, '');
                            handleAnswerChange(
                                category.id,
                                questions.id,
                                option.id,
                                answerSheet[category.id].answers.find(q => q[questions.id])?.[
                                    questions.id
                                ][option.id]?.selectedUnitId ?? option.units[0].id,
                                filteredValue
                            );
                        }}
                        placeholder={option.title}
                        value={
                            answerSheet[category.id].answers.find(q => q[questions.id])?.[
                                questions.id
                            ][option.id]?.value
                        }
                        maxLength={4}
                    />
                    <Select
                        className="w-full"
                        defaultValue={option.units[0].id}
                        onChange={e =>
                            handleAnswerChange(
                                category.id,
                                questions.id,
                                option.id,
                                e,
                                answerSheet[category.id].answers.find(q => q[questions.id])?.[
                                    questions.id
                                ][option.id]?.value
                            )
                        }
                    >
                        {option.units.map((unit, arrIndex) => (
                            <Select.Option key={arrIndex} value={unit.id}>
                                {unit.unit}
                            </Select.Option>
                        ))}
                    </Select>
                </Flex>
            ))
        )}
    </Flex>
);

export default QuestionSteps;
