import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import IrnField from '../../../components/eInvoiceDetails/IrnField';

const writeTextMock = vi.fn().mockResolvedValue(undefined);

describe('IrnField', () => {
    beforeEach(() => {
        Object.assign(navigator, {
            clipboard: { writeText: writeTextMock },
        });
        writeTextMock.mockClear();
    });

    it('renders label and value', () => {
        render(<IrnField label="IRN" value="hash-123" />);
        expect(screen.getByText('IRN')).toBeInTheDocument();
        expect(screen.getByText('hash-123')).toBeInTheDocument();
    });

    it('hides copy icon when copyable=false', () => {
        const { container } = render(<IrnField label="IRN" value="x" />);
        expect(container.querySelector('.anticon-copy')).toBeNull();
    });

    it('copies value and shows confirmation when copyable', async () => {
        const { container } = render(<IrnField label="IRN" value="hash" copyable />);
        const copyIcon = container.querySelector('.anticon-copy');
        expect(copyIcon).not.toBeNull();
        fireEvent.click(copyIcon!.parentElement as HTMLElement);
        expect(writeTextMock).toHaveBeenCalledWith('hash');
        await waitFor(() =>
            expect(container.querySelector('.anticon-check')).toBeInTheDocument()
        );
    });
});
