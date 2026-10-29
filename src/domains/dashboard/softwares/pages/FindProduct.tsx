import { Steps, Card, Typography, ConfigProvider, Flex } from 'antd';
import Lottie from 'react-lottie';

import useScreenSize from '@src/hooks/useScreenSize';

import rfpResponseSpinner from '../assets/animation/rfpResponseSpinner.json';
import Step1 from '../components/findProducts/Step1';
import Step2 from '../components/findProducts/Step2';
import Step3 from '../components/findProducts/Step3';
import Step4 from '../components/findProducts/Step4';
import useFindProduct from '../hooks/rfp/useFindProduct';
import '../assets/styles/styles.css';

const { Text } = Typography;

const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: rfpResponseSpinner,
};

export default function SoftwareFinder() {
    const finder = useFindProduct();
    const screens = useScreenSize();
    return (
        <Flex className="relative min-h-screen flex flex-col items-center py-8 sm:px-4 custom-step-navigator">
            <Text className="sm:text-lg xl:text-3xl font-medium text-center">
                Let Us Help You Find The Right Software
            </Text>

            <Flex className="w-full md:max-w-3xl my-10">
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#FF4F4F',
                        },
                        components: {
                            Steps: {
                                navArrowColor: '#d9d9d9',
                                colorPrimary: '#FF4F4F',
                            },
                        },
                    }}
                >
                    <Steps
                        type="navigation"
                        size="small"
                        current={finder.step - 1}
                        items={[
                            { title: 'Select Category' },
                            { title: 'General Questions' },
                            { title: 'Special Questions' },
                            { title: 'Review & Submit' },
                        ]}
                    />
                </ConfigProvider>
            </Flex>

            <Card className="w-full max-w-3xl rounded-2xl shadow-md">
                {finder.step === 1 && !finder.isSubmitting && (
                    <Step1
                        selectedCategory={finder.selectedCategory}
                        setSelectedCategory={finder.handleCategoryChange}
                        categoryList={finder.categoryList}
                        navigate={finder.navigate}
                        fetchGeneralQ={finder.fetchGeneralQ}
                        isLoading={finder.isLoading}
                    />
                )}
                {finder.step === 2 && !finder.isSubmitting && (
                    <Step2
                        generalQuestions={finder.generalQuestions}
                        currentGeneralIndex={finder.currentGeneralIndex}
                        generalAnswers={finder.generalAnswers}
                        handleGeneralAnswer={finder.handleGeneralAnswer}
                        handleGeneralFollowUpAnswer={finder.handleGeneralFollowUpAnswer}
                        nextGeneralQuestion={finder.nextGeneralQuestion}
                        prevGeneralQuestion={finder.prevGeneralQuestion}
                        isLoading={finder.isLoading}
                    />
                )}
                {finder.step === 3 && !finder.isSubmitting && (
                    <Step3
                        categoryQuestions={finder.categoryQuestions}
                        currentCategoryIndex={finder.currentCategoryIndex}
                        categoryAnswers={finder.categoryAnswers}
                        handleCategoryAnswer={finder.handleCategoryAnswer}
                        handleCategoryFollowUpAnswer={finder.handleCategoryFollowUpAnswer}
                        nextCategoryQuestion={finder.nextCategoryQuestion}
                        prevCategoryQuestion={finder.prevCategoryQuestion}
                    />
                )}
                {finder.step === 4 && !finder.isSubmitting && (
                    <Step4
                        prevQuestionFromReview={finder.prevQuestionFromReview}
                        buildPayload={finder.buildPayload}
                        onSubmit={finder.handleSubmit}
                        isSubmitting={finder.isSubmitting}
                    />
                )}
            </Card>
            {finder.isSubmitting && (
                <Flex className="absolute bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 top-0 left-0 right-0 bottom-0">
                    <Flex
                        vertical
                        className="bg-white px-8 pb-8 rounded-xl shadow-lg text-center border w-[90%] md:w-[70%] max-h-[90vh] overflow-auto"
                    >
                        <Lottie
                            options={defaultOptions}
                            height={screens.xs ? 80 : 150}
                            width={200}
                        />
                        <Text className="font-bold md:font-extra-bold sm:text-2xl opacity-85">
                            Fetching recommendations...
                        </Text>
                        <Text className="  text-[#171717] opacity-70 text-[.6rem] sm:text-[.8rem] md:mt-3 md:text-xl md:leading-7">
                            This may take a few seconds. Please do not refresh or go back.
                        </Text>
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
}
