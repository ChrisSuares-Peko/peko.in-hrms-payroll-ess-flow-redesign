import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect, vi } from 'vitest';

import BusinessActivity from '../../../components/steps/BusinessActivity';

// useNIC pulls auth from the store and calls the API; stub it so the cascading
// NIC selects render without network or store dependencies.
vi.mock('../../../hooks/useFetchNic', () => ({
    useNIC: () => ({ data: [], loading: false }),
}));

// antd's real Select (rc-select) and the autosize TextArea run DOM measuring
// that throws under jsdom when the surrounding markup uses arbitrary Tailwind
// classes. Stub them — the section headings under test are plain Typography.
vi.mock('antd', async importOriginal => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        Select: ({ placeholder }: { placeholder?: string }) => <div data-testid="select">{placeholder}</div>,
    };
});

vi.mock('@components/atomic/inputs/TextAreaInput', () => ({
    default: ({ name }: { name?: string }) => <textarea data-testid={`textarea-${name}`} />,
}));

const values = {
    entityType: 'private_limited',
    businessActivity: {
        section: '',
        division: '',
        group: '',
        class: '',
        subclass: '',
        description: '',
        secondaryActivity: '',
        otherActivities: '',
    },
};

describe('BusinessActivity step', () => {
    it('renders the business description and secondary activity sections', () => {
        render(
            <Formik initialValues={values} onSubmit={() => {}}>
                <BusinessActivity />
            </Formik>
        );
        expect(screen.getByText(/Business Description/)).toBeInTheDocument();
        expect(screen.getByText(/Secondary Business Activity/)).toBeInTheDocument();
    });
});
