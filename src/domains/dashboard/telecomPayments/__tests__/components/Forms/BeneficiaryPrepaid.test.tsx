import { render } from '@testing-library/react';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { beforeEach, describe, it, vi } from 'vitest';

import AddBeneficiaryPrepaid from '../../../components/forms/BeneficiaryPrepaid';

vi.mock('../../hooks/useGeneralApi');

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: {
            role: 'user',
            id: '123',
        },
    },
});

vi.mock('../../../hooks/useGeneralApi', () => ({
    default: vi.fn(() => ({
        stateData: [
            { value: 'MH', label: 'Maharashtra' },
            { value: 'DL', label: 'Delhi' },
        ],
    })),
}));

describe('AddBeneficiaryPrepaid Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the component correctly', () => {
        render(
            <Provider store={store}>
                <Formik
                    initialValues={{ phoneNo: '', serviceProvider: '', providerCircle: '' }}
                    onSubmit={() => {}}
                >
                    <AddBeneficiaryPrepaid service="" />
                </Formik>
            </Provider>
        );
    });

    it('renders Select options correctly for provider circle', async () => {
        render(
            <Provider store={store}>
                <Formik
                    initialValues={{ phoneNo: '', serviceProvider: '', providerCircle: '' }}
                    onSubmit={() => {}}
                >
                    <AddBeneficiaryPrepaid service="" />
                </Formik>
            </Provider>
        );
    });
});
