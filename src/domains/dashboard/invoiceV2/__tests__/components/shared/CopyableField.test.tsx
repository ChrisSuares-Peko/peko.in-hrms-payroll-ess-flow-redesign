import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CopyableField from '../../../components/shared/CopyableField';

describe('CopyableField', () => {
    const writeTextMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, { clipboard: { writeText: writeTextMock } });
    });

    it('renders the label and the value inside a readonly input', () => {
        render(<CopyableField label="Bank Name" value="Peko Bank" />);
        expect(screen.getByText('Bank Name')).toBeInTheDocument();
        const input = screen.getByDisplayValue('Peko Bank') as HTMLInputElement;
        expect(input.readOnly).toBe(true);
    });

    it('writes the value to clipboard when copy button is clicked', async () => {
        const { container } = render(<CopyableField label="Bank" value="VALUE123" />);
        const copyButton = container.querySelector('.bg-\\[\\#FF4F4F\\]');
        fireEvent.click(copyButton!);
        await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith('VALUE123'));
    });
});
