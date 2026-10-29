import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, it, expect } from 'vitest';

import FileUploadField from '../../../components/shared/FileUploadField';

const renderField = (props: Partial<React.ComponentProps<typeof FileUploadField>> = {}) =>
    render(
        <Formik initialValues={{}} onSubmit={() => {}}>
            <FileUploadField
                label="Upload"
                fieldName="file"
                uploadLabel="Click to upload"
                allowedTypes={['image/png']}
                acceptedTypesLabel="PNG only"
                accept=".png"
                {...props}
            />
        </Formik>
    );

describe('FileUploadField', () => {
    it('shows upload prompt when no file is set', () => {
        renderField();

        expect(screen.getByText('Upload')).toBeInTheDocument();
        expect(screen.getByText('Click to upload')).toBeInTheDocument();
        expect(screen.getByText(/PNG only/)).toBeInTheDocument();
        expect(screen.getByText(/Browse files/i)).toBeInTheDocument();
    });

    it('shows existing file name when existingUrl is provided', () => {
        renderField({ existingUrl: 'https://example.com/logo.png' });

        expect(screen.getByText('logo.png')).toBeInTheDocument();
        expect(screen.getByText(/Click to replace/i)).toBeInTheDocument();
    });

    it('rejects files with disallowed types and shows an error', () => {
        const { container } = renderField();

        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
        Object.defineProperty(input, 'files', { value: [file] });
        fireEvent.change(input);

        expect(screen.getByText(/Only PNG only files are allowed/i)).toBeInTheDocument();
    });
});
