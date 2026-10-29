import { Typography, Row, Col, Steps, Flex, Button } from 'antd';

import QuestionSteps from './QuestionSteps';
import { AnswerSheet, Category, ValidateAnswers } from '../../../types/dashboard';

const { Step } = Steps;

const { Text } = Typography;

interface props {
    questionSheet: Category[] | undefined;
    handleAnswerChange: (
        categoryID: number,
        questionId: number,
        optionId: number,
        selectedUnitId: number | null,
        value: any
    ) => void;
    handleSubmit: () => void;
    answerSheet: AnswerSheet;
    questionNum: ValidateAnswers | undefined;
    btnLoading: boolean;
    handleElectricityChange: (
        categoryID: number,
        questionId: number,
        oldOptionId: number | undefined,
        newOptionId: number
    ) => void;
}
const Question = ({
    questionSheet,
    handleAnswerChange,
    handleSubmit,
    answerSheet,
    questionNum,
    btnLoading,
    handleElectricityChange,
}: props) => (
    <Flex justify="center">
        <Row className="md:w-8/12">
            <Col xs={24} className="mt-5 ">
                <Flex className="md:text-2xl text-xl mb-8 font-normal md:ml-12 ">
                    Calculate Your Carbon Footprint and Start Taking Action
                </Flex>
                <Steps
                    direction="vertical"
                    size="default"
                    current={Object.keys(questionNum ?? {}).length}
                    responsive
                >
                    {questionSheet &&
                        questionSheet.map(
                            (category, index) =>
                                Object.keys(questionNum ?? {}).length >= index && (
                                    <Step
                                        key={index}
                                        iconPrefix="0"
                                        title={
                                            <Text className="w-full">
                                                Question: {index + 1}/{questionSheet.length}
                                            </Text>
                                        }
                                        description={category.questions.map((question, idx) => (
                                            <QuestionSteps
                                                key={idx}
                                                answerSheet={answerSheet}
                                                category={category}
                                                handleAnswerChange={handleAnswerChange}
                                                handleElectricityChange={handleElectricityChange}
                                                idx={idx}
                                                questions={question}
                                            />
                                        ))}
                                    />
                                )
                        )}
                </Steps>
                <Button
                    className="h-10 md:w-[94%] w-full  mt-8 md:ml-12 "
                    type="primary"
                    danger
                    disabled={Object.keys(questionNum ?? {}).length !== questionSheet?.length}
                    loading={btnLoading}
                    onClick={handleSubmit}
                >
                    Submit
                </Button>
            </Col>
        </Row>
    </Flex>
);
export default Question;
