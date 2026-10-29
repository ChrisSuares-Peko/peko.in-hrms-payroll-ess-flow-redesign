import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import UploadPage from '../../pages/UploadPage';

vi.mock('../../components/SignDeskBranding', () => ({
    default: () => <div data-testid="sign-desk-branding">SignDeskBranding</div>,
}));

vi.mock('../../components/uploadPage/UploadForm', () => ({
    default: () => <div data-testid="upload-form">UploadForm</div>,
}));

vi.mock('../../components/uploadPage/UploadInfo', () => ({
    default: () => <div data-testid="upload-info">UploadInfo</div>,
}));

describe('UploadPage Component', () => {
    it('renders without crashing', () => {
        render(<UploadPage />);
        expect(screen.getByText(/Upload Document/i)).toBeInTheDocument();
    });

    it('renders SignDeskBranding component', () => {
        render(<UploadPage />);
        expect(screen.getByTestId('sign-desk-branding')).toBeInTheDocument();
    });

    it('renders UploadForm component', () => {
        render(<UploadPage />);
        expect(screen.getByTestId('upload-form')).toBeInTheDocument();
    });

    it('renders UploadInfo component', () => {
        render(<UploadPage />);
        expect(screen.getByTestId('upload-info')).toBeInTheDocument();
    });
});
