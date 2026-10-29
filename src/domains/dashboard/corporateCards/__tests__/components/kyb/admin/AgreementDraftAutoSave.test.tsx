import { render, fireEvent, act } from '@testing-library/react';
import { Formik, Form, Field } from 'formik';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import AgreementDraftAutoSave from '../../../../components/kyb/admin/AgreementDraftAutoSave';

const renderForm = (onSaveDraft: (values: never) => void, ready = true) =>
    render(
        <Formik initialValues={{ entityName: '', regCity: '' }} onSubmit={vi.fn()}>
            <Form>
                <Field name="entityName" placeholder="entityName" />
                <AgreementDraftAutoSave onSaveDraft={onSaveDraft as never} ready={ready} />
            </Form>
        </Formik>
    );

const type = (container: HTMLElement, value: string) =>
    fireEvent.change(container.querySelector('[name="entityName"]') as Element, {
        target: { value },
    });

describe('AgreementDraftAutoSave', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders nothing', () => {
        const { container } = render(
            <Formik initialValues={{ entityName: '' }} onSubmit={vi.fn()}>
                <AgreementDraftAutoSave onSaveDraft={vi.fn()} ready />
            </Formik>
        );

        expect(container.querySelector('form')).not.toBeInTheDocument();
    });

    it('saves the partially filled form shortly after the user stops typing', async () => {
        const onSaveDraft = vi.fn();
        const { container } = renderForm(onSaveDraft);

        type(container, 'Acme Technologies');
        expect(onSaveDraft).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(800);
        });

        expect(onSaveDraft).toHaveBeenCalledTimes(1);
        expect(onSaveDraft).toHaveBeenCalledWith(
            expect.objectContaining({ entityName: 'Acme Technologies' })
        );
    });

    it('saves once for a burst of keystrokes rather than once per key', async () => {
        const onSaveDraft = vi.fn();
        const { container } = renderForm(onSaveDraft);

        type(container, 'A');
        await act(async () => {
            vi.advanceTimersByTime(400);
        });
        type(container, 'Ac');
        await act(async () => {
            vi.advanceTimersByTime(400);
        });
        type(container, 'Acme');
        await act(async () => {
            vi.advanceTimersByTime(800);
        });

        expect(onSaveDraft).toHaveBeenCalledTimes(1);
        expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ entityName: 'Acme' }));
    });

    it('does not save an untouched form, so restoring a draft does not immediately rewrite it', async () => {
        const onSaveDraft = vi.fn();
        renderForm(onSaveDraft);

        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        expect(onSaveDraft).not.toHaveBeenCalled();
    });

    it('waits until the previously saved draft has been loaded before saving anything', async () => {
        const onSaveDraft = vi.fn();
        const { container } = renderForm(onSaveDraft, false);

        type(container, 'Acme');
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });

        expect(onSaveDraft).not.toHaveBeenCalled();
    });

    it('never sends the address proof file along with the draft', async () => {
        const onSaveDraft = vi.fn();
        render(
            <Formik
                initialValues={{
                    entityName: '',
                    addressProof: { base64: 'abc', format: 'pdf', name: 'proof.pdf' },
                }}
                onSubmit={vi.fn()}
            >
                <Form>
                    <Field name="entityName" placeholder="entityName" />
                    <AgreementDraftAutoSave onSaveDraft={onSaveDraft as never} ready />
                </Form>
            </Formik>
        );

        fireEvent.change(document.querySelector('[name="entityName"]') as Element, {
            target: { value: 'Acme' },
        });
        await act(async () => {
            vi.advanceTimersByTime(800);
        });

        expect(onSaveDraft).toHaveBeenCalledTimes(1);
        expect(onSaveDraft.mock.calls[0][0]).not.toHaveProperty('addressProof');
    });
});
