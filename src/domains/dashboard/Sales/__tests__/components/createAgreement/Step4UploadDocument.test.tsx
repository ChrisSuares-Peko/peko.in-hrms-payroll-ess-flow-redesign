import React from 'react';

import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import Step4UploadDocument from '../../../components/createAgreement/Step4UploadDocument';
import type { Step4Ref } from '../../../types/createAgreement';

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: () => dispatchMock }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../forms/createAgreement/RecipientForm', () => ({
    default: () => <div data-testid="recipient-form" />,
}));
vi.mock('../../../components/shared/PDFViewer', () => ({
    default: () => <div data-testid="pdf-viewer" />,
}));

const baseRecipients = [
    { id: 1, name: '', email: '', phone: '', expanded: true, hasError: false },
];

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Step4UploadDocument', () => {
    it('renders the upload prompt when no file is set', () => {
        render(
            <Step4UploadDocument
                recipients={baseRecipients}
                onUpdateRecipient={() => {}}
            />
        );

        expect(screen.getByText(/Drag & drop your PDF here/i)).toBeInTheDocument();
        expect(screen.getByText(/Browse File/i)).toBeInTheDocument();
    });

    it('switches to PDF viewer once a file is set via ref', () => {
        const ref = React.createRef<Step4Ref>();
        render(
            <Step4UploadDocument
                ref={ref}
                recipients={baseRecipients}
                onUpdateRecipient={() => {}}
            />
        );

        const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
        act(() => {
            ref.current?.setFile(file);
        });

        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
        expect(screen.queryByText(/Drag & drop your PDF here/i)).not.toBeInTheDocument();
    });

    it('validate() shows toast and returns false when file missing', () => {
        const ref = React.createRef<Step4Ref>();
        render(
            <Step4UploadDocument
                ref={ref}
                recipients={baseRecipients}
                onUpdateRecipient={() => {}}
            />
        );

        const ok = ref.current?.validate();
        expect(ok).toBe(false);
        expect(dispatchMock).toHaveBeenCalled();
    });

    it('validate() returns false when recipient name/email missing', () => {
        const ref = React.createRef<Step4Ref>();
        render(
            <Step4UploadDocument
                ref={ref}
                recipients={baseRecipients}
                onUpdateRecipient={() => {}}
            />
        );

        const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
        act(() => {
            ref.current?.setFile(file);
        });

        const ok = ref.current?.validate();
        expect(ok).toBe(false);
    });

    it('validate() returns false when no signature placed', () => {
        const ref = React.createRef<Step4Ref>();
        const populatedRecipient = [
            {
                id: 1,
                name: 'A',
                email: 'a@b.com',
                phone: '999',
                expanded: true,
                hasError: false,
            },
        ];

        render(
            <Step4UploadDocument
                ref={ref}
                recipients={populatedRecipient}
                onUpdateRecipient={() => {}}
            />
        );

        const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
        act(() => {
            ref.current?.setFile(file);
        });

        expect(ref.current?.validate()).toBe(false);
    });

    it('validate() returns true when file, recipient and signature field are present', () => {
        const ref = React.createRef<Step4Ref>();
        const populatedRecipient = [
            {
                id: 1,
                name: 'A',
                email: 'a@b.com',
                phone: '999',
                expanded: true,
                hasError: false,
            },
        ];

        render(
            <Step4UploadDocument
                ref={ref}
                recipients={populatedRecipient}
                onUpdateRecipient={() => {}}
            />
        );

        const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
        act(() => {
            ref.current?.setFile(file);
            ref.current?.setSignatureFields([{ signerIndex: 0 } as any]);
        });

        expect(ref.current?.canContinue()).toBe(true);
        expect(ref.current?.validate()).toBe(true);
    });

    it('uploading via the file input triggers onDocumentChange', () => {
        const onDocumentChange = vi.fn();
        const { container } = render(
            <Step4UploadDocument
                recipients={baseRecipients}
                onUpdateRecipient={() => {}}
                onDocumentChange={onDocumentChange}
            />
        );

        const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        Object.defineProperty(input, 'files', { value: [file] });
        fireEvent.change(input);

        expect(onDocumentChange).toHaveBeenCalled();
    });
});
