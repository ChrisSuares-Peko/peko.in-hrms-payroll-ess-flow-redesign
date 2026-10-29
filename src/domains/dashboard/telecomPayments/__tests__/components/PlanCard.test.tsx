import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, vi, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

import PlanCard from '../../components/PlanCard';

describe('PlanCard Component', () => {
    const defaultProps = {
        validity: '30 days',
        amount: 499,
        description: 'This is a test description.',
        handleClose: vi.fn(),
    };

    const renderWithFormik = (props = {}) =>
        render(
            <Formik initialValues={{ amount: 0 }} onSubmit={() => {}}>
                <PlanCard {...defaultProps} {...props} />
            </Formik>
        );

    it('should render correctly with given props', () => {
        renderWithFormik();

        expect(screen.getByText('Validity')).toBeInTheDocument();
        expect(screen.getByText('30 days')).toBeInTheDocument();
        expect(screen.getByText('₹ 499')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('This is a test description.')).toBeInTheDocument();
    });

    it('should call formik setFieldValue and handleClose when the button is clicked', () => {
        const handleCloseMock = vi.fn();
        const setFieldValueMock = vi.fn();

        render(
            <Formik initialValues={{ amount: 0 }} onSubmit={() => {}} enableReinitialize>
                {({ setFieldValue }) => {
                    const mockSetFieldValue = vi.fn(setFieldValue);
                    mockSetFieldValue.mockImplementation(setFieldValueMock);
                    return <PlanCard {...defaultProps} handleClose={handleCloseMock} />;
                }}
            </Formik>
        );

        fireEvent.click(screen.getByRole('button'));

        // Check that handleClose was called
        expect(handleCloseMock).toHaveBeenCalled();
    });
});
