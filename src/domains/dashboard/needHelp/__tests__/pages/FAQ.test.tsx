import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FAQ from '../../pages/FAQ';

type FaqItem = { question: string; answer: string };

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    getAllFaqs: vi.fn(),
    faqState: { data: undefined as FaqItem[] | undefined, isLoading: false },
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('../../hooks/useGetFaq', () => ({
    default: () => ({ ...mocks.faqState, getAllFaqs: mocks.getAllFaqs }),
}));

const renderAt = (url: string) =>
    render(
        <MemoryRouter initialEntries={[url]}>
            <FAQ />
        </MemoryRouter>
    );

const mobileRechargeUrl = '/need-help/frequently-asked-questions?faqCategory=Mobile%20Recharge';

describe('FAQ page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.faqState = {
            data: [
                {
                    question: 'My recharge has failed. What should I do?',
                    answer: 'Please retry after a few minutes.\n\n- Mobile number\n- Network provider',
                },
            ],
            isLoading: false,
        };
    });

    it('loads and titles the questions for the requested category', () => {
        renderAt(mobileRechargeUrl);

        expect(mocks.getAllFaqs).toHaveBeenCalledWith('Mobile Recharge');
        expect(
            screen.getByText('Frequently Asked Questions for Mobile Recharge')
        ).toBeInTheDocument();
        expect(screen.getByText('My recharge has failed. What should I do?')).toBeInTheDocument();
    });

    it('opens a question to show its answer with the bullet points', () => {
        renderAt(mobileRechargeUrl);

        fireEvent.click(screen.getByText('My recharge has failed. What should I do?'));

        expect(screen.getByText('Please retry after a few minutes.')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
            'Mobile number',
            'Network provider',
        ]);
    });

    it('sends the user back to Need Help when no category is given', () => {
        renderAt('/need-help/frequently-asked-questions');

        expect(mocks.navigate).toHaveBeenCalledWith('/need-help');
        expect(mocks.getAllFaqs).not.toHaveBeenCalled();
    });
});
