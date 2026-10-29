import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import FileUploadField from '../../../components/shared/FileUploadField';

const wrap = (ui: React.ReactNode) => (
    <Formik initialValues={{ logo: null, removeLogo: false }} onSubmit={() => {}}>
        {ui as any}
    </Formik>
);

describe('FileUploadField', () => {
    it('renders the label and upload prompt when there is no selected file', () => {
        render(
            wrap(
                <FileUploadField
                    label="Upload Logo"
                    fieldName="logo"
                    uploadLabel="Click to upload"
                    allowedTypes={['image/png']}
                    acceptedTypesLabel="PNG"
                    accept="image/png"
                />
            )
        );

        expect(screen.getByText('Upload Logo')).toBeInTheDocument();
        expect(screen.getByText('Click to upload')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Browse files/i })).toBeInTheDocument();
    });

    it('shows existing file name when existingUrl is provided', () => {
        render(
            wrap(
                <FileUploadField
                    label="Upload Logo"
                    fieldName="logo"
                    uploadLabel="Click to upload"
                    allowedTypes={['image/png']}
                    acceptedTypesLabel="PNG"
                    accept="image/png"
                    existingUrl="https://example.com/logo.png"
                />
            )
        );

        expect(screen.getByText('logo.png')).toBeInTheDocument();
        expect(screen.getByText('Click to replace')).toBeInTheDocument();
    });
});
