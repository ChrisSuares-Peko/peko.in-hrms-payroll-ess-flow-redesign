import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import WorkspaceForm from '../../components/WorkspaceForm';

const mockNavigate = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

describe('WorkspaceForm Component', () => {
    const setFormDataMock = vi.fn();
    const setIsFormSubmittedMock = vi.fn();
    const mockDispatch = vi.fn();
    beforeEach(() => {
        setFormDataMock.mockClear();
        setIsFormSubmittedMock.mockClear();
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

    it('renders the form with required fields', () => {
        render(
            <WorkspaceForm
                setFormData={setFormDataMock}
                formData={{}}
                setIsFormSubmitted={setIsFormSubmittedMock}
            />
        );
        screen.debug();
        expect(screen.getByText(/Company Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Email ID/i)).toBeInTheDocument();
        expect(screen.getByText(/Mobile Number/i)).toBeInTheDocument();
    });

    it('shows validation error when required fields are empty', async () => {
        render(
            <WorkspaceForm
                setFormData={setFormDataMock}
                formData={{}}
                setIsFormSubmitted={setIsFormSubmittedMock}
            />
        );

        fireEvent.click(screen.getByText(/Next/i)); // Trigger form submission

        expect(await screen.findAllByText(/Required/i)).toHaveLength(1); // Adjust this according to number of required fields
    });
});
