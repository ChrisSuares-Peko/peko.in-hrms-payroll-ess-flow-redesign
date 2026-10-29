import React from 'react';

import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { describe, vi, it, expect, beforeEach } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import Default from '../../components/productDetails/Default';
import { EmailDomain } from '../../types/types';

const mockNavigate = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));
describe('Default Component', () => {
    const setFormDataMock = vi.fn();
    const setIsFormSubmittedMock = vi.fn();
    const formData = {}; // You can customize this as needed
    beforeEach(() => {
        setFormDataMock.mockClear();
        setIsFormSubmittedMock.mockClear();
        vi.clearAllMocks();
        cleanup();
        const mockDispatch = vi.fn();

        (useAppDispatch as any).mockReturnValue(mockDispatch);
        (useAppSelector as any).mockImplementation((selector: any) =>
            selector({
                reducer: {
                    businessEmail: {
                        companyName: 'Test Company',
                        domainName: 'testcompany.com',
                        emailId: 'test@company.com',
                        mobileNumber: '+971123456789',
                        name: 'John Doe',
                        numberOfUsers: 100,
                        alternativeEmailId: 'alt@company.com',
                        city: 'Dubai',
                        companyAddress: '123 Test Street',
                        currentEmailProvider: 'Gmail',
                        emirates: 'Dubai',
                        zipcode: '12345',
                    },
                    auth: {
                        role: 'user',
                        id: 12,
                    },
                    basicInfo: {},
                    user: {},
                },
            })
        );
    });
    it('renders without crashing', () => {
        const { getByText } = render(
            <Default
                setFormData={setFormDataMock}
                formData={formData}
                setIsFormSubmitted={setIsFormSubmittedMock}
            />
        );
        expect(
            getByText(/Discover endless possibilities to drive business growth with Microsoft 365/i)
        ).toBeInTheDocument();
        expect(
            getByText(
                /Boost efficiency, save time, and maximize your productivity with the powerful Microsoft products./i
            )
        ).toBeInTheDocument();
    });

    it('clicking "Get Microsoft 365" scrolls to the form', () => {
        render(
            <Default
                setFormData={setFormDataMock}
                formData={{}}
                setIsFormSubmitted={setIsFormSubmittedMock}
                productData={null}
            />
        );

        const button = screen.getByTestId('get-started-now');
        const formSection = screen.getByTestId('form-section'); // Target by data-testid

        // Mock scrollIntoView
        const scrollIntoViewMock = vi.fn();
        formSection.scrollIntoView = scrollIntoViewMock;

        // Simulate clicking the button
        fireEvent.click(button);

        // Check if scrollIntoView was called
        expect(scrollIntoViewMock).toHaveBeenCalled();
    });
    it('clicking "Order History" button navigates to the correct page', () => {
        render(
            <Default
                setFormData={setFormDataMock}
                formData={{}}
                setIsFormSubmitted={setIsFormSubmittedMock}
                productData={{ name: 'Test Product', id: 123 } as EmailDomain}
            />
        );

        const orderHistoryButton = screen.getByText(/Order History/i);
        orderHistoryButton.click();

        expect(mockNavigate).toHaveBeenCalledWith(
            '/more-services/business-emails/Test Product/order-history?id=123'
        );
    });
});
