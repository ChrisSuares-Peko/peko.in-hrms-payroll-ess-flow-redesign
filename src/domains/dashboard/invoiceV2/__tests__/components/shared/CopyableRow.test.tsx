import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CopyableRow from '../../../components/shared/CopyableRow';

describe('CopyableRow', () => {
    const writeTextMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        Object.assign(navigator, {
            clipboard: { writeText: writeTextMock },
        });
    });

    it('renders the title and description', () => {
        render(<CopyableRow title="Account" description="1234567890" />);
        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    it('copies the description to clipboard when the icon is clicked', async () => {
        const { container } = render(<CopyableRow title="Account" description="1234567890" />);
        const copyButton = container.querySelector('.bg-\\[\\#FF4F4F\\]');
        fireEvent.click(copyButton!);

        await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith('1234567890'));
    });
});
