import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import FilePreviewModal from '../../components/FilePreviewModal';

describe('FilePreviewModal Component', () => {
    const mockHandleCancel = vi.fn();
    const mockHandleSubmit = vi.fn();

    const defaultProps = {
        previewVisible: true,
        previewImage: null,
        file: null,
        isLoadingPostChatFile: false,
        handleCancel: mockHandleCancel,
        handleSubmit: mockHandleSubmit,
    };

    it('renders the modal when previewVisible is true', () => {
        render(<FilePreviewModal {...defaultProps} />);

        expect(screen.getByText('File Preview')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Proceed')).toBeInTheDocument();
    });

    it('calls handleCancel when the Cancel button is clicked', () => {
        render(<FilePreviewModal {...defaultProps} />);

        fireEvent.click(screen.getByText('Cancel'));

        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('calls handleSubmit when the Proceed button is clicked', () => {
        render(<FilePreviewModal {...defaultProps} />);

        fireEvent.click(screen.getByText('Proceed'));

        expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('displays an image preview when a valid image file is provided', () => {
        const imageFile = new File(['test-image'], 'test.png', { type: 'image/png' });

        render(
            <FilePreviewModal {...defaultProps} previewImage="test-image-url" file={imageFile} />
        );

        expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    it('displays a default document preview when the file is not an image', () => {
        const nonImageFile = new File(['test-pdf'], 'test.pdf', { type: 'application/pdf' });

        render(<FilePreviewModal {...defaultProps} file={nonImageFile} />);

        expect(screen.getByText('Preview not available')).toBeInTheDocument();
    });

    it('disables the Proceed button while loading', () => {
        render(<FilePreviewModal {...defaultProps} isLoadingPostChatFile />);

        const proceedButton = screen.getByText('Proceed');

        expect(proceedButton.closest('button')).toHaveClass('ant-btn-loading');
    });
});
