/**
 * @file softwareSlice.test.ts
 * @description Unit tests for softwareSlice reducers
 * Verifies:
 *  - Each reducer correctly updates its slice of state
 *  - Reset reducers restore initial values
 *  - resetSoftwareStateKeepSearch preserves search and parentCategorySlug
 */

import { describe, it, expect } from 'vitest';

import reducer, {
    setCategoryList,
    setRfpCategories,
    setQueryParams,
    setRecommendedProducts,
    setPopularProducts,
    resetSoftwareQueryParams,
    resetSoftwareRecommendedProducts,
    setLastViewedWeburl,
    setRfpGeneralQuestions,
    setRfpCategoryQuestions,
    setRfpGeneralAnswers,
    setRfpCategoryAnswers,
    setRfpLastFetchedCategory,
    resetRfp,
    resetSoftwareState,
    resetSoftwareStateKeepSearch,
    SoftwareCategoryState,
} from '../../slice/softwareSlice';

const initialState: SoftwareCategoryState = {
    categoryList: [],
    rfpCategories: [],
    queryParams: {
        category: '',
        product: '',
        search: '',
        parentCategorySlug: '',
    },
    recommendedProducts: [],
    popularProducts: [],
    lastViewedWeburl: '',
    rfp: {
        generalQuestions: [],
        categoryQuestions: [],
        generalAnswers: {},
        categoryAnswers: {},
        lastFetchedCategory: '',
    },
};

describe('softwareSlice', () => {
    it('should return the initial state when called with undefined', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
    });

    describe('setCategoryList', () => {
        it('should set the category list', () => {
            const categories = [
                { weburl: 'cat1', name: 'Cat 1', title: 'Category 1', icon: 'icon.png' },
            ];
            const state = reducer(undefined, setCategoryList(categories));

            expect(state.categoryList).toEqual(categories);
        });
    });

    describe('setRfpCategories', () => {
        it('should set the RFP categories', () => {
            const rfpCategories = [{ name: 'RFP Cat', weburl: 'rfp-cat' }];
            const state = reducer(undefined, setRfpCategories(rfpCategories));

            expect(state.rfpCategories).toEqual(rfpCategories);
        });
    });

    describe('setQueryParams', () => {
        it('should merge new params into existing queryParams', () => {
            const state = reducer(
                undefined,
                setQueryParams({ category: 'crm', product: 'salesforce' })
            );

            expect(state.queryParams).toEqual({
                category: 'crm',
                product: 'salesforce',
                search: '',
                parentCategorySlug: '',
            });
        });

        it('should not overwrite unrelated queryParam fields', () => {
            const withSearch = reducer(undefined, setQueryParams({ search: 'existing' }));
            const state = reducer(withSearch, setQueryParams({ category: 'erp' }));

            expect(state.queryParams.search).toBe('existing');
            expect(state.queryParams.category).toBe('erp');
        });
    });

    describe('setRecommendedProducts', () => {
        it('should set the recommended products', () => {
            const products = [{ name: 'Product A', weburl: 'product-a' }] as any;
            const state = reducer(undefined, setRecommendedProducts(products));

            expect(state.recommendedProducts).toEqual(products);
        });
    });

    describe('setPopularProducts', () => {
        it('should set the popular products', () => {
            const products = [{ name: 'Popular A', weburl: 'popular-a' }] as any;
            const state = reducer(undefined, setPopularProducts(products));

            expect(state.popularProducts).toEqual(products);
        });
    });

    describe('resetSoftwareQueryParams', () => {
        it('should reset queryParams to initial values', () => {
            const withParams = reducer(
                undefined,
                setQueryParams({ category: 'crm', search: 'hello' })
            );
            const state = reducer(withParams, resetSoftwareQueryParams());

            expect(state.queryParams).toEqual(initialState.queryParams);
        });
    });

    describe('resetSoftwareRecommendedProducts', () => {
        it('should reset recommendedProducts to empty array', () => {
            const withProducts = reducer(undefined, setRecommendedProducts([{ name: 'P' }] as any));
            const state = reducer(withProducts, resetSoftwareRecommendedProducts());

            expect(state.recommendedProducts).toEqual([]);
        });
    });

    describe('setLastViewedWeburl', () => {
        it('should set the last viewed web URL', () => {
            const state = reducer(undefined, setLastViewedWeburl('https://example.com'));

            expect(state.lastViewedWeburl).toBe('https://example.com');
        });
    });

    describe('setRfpGeneralQuestions', () => {
        it('should set rfp general questions', () => {
            const questions = [
                { question: 'Q1', key: 'q1', type: 'singleChoice' as const, options: [] },
            ];
            const state = reducer(undefined, setRfpGeneralQuestions(questions));

            expect(state.rfp.generalQuestions).toEqual(questions);
        });
    });

    describe('setRfpCategoryQuestions', () => {
        it('should set rfp category questions', () => {
            const questions = [
                { question: 'Q2', key: 'q2', type: 'multipleChoices' as const, options: [] },
            ];
            const state = reducer(undefined, setRfpCategoryQuestions(questions));

            expect(state.rfp.categoryQuestions).toEqual(questions);
        });
    });

    describe('setRfpGeneralAnswers', () => {
        it('should set rfp general answers', () => {
            const answers = { q1: { question: 'Q1', answer: ['yes'] } };
            const state = reducer(undefined, setRfpGeneralAnswers(answers));

            expect(state.rfp.generalAnswers).toEqual(answers);
        });
    });

    describe('setRfpCategoryAnswers', () => {
        it('should set rfp category answers', () => {
            const answers = { q2: { question: 'Q2', answer: ['no'] } };
            const state = reducer(undefined, setRfpCategoryAnswers(answers));

            expect(state.rfp.categoryAnswers).toEqual(answers);
        });
    });

    describe('setRfpLastFetchedCategory', () => {
        it('should set rfp last fetched category', () => {
            const state = reducer(undefined, setRfpLastFetchedCategory('crm'));

            expect(state.rfp.lastFetchedCategory).toBe('crm');
        });
    });

    describe('resetRfp', () => {
        it('should reset the rfp sub-state to initial values', () => {
            const withRfpData = reducer(
                undefined,
                setRfpGeneralQuestions([
                    { question: 'Q1', key: 'q1', type: 'singleChoice', options: [] },
                ])
            );
            const state = reducer(withRfpData, resetRfp());

            expect(state.rfp).toEqual(initialState.rfp);
        });
    });

    describe('resetSoftwareState', () => {
        it('should reset the entire state to initial values', () => {
            let state = reducer(
                undefined,
                setCategoryList([{ weburl: 'c', name: 'C', title: 'C', icon: 'i' }])
            );
            state = reducer(state, setQueryParams({ search: 'term', category: 'crm' }));
            state = reducer(state, setLastViewedWeburl('https://example.com'));

            const resetState = reducer(state, resetSoftwareState());

            expect(resetState).toEqual(initialState);
        });
    });

    describe('resetSoftwareStateKeepSearch', () => {
        it('should reset state but preserve search and parentCategorySlug', () => {
            let state = reducer(
                undefined,
                setQueryParams({ search: 'my search', parentCategorySlug: 'tech', category: 'crm' })
            );
            state = reducer(
                state,
                setCategoryList([{ weburl: 'c', name: 'C', title: 'C', icon: 'i' }])
            );
            state = reducer(state, setLastViewedWeburl('https://example.com'));

            const resetState = reducer(state, resetSoftwareStateKeepSearch());

            expect(resetState.queryParams.search).toBe('my search');
            expect(resetState.queryParams.parentCategorySlug).toBe('tech');
            expect(resetState.queryParams.category).toBe('');
            expect(resetState.queryParams.product).toBe('');
            expect(resetState.categoryList).toEqual([]);
            expect(resetState.lastViewedWeburl).toBe('');
            expect(resetState.rfp).toEqual(initialState.rfp);
        });

        it('should reset to initial state when search and parentCategorySlug are empty', () => {
            const state = reducer(undefined, setQueryParams({ category: 'crm' }));
            const resetState = reducer(state, resetSoftwareStateKeepSearch());

            expect(resetState).toEqual(initialState);
        });
    });
});
