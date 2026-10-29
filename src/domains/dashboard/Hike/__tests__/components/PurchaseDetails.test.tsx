import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import PurchaseDetails from '../../components/purchase/PurchaseDetails';

// Mock the required modules and hooks
vi.mock('@components/atomic/inputs/SelectInputWithSearch', () => ({
    __esModule: true,
    default: vi.fn(() => <div>Mocked SelectInputWithSearch</div>),
}));

vi.mock('@src/hooks/useSubscriptionCheck', () => ({
    __esModule: true,
    default: vi.fn(() => true),
}));
// Simulate `isPurchased` being true
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(num => num.toString()),
}));

const mockStore = configureStore([]);

describe('PurchaseDetails Component', () => {
    let store: any;

    const mockData = [
        { id: 1, value: '1', fullName: 'Employee 1', netSalary: 3000 },
        { id: 2, value: '2', fullName: 'Employee 2', netSalary: 1500 },
    ];

    const defaultProps = {
        logo: 'logo.png',
        onUpdateItem: vi.fn(),
        id: '1',
        data: mockData,
        price: 100,
        hikeName: 'Hike Plan',
        salaryValidation: 'GREATER_THAN',
        salaryAmt: 2000,
    };

    beforeEach(() => {
        store = mockStore({});
    });

    it('should render the component and display default UI elements', () => {
        render(
            <Provider store={store}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <PurchaseDetails {...defaultProps} />
                </Formik>
            </Provider>
        );

        // Check that the logo is displayed by using getByAltText
        const logoImage = screen.getByRole('img', { name: '' });
        expect(logoImage).toBeInTheDocument();
        expect(logoImage).toHaveAttribute('src', 'logo.png');

        // Check that the number of vouchers input is displayed
        expect(screen.getByText(/Number of Vouchers/i)).toBeInTheDocument();

        // Check that the Sub total amount is displayed
        expect(screen.getByText(/Sub total/i)).toBeInTheDocument();
    });

    it('should update the number of vouchers when a valid number is inputted', () => {
        render(
            <Provider store={store}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <PurchaseDetails {...defaultProps} />
                </Formik>
            </Provider>
        );
        // Find the InputNumber and update the value
        const inputNumber = screen.getByDisplayValue('0');
        fireEvent.change(inputNumber, { target: { value: '2' } });

        // Ensure onUpdateItem was called with correct values
        expect(defaultProps.onUpdateItem).toHaveBeenCalledWith(
            '1',
            2,
            100,
            'Hike Plan',
            200,
            [],
            'logo.png'
        );
    });

    it('should select all employees with salary greater than the given amount', () => {
        render(
            <Provider store={store}>
                <Formik initialValues={{}} onSubmit={() => {}}>
                    <PurchaseDetails {...defaultProps} />
                </Formik>
            </Provider>
        );

        // Find and click the 'Select all employees' checkbox
        const selectAllCheckbox = screen.getByRole('checkbox');
        fireEvent.click(selectAllCheckbox);

        // Ensure onUpdateItem was called with correct values for selected employees
        expect(defaultProps.onUpdateItem).toHaveBeenCalledWith(
            '1',
            1, // Only Employee 1 is selected because of salary validation
            100,
            'Hike Plan',
            100,
            [{ name: 'Employee 1', employeeId: 1 }],
            'logo.png'
        );
    });

    // it('should show an error toast when no employees match the salary criteria', () => {
    //     // Simulate no matching employees
    //     const modifiedProps = {
    //         ...defaultProps,
    //         salaryAmt: 5000, // Set to an amount higher than any employee salary
    //     };

    //     render(
    //         <Provider store={store}>
    //             <Formik initialValues={{}} onSubmit={() => {}}>
    //                 <PurchaseDetails {...modifiedProps} />
    //             </Formik>
    //         </Provider>
    //     );

    //     // Find and click the 'Select all employees' checkbox
    //     const selectAllCheckbox = screen.getByRole('checkbox');
    //     fireEvent.click(selectAllCheckbox);

    //     // Check if the showToast function was called
    //     expect(showToast).toHaveBeenCalledWith({
    //         description: 'no employees with salary greater than 5000',
    //         variant: 'error',
    //     });
    // });
});
