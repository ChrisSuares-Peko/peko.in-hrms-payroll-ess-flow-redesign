import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { CommissionFields } from '../components/serviceDetail/ConfigureCommissionDrawer';

const MARGIN_ONLY = [{ value: 'MARGIN' as const, label: 'Margin' }];
const ALL = [
    ...MARGIN_ONLY,
    { value: 'AGENT_MARKUP' as const, label: 'Agent Markup' },
    { value: 'PRINCIPAL_MARKUP' as const, label: 'Principal Markup' },
];

const renderFields = (modeOptions: typeof ALL, modesLoading: boolean) =>
    render(
        <Formik
            initialValues={{
                commissionMode: 'MARGIN',
                commissionType: 'PERCENTAGE',
                providerCommission: '5',
                fixedCommissionPerTransaction: '',
                isCommissionInclGST: false,
            }}
            onSubmit={() => {}}
        >
            <Form>
                <CommissionFields modeOptions={modeOptions} modesLoading={modesLoading} />
            </Form>
        </Formik>
    );

const modeSelect = () => document.getElementById('commissionMode') as HTMLElement;

describe('the Commission Mode select', () => {
    it('is disabled and shows a loader while the supported modes load', () => {
        const { container } = renderFields([], true);

        expect(modeSelect()).toBeDisabled();
        expect(container.querySelector('.ant-select-disabled')).toBeInTheDocument();
        expect(container.querySelector('.anticon-loading')).toBeInTheDocument();
    });

    it('is enabled once loaded, and lists every mode a markup service supports', () => {
        const { container } = renderFields(ALL, false);

        expect(modeSelect()).not.toBeDisabled();
        expect(container.querySelector('.anticon-loading')).not.toBeInTheDocument();

        fireEvent.mouseDown(modeSelect());
        ['Agent Markup', 'Principal Markup'].forEach(label =>
            expect(screen.getByText(label)).toBeInTheDocument()
        );
    });

    it('lists only Margin for a service without markup support', () => {
        renderFields(MARGIN_ONLY, false);

        fireEvent.mouseDown(modeSelect());
        expect(screen.queryByText('Agent Markup')).not.toBeInTheDocument();
        expect(screen.queryByText('Principal Markup')).not.toBeInTheDocument();
        expect(screen.getAllByText('Margin').length).toBeGreaterThan(0);
    });
});
