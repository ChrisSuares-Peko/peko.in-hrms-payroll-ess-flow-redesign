import { useCallback, useEffect, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    fetchCategoryQuestions,
    fetchGeneralQuestions,
    fetchRfpCategories,
    getRecommandations,
    submitAnswers,
} from '../../api';
import {
    resetRfp,
    setRecommendedProducts,
    setRfpCategories,
    setRfpCategoryAnswers,
    setRfpCategoryQuestions,
    setRfpGeneralAnswers,
    setRfpGeneralQuestions,
    setRfpLastFetchedCategory,
} from '../../slice/softwareSlice';
import { AnswerMap, FinalPayload } from '../../types';
import { FinalPayloadQuestion } from '../../types/rfp';
import scrollTotop from '../../utils/scrollTotop';

const useFindProduct = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { rfpCategories } = useAppSelector(state => state.reducer.software);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const {
        generalQuestions,
        categoryQuestions,
        generalAnswers,
        categoryAnswers,
        lastFetchedCategory,
    } = useAppSelector(state => state.reducer.software.rfp);

    const [step, setStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState(
        lastFetchedCategory || rfpCategories?.[0]?.weburl || ''
    );
    const [currentGeneralIndex, setCurrentGeneralIndex] = useState(0);
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isCancelledRef = useRef(false);

    // if component unmounts we need to cancell the timeout and subsequent polling
    useEffect(
        () => () => {
            isCancelledRef.current = true;
            if (pollingTimeoutRef.current !== null) clearTimeout(pollingTimeoutRef.current);
        },
        []
    );

    // ── Fetch category ────────────────
    const getParentCategories = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchRfpCategories({
            userId: id,
            userType: role,
        });
        if (data) {
            dispatch(setRfpCategories(data.categories));
            dispatch(setRfpLastFetchedCategory(data.categories[0].weburl));
        }

        setIsLoading(false);
    }, [dispatch, id, role]);

    useEffect(() => {
        if (rfpCategories.length === 0) {
            getParentCategories();
        }
    }, [getParentCategories, rfpCategories.length]);

    // ── Fetch general questions (skip if already loaded) ────────────────
    const fetchGeneralQ = useCallback(async (): Promise<void> => {
        if (generalQuestions.length > 0) {
            setCurrentGeneralIndex(0);
            scrollTotop();
            setStep(2);
            return;
        }

        setIsLoading(true);
        const data = await fetchGeneralQuestions({ userId: id, userType: role });
        if (!data) {
            setIsLoading(false);
            return;
        }
        dispatch(setRfpGeneralQuestions(data.generalQuestions));
        dispatch(setRfpGeneralAnswers({}));
        setCurrentGeneralIndex(0);
        setIsLoading(false);
        setStep(2);
    }, [id, role, dispatch, generalQuestions.length]);

    // ── Fetch category questions  ──
    const fetchCategoryQ = useCallback(async (): Promise<void> => {
        if (categoryQuestions.length > 0 && lastFetchedCategory === selectedCategory) {
            // same category already fetched — just navigate, preserve answers
            setCurrentCategoryIndex(0);
            setStep(3);
            return;
        }

        setIsLoading(true);
        const data = await fetchCategoryQuestions({
            userId: id,
            userType: role,
            parentCategory: selectedCategory,
        });
        if (!data) {
            setIsLoading(false);
            return;
        }
        dispatch(setRfpCategoryQuestions(data.categoryQuestions));
        dispatch(setRfpCategoryAnswers({}));
        dispatch(setRfpLastFetchedCategory(selectedCategory));
        setCurrentCategoryIndex(0);
        setIsLoading(false);
        setStep(3);
    }, [id, role, selectedCategory, dispatch, categoryQuestions.length, lastFetchedCategory]);

    // ── General answers ─────────────────────────────────────────────────
    const handleGeneralAnswer = (key: string, questionText: string, value: string[]) => {
        const existing = generalAnswers[key];
        dispatch(
            setRfpGeneralAnswers({
                ...generalAnswers,
                [key]: {
                    question: questionText,
                    answer: value,
                    followUp: existing?.followUp ? { ...existing.followUp, answer: [] } : undefined,
                },
            })
        );
    };

    const handleGeneralFollowUpAnswer = (
        key: string,
        followUpQuestion: string,
        value: string[]
    ) => {
        if (!generalAnswers[key]) return;
        dispatch(
            setRfpGeneralAnswers({
                ...generalAnswers,
                [key]: {
                    ...generalAnswers[key],
                    followUp: { question: followUpQuestion, answer: value },
                },
            })
        );
    };

    // ── Category answers ────────────────────────────────────────────────
    const handleCategoryAnswer = (key: string, questionText: string, value: string[]) => {
        dispatch(
            setRfpCategoryAnswers({
                ...categoryAnswers,
                [key]: {
                    question: questionText,
                    answer: value,
                    followUp: categoryAnswers[key]?.followUp
                        ? { ...categoryAnswers[key].followUp!, answer: [] }
                        : undefined,
                },
            })
        );
    };

    const handleCategoryFollowUpAnswer = (
        key: string,
        followUpQuestion: string,
        value: string[]
    ) => {
        if (!categoryAnswers[key]) return;
        dispatch(
            setRfpCategoryAnswers({
                ...categoryAnswers,
                [key]: {
                    ...categoryAnswers[key],
                    followUp: { question: followUpQuestion, answer: value },
                },
            })
        );
    };

    // ── General navigation ──────────────────────────────────────────────

    const nextGeneralQuestion = () => {
        const currentQuestion = generalQuestions[currentGeneralIndex];
        if (!currentQuestion) return;

        const entry = generalAnswers[currentQuestion.key];

        // check main answer
        if (!entry || entry.answer.length === 0) {
            dispatch(
                showToast({
                    description: 'Please answer the question.',
                    variant: 'error',
                })
            );
            return;
        }

        // check follow-up
        const selectedOpt = currentQuestion.options.find(o => entry.answer.includes(o.value));

        if (selectedOpt?.followUp) {
            const fu = entry.followUp;
            if (!fu || fu.answer.length === 0) {
                dispatch(
                    showToast({
                        description: 'Please answer the follow up question too.',
                        variant: 'error',
                    })
                );
                return;
            }
        }

        // move to next question
        if (currentGeneralIndex < generalQuestions.length - 1) {
            setCurrentGeneralIndex(prev => prev + 1);
        } else {
            // last question - fetch category questions
            fetchCategoryQ();
        }
        scrollTotop();
    };

    const prevGeneralQuestion = () => {
        if (currentGeneralIndex > 0) setCurrentGeneralIndex(prev => prev - 1);
        else setStep(1);
        scrollTotop();
    };

    // ── Category navigation ─────────────────────────────────────────────
    const nextCategoryQuestion = () => {
        const currentQuestion = categoryQuestions[currentCategoryIndex];
        if (!currentQuestion) return;

        const entry = categoryAnswers[currentQuestion.key];

        // check main answer
        if (!entry || entry.answer.length === 0) {
            dispatch(
                showToast({
                    description: 'Please answer the question.',
                    variant: 'error',
                })
            );
            return;
        }

        // check follow-up if required
        const selectedOpt = currentQuestion.options.find(o => entry.answer.includes(o.value));

        if (selectedOpt?.followUp) {
            const fu = entry.followUp;
            if (!fu || fu.answer.length === 0) {
                dispatch(
                    showToast({
                        description: 'Please answer the follow up question too.',
                        variant: 'error',
                    })
                );
                return;
            }
        }

        // move to next question
        if (currentCategoryIndex < categoryQuestions.length - 1) {
            setCurrentCategoryIndex(prev => prev + 1);
        } else {
            // last question then go to review step
            setStep(4);
        }
        scrollTotop();
    };

    const prevCategoryQuestion = () => {
        if (currentCategoryIndex > 0) setCurrentCategoryIndex(prev => prev - 1);
        else setStep(2);
        scrollTotop();
    };

    // ── Review navigation ─────────────────────────────────────────────
    const prevQuestionFromReview = () => {
        setStep(3);
        scrollTotop();
    };

    // ── Build payload ───────────────────────────────────────────────────
    const buildPayload = (): FinalPayload => {
        const mapAnswers = (answers: AnswerMap): Record<string, FinalPayloadQuestion> =>
            Object.fromEntries(
                Object.entries(answers).map(([key, entry]) => {
                    const q: FinalPayloadQuestion = {
                        question: entry.question,
                        answer: entry.answer.length === 1 ? entry.answer[0] : entry.answer,
                    };
                    if (entry.followUp && entry.followUp.answer.length > 0) {
                        q.followUp = {
                            question: entry.followUp.question,
                            answer:
                                entry.followUp.answer.length === 1
                                    ? entry.followUp.answer[0]
                                    : entry.followUp.answer,
                        };
                    }
                    return [key, q];
                })
            );

        return {
            softwareCategory: selectedCategory,
            generalQuestions: mapAnswers(generalAnswers),
            specializedQuestions: mapAnswers(categoryAnswers),
        };
    };

    // ── Submit with polling ──────────────────────────────────────────────
    // total 7 attempts with initial call
    const retryIntervals = [2000, 3000, 4000, 10000, 10000, 15000];

    const handleSubmit = async (payload: FinalPayload) => {
        setIsSubmitting(true);
        scrollTotop();
        isCancelledRef.current = false;
        let attemptIndex = 0;

        const poll = async (toolkitId: string) => {
            if (isCancelledRef.current) return;

            const data = await getRecommandations({ userType: role, userId: id, toolkitId });
            // here we checks whether the component unmounted, if so then dont need to do anything
            if (isCancelledRef.current) return;

            if (data && data.data?.status) {
                dispatch(setRecommendedProducts(data.data.items));
                dispatch(resetRfp());
                navigate(paths.softwares.success, { state: { products: data.data.items } });
                setIsSubmitting(false);
                return;
            }

            if (attemptIndex < retryIntervals.length) {
                pollingTimeoutRef.current = setTimeout(
                    () => poll(toolkitId),
                    retryIntervals[attemptIndex]
                );
                attemptIndex += 1;
            } else {
                // all retries done with no result
                setIsSubmitting(false);
            }
        };

        const data = await submitAnswers({ userType: role, userId: id, body: payload });
        if (data && data.data?.toolkitId) {
            poll(data.data?.toolkitId);
        } else {
            setIsSubmitting(false);
        }
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        if (category !== selectedCategory) {
            dispatch(resetRfp());
        }
    };
    return {
        step,
        setStep,
        selectedCategory,
        setSelectedCategory,
        categoryList: rfpCategories,
        navigate,
        isLoading,
        generalQuestions,
        currentGeneralIndex,
        generalAnswers,
        handleGeneralAnswer,
        handleGeneralFollowUpAnswer,
        nextGeneralQuestion,
        prevGeneralQuestion,
        fetchGeneralQ,
        categoryQuestions,
        currentCategoryIndex,
        categoryAnswers,
        handleCategoryAnswer,
        handleCategoryFollowUpAnswer,
        nextCategoryQuestion,
        prevCategoryQuestion,
        fetchCategoryQ,
        buildPayload,
        isSubmitting,
        handleSubmit,
        handleCategoryChange,
        prevQuestionFromReview,
    };
};

export default useFindProduct;
