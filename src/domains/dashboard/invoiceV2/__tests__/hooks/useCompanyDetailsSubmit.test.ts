import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useCompanyDetailsSubmit from '../../hooks/useCompanyDetailsSubmit';

describe('useCompanyDetailsSubmit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should expose a handleSubmit function', () => {
        const { result } = renderHook(() => useCompanyDetailsSubmit());
        expect(typeof result.current.handleSubmit).toBe('function');
    });

    it('should log the submitted values', () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const { result } = renderHook(() => useCompanyDetailsSubmit());

        const values = {
            businessName: 'Acme',
            bankName: 'Test Bank',
            accountNumber: '123456',
            ifsc: 'TEST0001',
        } as any;

        result.current.handleSubmit(values);
        expect(logSpy).toHaveBeenCalledWith('Company details submitted:', values);
        logSpy.mockRestore();
    });
});
