import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

import CopyableField from '../../../components/shared/CopyableField';

const writeText = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
    });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('CopyableField', () => {
    it('renders label and value', () => {
        render(<CopyableField label="Token" value="abc-123" />);

        expect(screen.getByText('Token')).toBeInTheDocument();
        expect((screen.getByDisplayValue('abc-123') as HTMLInputElement).value).toBe('abc-123');
    });

    it('writes to clipboard and shows checkmark when copy clicked', () => {
        const { container } = render(<CopyableField label="Token" value="abc-123" />);

        const copyBtn = container.querySelector('.bg-\\[\\#FF4F4F\\]') as HTMLElement;
        fireEvent.click(copyBtn);

        expect(writeText).toHaveBeenCalledWith('abc-123');
        expect(container.querySelector('.anticon-check')).not.toBeNull();
    });
});
