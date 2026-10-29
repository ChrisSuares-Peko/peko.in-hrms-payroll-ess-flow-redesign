/**
 * @file useFindProduct.test.tsx
 * @description Unit tests for useFindProduct hook.
 *
 * Test coverage:
 *  - Initial state: selectedCategory from lastFetchedCategory / first rfpCategory / empty
 *  - getParentCategories called on mount when rfpCategories empty; skipped when populated
 *  - fetchGeneralQ: uses cache when questions exist; fetches and sets step=2; no-op on falsy
 *  - fetchCategoryQ: uses cache when category matches; fetches and sets step=3; no-op on falsy
 *  - nextGeneralQuestion: toast on missing answer; toast on missing followUp; increments index; calls fetchCategoryQ on last
 *  - prevGeneralQuestion: decrements index; goes to step 1 at index 0
 *  - nextCategoryQuestion: toast on missing answer; increments index; sets step=4 on last
 *  - prevCategoryQuestion: decrements index; goes to step 2 at index 0
 *  - prevQuestionFromReview: sets step=3
 *  - handleGeneralAnswer: dispatches with correct payload; resets followUp.answer when existed
 *  - handleGeneralFollowUpAnswer: no-op when key absent; dispatches when key present
 *  - handleCategoryAnswer: dispatches correctly
 *  - handleCategoryFollowUpAnswer: no-op when key absent
 *  - handleCategoryChange: sets category; dispatches resetRfp when category differs
 *  - handleSubmit: calls submitAnswers; polls on toolkitId; sets isSubmitting=false on falsy response
 *  - buildPayload: maps single/multi answers; includes followUp when present
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useFindProduct from '../../../hooks/rfp/useFindProduct';
import { AnswerMap, IQuestion, IRfpCategory } from '../../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockDispatch = vi.fn((action: unknown) => action);
vi.mock('react-redux', async () => {
    const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
    return { ...actual, useDispatch: () => mockDispatch };
});

const mockFetchRfpCategories = vi.fn();
const mockFetchGeneralQuestions = vi.fn();
const mockFetchCategoryQuestions = vi.fn();
const mockSubmitAnswers = vi.fn();
const mockGetRecommandations = vi.fn();
vi.mock('../../../api', () => ({
    fetchRfpCategories: (...a: unknown[]) => mockFetchRfpCategories(...a),
    fetchGeneralQuestions: (...a: unknown[]) => mockFetchGeneralQuestions(...a),
    fetchCategoryQuestions: (...a: unknown[]) => mockFetchCategoryQuestions(...a),
    submitAnswers: (...a: unknown[]) => mockSubmitAnswers(...a),
    getRecommandations: (...a: unknown[]) => mockGetRecommandations(...a),
}));

vi.mock('../../../utils/scrollTotop', () => ({ default: vi.fn() }));

const mockShowToast = vi.fn((p: unknown) => ({ type: 'api/showToast', payload: p }));
vi.mock('@src/slices/apiSlice', () => ({ showToast: (p: unknown) => mockShowToast(p) }));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCategories: IRfpCategory[] = [
    { name: 'CRM', weburl: 'crm' },
    { name: 'HR', weburl: 'hr' },
];

const mockQuestion = (key = 'q1', withFollowUp = false): IQuestion => ({
    key,
    question: `Question ${key}`,
    type: 'blockRadioCard',
    options: [
        {
            label: 'Yes',
            value: 'yes',
            ...(withFollowUp
                ? {
                      followUp: {
                          key: `${key}_fu`,
                          label: 'Follow-up',
                          type: 'blockRadioCard',
                          options: [{ label: 'A', value: 'a' }],
                      },
                  }
                : {}),
        },
        { label: 'No', value: 'no' },
    ],
});

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

type RfpState = {
    generalQuestions?: IQuestion[];
    categoryQuestions?: IQuestion[];
    generalAnswers?: AnswerMap;
    categoryAnswers?: AnswerMap;
    lastFetchedCategory?: string;
};

const buildStore = (rfpCategories: IRfpCategory[] = [], rfp: RfpState = {}) =>
    configureStore({
        reducer: {
            reducer: () => ({
                auth: { id: 42, role: 'buyer' },
                software: {
                    rfpCategories,
                    rfp: {
                        generalQuestions: rfp.generalQuestions ?? [],
                        categoryQuestions: rfp.categoryQuestions ?? [],
                        generalAnswers: rfp.generalAnswers ?? {},
                        categoryAnswers: rfp.categoryAnswers ?? {},
                        lastFetchedCategory: rfp.lastFetchedCategory ?? '',
                    },
                },
            }),
        },
    });

const makeWrapper = (rfpCategories: IRfpCategory[] = [], rfp: RfpState = {}) => {
    const store = buildStore(rfpCategories, rfp);
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store } as any, children);
    return Wrapper;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFindProduct', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -------------------------------------------------------------------------
    // Initial state
    // -------------------------------------------------------------------------

    it('selectedCategory defaults to lastFetchedCategory when present', () => {
        mockFetchRfpCategories.mockResolvedValue(null);
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { lastFetchedCategory: 'hr' }),
        });
        expect(result.current.selectedCategory).toBe('hr');
    });

    it('selectedCategory defaults to first rfpCategory weburl when no lastFetchedCategory', () => {
        mockFetchRfpCategories.mockResolvedValue(null);
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { lastFetchedCategory: '' }),
        });
        expect(result.current.selectedCategory).toBe('crm');
    });

    it('selectedCategory defaults to empty string when no categories and no lastFetchedCategory', () => {
        mockFetchRfpCategories.mockResolvedValue(null);
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper([], { lastFetchedCategory: '' }),
        });
        expect(result.current.selectedCategory).toBe('');
    });

    // -------------------------------------------------------------------------
    // getParentCategories on mount
    // -------------------------------------------------------------------------

    it('calls fetchRfpCategories on mount when rfpCategories is empty', async () => {
        mockFetchRfpCategories.mockResolvedValue({
            categories: mockCategories,
        });

        renderHook(() => useFindProduct(), { wrapper: makeWrapper([]) });

        await waitFor(() =>
            expect(mockFetchRfpCategories).toHaveBeenCalledWith({ userId: 42, userType: 'buyer' })
        );
    });

    it('dispatches setRfpCategories and setRfpLastFetchedCategory on successful category fetch', async () => {
        mockFetchRfpCategories.mockResolvedValue({ categories: mockCategories });

        renderHook(() => useFindProduct(), { wrapper: makeWrapper([]) });

        await waitFor(() => expect(mockFetchRfpCategories).toHaveBeenCalled());
        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: mockCategories })
            )
        );
    });

    it('does not call fetchRfpCategories when rfpCategories is already populated', async () => {
        renderHook(() => useFindProduct(), { wrapper: makeWrapper(mockCategories) });

        await waitFor(() => expect(mockFetchRfpCategories).not.toHaveBeenCalled());
    });

    // -------------------------------------------------------------------------
    // fetchGeneralQ
    // -------------------------------------------------------------------------

    it('fetchGeneralQ skips API and sets step=2 when generalQuestions already exist', async () => {
        const questions = [mockQuestion('q1')];
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { generalQuestions: questions }),
        });

        await act(async () => {
            await result.current.fetchGeneralQ();
        });

        expect(mockFetchGeneralQuestions).not.toHaveBeenCalled();
        expect(result.current.step).toBe(2);
    });

    it('fetchGeneralQ calls API and sets step=2 when generalQuestions is empty', async () => {
        const questions = [mockQuestion('q1')];
        mockFetchGeneralQuestions.mockResolvedValue({ generalQuestions: questions });

        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { generalQuestions: [] }),
        });

        await act(async () => {
            await result.current.fetchGeneralQ();
        });

        expect(mockFetchGeneralQuestions).toHaveBeenCalledWith({ userId: 42, userType: 'buyer' });
        expect(result.current.step).toBe(2);
    });

    it('fetchGeneralQ does not set step=2 when API returns falsy', async () => {
        mockFetchGeneralQuestions.mockResolvedValue(null);

        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { generalQuestions: [] }),
        });

        await act(async () => {
            await result.current.fetchGeneralQ();
        });

        expect(result.current.step).toBe(1);
    });

    // -------------------------------------------------------------------------
    // fetchCategoryQ
    // -------------------------------------------------------------------------

    it('fetchCategoryQ skips API and sets step=3 when categoryQuestions exist for same category', async () => {
        const questions = [mockQuestion('cq1')];
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                categoryQuestions: questions,
                lastFetchedCategory: 'crm',
            }),
        });

        await act(async () => {
            await result.current.fetchCategoryQ();
        });

        expect(mockFetchCategoryQuestions).not.toHaveBeenCalled();
        expect(result.current.step).toBe(3);
    });

    it('fetchCategoryQ calls API and sets step=3 when cache is empty', async () => {
        const questions = [mockQuestion('cq1')];
        mockFetchCategoryQuestions.mockResolvedValue({ categoryQuestions: questions });

        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { categoryQuestions: [] }),
        });

        await act(async () => {
            await result.current.fetchCategoryQ();
        });

        expect(mockFetchCategoryQuestions).toHaveBeenCalledWith({
            userId: 42,
            userType: 'buyer',
            parentCategory: 'crm',
        });
        expect(result.current.step).toBe(3);
    });

    it('fetchCategoryQ does not set step=3 when API returns falsy', async () => {
        mockFetchCategoryQuestions.mockResolvedValue(null);

        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { categoryQuestions: [] }),
        });

        await act(async () => {
            await result.current.fetchCategoryQ();
        });

        expect(result.current.step).toBe(1);
    });

    // -------------------------------------------------------------------------
    // nextGeneralQuestion — validation
    // -------------------------------------------------------------------------

    it('nextGeneralQuestion dispatches error toast when question has no answer', () => {
        const questions = [mockQuestion('q1')];
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalQuestions: questions,
                generalAnswers: {},
            }),
        });

        act(() => {
            result.current.nextGeneralQuestion();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ variant: 'error' }),
            })
        );
    });

    it('nextGeneralQuestion dispatches follow-up error when followUp required but missing', () => {
        const questions = [mockQuestion('q1', true)];
        const answers: AnswerMap = {
            q1: { question: 'Question q1', answer: ['yes'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalQuestions: questions,
                generalAnswers: answers,
            }),
        });

        act(() => {
            result.current.nextGeneralQuestion();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    description: 'Please answer the follow up question too.',
                }),
            })
        );
    });

    it('nextGeneralQuestion increments currentGeneralIndex when answer is valid', () => {
        const questions = [mockQuestion('q1'), mockQuestion('q2')];
        const answers: AnswerMap = {
            q1: { question: 'Question q1', answer: ['no'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalQuestions: questions,
                generalAnswers: answers,
            }),
        });

        act(() => {
            result.current.nextGeneralQuestion();
        });

        expect(result.current.currentGeneralIndex).toBe(1);
    });

    // -------------------------------------------------------------------------
    // prevGeneralQuestion
    // -------------------------------------------------------------------------

    it('prevGeneralQuestion decrements currentGeneralIndex when index > 0', async () => {
        const questions = [mockQuestion('q1'), mockQuestion('q2')];
        const answers: AnswerMap = {
            q1: { question: 'Question q1', answer: ['no'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalQuestions: questions,
                generalAnswers: answers,
            }),
        });

        act(() => {
            result.current.nextGeneralQuestion();
        });
        expect(result.current.currentGeneralIndex).toBe(1);

        act(() => {
            result.current.prevGeneralQuestion();
        });
        expect(result.current.currentGeneralIndex).toBe(0);
    });

    it('prevGeneralQuestion sets step=1 when index is already 0', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        act(() => {
            result.current.prevGeneralQuestion();
        });

        expect(result.current.step).toBe(1);
    });

    // -------------------------------------------------------------------------
    // nextCategoryQuestion
    // -------------------------------------------------------------------------

    it('nextCategoryQuestion dispatches error toast when question has no answer', () => {
        const questions = [mockQuestion('cq1')];
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                categoryQuestions: questions,
                categoryAnswers: {},
            }),
        });

        act(() => {
            result.current.nextCategoryQuestion();
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ variant: 'error' }),
            })
        );
    });

    it('nextCategoryQuestion increments currentCategoryIndex when answer is valid', () => {
        const questions = [mockQuestion('cq1'), mockQuestion('cq2')];
        const answers: AnswerMap = {
            cq1: { question: 'Question cq1', answer: ['no'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                categoryQuestions: questions,
                categoryAnswers: answers,
            }),
        });

        act(() => {
            result.current.nextCategoryQuestion();
        });

        expect(result.current.currentCategoryIndex).toBe(1);
    });

    it('nextCategoryQuestion sets step=4 when on the last question', () => {
        const questions = [mockQuestion('cq1')];
        const answers: AnswerMap = {
            cq1: { question: 'Question cq1', answer: ['no'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                categoryQuestions: questions,
                categoryAnswers: answers,
            }),
        });

        act(() => {
            result.current.nextCategoryQuestion();
        });

        expect(result.current.step).toBe(4);
    });

    // -------------------------------------------------------------------------
    // prevCategoryQuestion
    // -------------------------------------------------------------------------

    it('prevCategoryQuestion sets step=2 when index is already 0', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        act(() => {
            result.current.prevCategoryQuestion();
        });

        expect(result.current.step).toBe(2);
    });

    // -------------------------------------------------------------------------
    // prevQuestionFromReview
    // -------------------------------------------------------------------------

    it('prevQuestionFromReview sets step to 3', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        act(() => {
            result.current.prevQuestionFromReview();
        });

        expect(result.current.step).toBe(3);
    });

    // -------------------------------------------------------------------------
    // handleGeneralAnswer
    // -------------------------------------------------------------------------

    it('handleGeneralAnswer dispatches setRfpGeneralAnswers with correct entry', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { generalAnswers: {} }),
        });

        act(() => {
            result.current.handleGeneralAnswer('q1', 'What is your budget?', ['10k']);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    q1: { question: 'What is your budget?', answer: ['10k'], followUp: undefined },
                }),
            })
        );
    });

    it('handleGeneralAnswer resets followUp.answer when followUp previously existed', () => {
        const existingAnswers: AnswerMap = {
            q1: {
                question: 'Q',
                answer: ['yes'],
                followUp: { question: 'Follow up?', answer: ['old answer'] },
            },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { generalAnswers: existingAnswers }),
        });

        act(() => {
            result.current.handleGeneralAnswer('q1', 'Q', ['no']);
        });

        const dispatched = mockDispatch.mock.calls.find(
            ([action]: any) => (action as any)?.payload?.q1?.followUp !== undefined
        ) as any;
        expect(dispatched?.[0].payload.q1.followUp.answer).toEqual([]);
    });

    // -------------------------------------------------------------------------
    // handleGeneralFollowUpAnswer
    // -------------------------------------------------------------------------

    it('handleGeneralFollowUpAnswer is a no-op when the key is not in generalAnswers', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { generalAnswers: {} }),
        });

        act(() => {
            result.current.handleGeneralFollowUpAnswer('missing', 'Follow up?', ['yes']);
        });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('handleGeneralFollowUpAnswer dispatches updated followUp when key exists', () => {
        const existingAnswers: AnswerMap = {
            q1: { question: 'Q', answer: ['yes'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { generalAnswers: existingAnswers }),
        });

        act(() => {
            result.current.handleGeneralFollowUpAnswer('q1', 'Follow up?', ['always']);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    q1: expect.objectContaining({
                        followUp: { question: 'Follow up?', answer: ['always'] },
                    }),
                }),
            })
        );
    });

    // -------------------------------------------------------------------------
    // handleCategoryAnswer
    // -------------------------------------------------------------------------

    it('handleCategoryAnswer dispatches setRfpCategoryAnswers with correct entry', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { categoryAnswers: {} }),
        });

        act(() => {
            result.current.handleCategoryAnswer('cq1', 'Team size?', ['50-100']);
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    cq1: { question: 'Team size?', answer: ['50-100'], followUp: undefined },
                }),
            })
        );
    });

    // -------------------------------------------------------------------------
    // handleCategoryFollowUpAnswer
    // -------------------------------------------------------------------------

    it('handleCategoryFollowUpAnswer is a no-op when key is absent in categoryAnswers', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, { categoryAnswers: {} }),
        });

        act(() => {
            result.current.handleCategoryFollowUpAnswer('missing', 'Follow up?', ['val']);
        });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // handleCategoryChange
    // -------------------------------------------------------------------------

    it('handleCategoryChange updates selectedCategory', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        act(() => {
            result.current.handleCategoryChange('hr');
        });

        expect(result.current.selectedCategory).toBe('hr');
    });

    it('handleCategoryChange dispatches resetRfp when category changes', () => {
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        act(() => {
            result.current.handleCategoryChange('hr');
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({ type: expect.stringContaining('resetRfp') })
        );
    });

    // -------------------------------------------------------------------------
    // handleSubmit
    // -------------------------------------------------------------------------

    it('handleSubmit calls submitAnswers with correct userId and userType', async () => {
        mockSubmitAnswers.mockResolvedValue(null);

        const payload = {
            softwareCategory: 'crm',
            generalQuestions: {},
            specializedQuestions: {},
        };

        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        await act(async () => {
            await result.current.handleSubmit(payload);
        });

        expect(mockSubmitAnswers).toHaveBeenCalledWith({
            userId: 42,
            userType: 'buyer',
            body: payload,
        });
    });

    it('handleSubmit sets isSubmitting=false when submitAnswers returns falsy', async () => {
        mockSubmitAnswers.mockResolvedValue(null);

        const payload = { softwareCategory: 'crm', generalQuestions: {}, specializedQuestions: {} };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        await act(async () => {
            await result.current.handleSubmit(payload);
        });

        expect(result.current.isSubmitting).toBe(false);
    });

    it('handleSubmit starts polling with toolkitId returned from submitAnswers', async () => {
        mockSubmitAnswers.mockResolvedValue({ data: { toolkitId: 'tk-123' } });
        mockGetRecommandations.mockResolvedValue({ data: { status: true, items: [] } });

        const payload = { softwareCategory: 'crm', generalQuestions: {}, specializedQuestions: {} };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories),
        });

        await act(async () => {
            await result.current.handleSubmit(payload);
        });

        await waitFor(() =>
            expect(mockGetRecommandations).toHaveBeenCalledWith({
                userId: 42,
                userType: 'buyer',
                toolkitId: 'tk-123',
            })
        );
    });

    // -------------------------------------------------------------------------
    // buildPayload
    // -------------------------------------------------------------------------

    it('buildPayload maps single-value answer as a string', () => {
        const answers: AnswerMap = {
            q1: { question: 'Q1?', answer: ['yes'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalAnswers: answers,
                categoryAnswers: {},
                lastFetchedCategory: 'crm',
            }),
        });

        const payload = result.current.buildPayload();

        expect(payload.generalQuestions.q1.answer).toBe('yes');
    });

    it('buildPayload maps multi-value answer as an array', () => {
        const answers: AnswerMap = {
            q1: { question: 'Q1?', answer: ['a', 'b'] },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalAnswers: answers,
                categoryAnswers: {},
            }),
        });

        const payload = result.current.buildPayload();

        expect(payload.generalQuestions.q1.answer).toEqual(['a', 'b']);
    });

    it('buildPayload includes followUp when it has answers', () => {
        const answers: AnswerMap = {
            q1: {
                question: 'Q1?',
                answer: ['yes'],
                followUp: { question: 'Follow up?', answer: ['detail'] },
            },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalAnswers: answers,
                categoryAnswers: {},
            }),
        });

        const payload = result.current.buildPayload();

        expect(payload.generalQuestions.q1.followUp).toEqual({
            question: 'Follow up?',
            answer: 'detail',
        });
    });

    it('buildPayload omits followUp when followUp.answer is empty', () => {
        const answers: AnswerMap = {
            q1: {
                question: 'Q1?',
                answer: ['yes'],
                followUp: { question: 'Follow up?', answer: [] },
            },
        };
        const { result } = renderHook(() => useFindProduct(), {
            wrapper: makeWrapper(mockCategories, {
                generalAnswers: answers,
                categoryAnswers: {},
            }),
        });

        const payload = result.current.buildPayload();

        expect(payload.generalQuestions.q1.followUp).toBeUndefined();
    });
});
