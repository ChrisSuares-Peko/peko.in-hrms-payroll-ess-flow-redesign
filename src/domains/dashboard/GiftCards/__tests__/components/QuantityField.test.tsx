import { render, screen, fireEvent } from '@testing-library/react';
import { Formik, Form } from 'formik';
import { describe, it, expect } from 'vitest';

import QuantityField from '../../components/QuantityField';

describe('QuantityField Component', () => {
    const setup = () => {
        render(
            <Formik initialValues={{ quantity: 2 }} onSubmit={() => {}}>
                <Form>
                    <QuantityField />
                </Form>
            </Formik>
        );
        return screen.getByRole('spinbutton'); // InputNumber is a spinbutton
    };

    it('renders the input field', () => {
        const input = setup();
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue(2);
    });

    it('accepts numeric input', () => {
        const input = setup();
        fireEvent.change(input, { target: { value: 5 } });
        expect(input).toHaveValue(5);
    });

    it('prevents non-numeric characters', () => {
        const input = setup();
        fireEvent.keyDown(input, { key: 'a' }); // Should be ignored
        fireEvent.keyDown(input, { key: '1' }); // Should be accepted
        expect(input).toHaveValue(2); // Should still be the initial value
    });

    it('enforces min and max constraints', async () => {
        const input = setup();

        fireEvent.change(input, { target: { value: 1 } });
        fireEvent.blur(input);
        expect(input).toHaveValue(2);

        fireEvent.change(input, { target: { value: 11 } });
        fireEvent.blur(input);
        expect(input).toHaveValue(10);
    });

    it('triggers validation on blur', async () => {
        const input = setup();
        fireEvent.blur(input);
        expect(input).toHaveValue(2);
    });
});
