import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Yup from 'yup';

import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';

describe('useFormAutoFocus', () => {
    const schema = Yup.object({
        name: Yup.string().required('Name is required'),
        email: Yup.string().required('Email is required'),
    });

    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    it('should call handleSubmit when validation passes', () => {
        const { result } = renderHook(() => useFormAutoFocus({ schema }));
        const handleSubmit = vi.fn();
        const setFieldTouched = vi.fn();

        result.current.handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, {
            name: 'Arshid',
            email: 'test@example.com',
        });

        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(setFieldTouched).not.toHaveBeenCalled();
    });

    it('should mark every invalid field as touched', () => {
        const { result } = renderHook(() => useFormAutoFocus({ schema }));
        const handleSubmit = vi.fn();
        const setFieldTouched = vi.fn();

        result.current.handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, {
            name: '',
            email: '',
        });

        expect(handleSubmit).not.toHaveBeenCalled();
        expect(setFieldTouched).toHaveBeenCalledWith('name', true);
        expect(setFieldTouched).toHaveBeenCalledWith('email', true);
    });

    it('should focus the first error input after timeout', () => {
        const input = document.createElement('input');
        input.name = 'name';
        document.body.appendChild(input);
        const focusSpy = vi.spyOn(input, 'focus');
        input.scrollIntoView = vi.fn();

        const { result } = renderHook(() => useFormAutoFocus({ schema }));
        result.current.handleFormSubmitWithAutoFocus(vi.fn(), vi.fn(), { name: '', email: '' });

        vi.advanceTimersByTime(150);
        expect(focusSpy).toHaveBeenCalled();
    });

    it('setFormikRef should store the ref', () => {
        const { result } = renderHook(() => useFormAutoFocus({ schema }));
        const ref = { submitForm: vi.fn() };
        result.current.setFormikRef(ref);
        expect(result.current.formikRef.current).toBe(ref);
    });
});
