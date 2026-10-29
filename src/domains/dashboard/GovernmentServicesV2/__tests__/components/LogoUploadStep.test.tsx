import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LogoUploadStep from '../../components/steps/LogoUploadStep';

// First renders are slow when the suite runs under parallel load.
vi.setConfig({ testTimeout: 30000 });

const onFileSelect = vi.fn(() => false);
const onRemove = vi.fn();

const renderStep = (props: Partial<Parameters<typeof LogoUploadStep>[0]> = {}) =>
    render(
        <LogoUploadStep
            isUploadingLogo={false}
            logoFileName=""
            onFileSelect={onFileSelect}
            onRemove={onRemove}
            {...props}
        />
    );

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

describe('LogoUploadStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the upload prompt with an image-only single-file input', () => {
        renderStep();

        expect(screen.getByText('Trademark a logo with word. Word and logo are trademarked.')).toBeInTheDocument();
        expect(screen.getByText(/Upload black and white logo to register in all colors/)).toBeInTheDocument();
        expect(fileInput()).toHaveAttribute('accept', 'image/jpeg,image/png,image/bmp');
        expect(fileInput()).not.toHaveAttribute('multiple');
        expect(screen.queryByText('Uploading logo…')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /delete/ })).not.toBeInTheDocument();
    });

    it('hands the chosen file to onFileSelect', async () => {
        renderStep();

        const file = new File(['logo'], 'logo.png', { type: 'image/png' });
        fireEvent.change(fileInput(), { target: { files: [file] } });

        await waitFor(() => expect(onFileSelect).toHaveBeenCalledTimes(1));
        const [selected] = onFileSelect.mock.calls[0] as unknown as [File];
        expect(selected.name).toBe('logo.png');
    });

    it('shows the uploaded file name with a remove button that calls onRemove', () => {
        renderStep({ logoFileName: 'brand-logo.png' });

        expect(screen.getByText('brand-logo.png')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /delete/ }));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('shows the uploading state instead of the file name while uploading', () => {
        renderStep({ isUploadingLogo: true, logoFileName: 'brand-logo.png' });

        expect(screen.getByText('Uploading logo…')).toBeInTheDocument();
        expect(document.querySelector('.ant-spin')).toBeInTheDocument();
        expect(screen.queryByText('brand-logo.png')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /delete/ })).not.toBeInTheDocument();
    });
});
