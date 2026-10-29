import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import * as Yup from 'yup';

import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';

beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    vi.useFakeTimers();
});

describe('useFormAutoFocus', () => {
    const schema = Yup.object({
        name: Yup.string().required('required'),
        email: Yup.string().required('required'),
    });

    it('calls handleSubmit when validation passes', () => {
        const { result } = renderHook(() => useFormAutoFocus({ schema }));
        const handleSubmit = vi.fn();
        const setFieldTouched = vi.fn();

        act(() => {
            result.current.handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, {
                name: 'A',
                email: 'B',
            });
        });

        expect(handleSubmit).toHaveBeenCalled();
        expect(setFieldTouched).not.toHaveBeenCalled();
    });

    it('marks every invalid field as touched and focuses first error input', () => {
        const nameInput = document.createElement('input');
        nameInput.name = 'name';
        // jsdom does not implement scrollIntoView; provide a stub before spying.
        (nameInput as any).scrollIntoView = vi.fn();
        const focusSpy = vi.spyOn(nameInput, 'focus');
        const scrollSpy = vi.spyOn(nameInput, 'scrollIntoView' as any);
        document.body.appendChild(nameInput);

        const { result } = renderHook(() => useFormAutoFocus({ schema }));
        const handleSubmit = vi.fn();
        const setFieldTouched = vi.fn();

        act(() => {
            result.current.handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, {
                name: '',
                email: '',
            });
        });

        // setFieldTouched marks both fields synchronously.
        expect(setFieldTouched).toHaveBeenCalledWith('name', true);
        expect(setFieldTouched).toHaveBeenCalledWith('email', true);
        expect(handleSubmit).not.toHaveBeenCalled();

        // The focus is delayed by setTimeout(_, 100).
        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(focusSpy).toHaveBeenCalled();
        expect(scrollSpy).toHaveBeenCalled();
    });

    it('does nothing if no input matches the error path', () => {
        const { result } = renderHook(() => useFormAutoFocus({ schema }));

        act(() => {
            result.current.handleFormSubmitWithAutoFocus(vi.fn(), vi.fn(), {
                name: '',
                email: '',
            });
            vi.advanceTimersByTime(100);
        });

        // No throw; simply nothing to focus.
        expect(document.activeElement).toBe(document.body);
    });

    it('setFormikRef stores the formik ref', () => {
        const { result } = renderHook(() => useFormAutoFocus({ schema }));
        const fakeRef: any = { submitForm: vi.fn() };

        result.current.setFormikRef(fakeRef);
        expect(result.current.formikRef.current).toBe(fakeRef);
    });
});
