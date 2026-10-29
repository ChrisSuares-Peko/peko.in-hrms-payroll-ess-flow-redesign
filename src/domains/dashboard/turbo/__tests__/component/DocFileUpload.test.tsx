import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import DocFileUpload from '../../components/documents/DocFileUpload';

vi.mock('@src/hooks/store', () => ({
  useAppDispatch: () => vi.fn(),
}));

const showToastMock = vi.fn();
vi.mock('@src/slices/apiSlice', () => ({
  showToast: (...args: any) => showToastMock(...args),
}));

const renderWithFormik = (ui: React.ReactNode) =>
  render(
    <Formik initialValues={{ documentBase: '' }} onSubmit={vi.fn()}>
      {() => ui}
    </Formik>
  );

describe('DocFileUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders label and upload button', () => {
    renderWithFormik(<DocFileUpload name="documentBase" label="Upload Document" />);

    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText('Click to Upload')).toBeInTheDocument();
  });

  it('should show error toast when uploading invalid file format', async () => {
    renderWithFormik(<DocFileUpload name="documentBase" label="Upload Document" />);

    const uploadButton = screen.getByText('Click to Upload');

    const invalidFile = new File(['dummy'], 'test.txt', { type: 'text/plain' });

    const input = uploadButton.closest('button')!.parentElement!.querySelector('input')!;
    await fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(showToastMock).toHaveBeenCalled();
  });

  it('should show error toast when uploading file larger than allowed size', async () => {
    renderWithFormik(<DocFileUpload name="documentBase" label="Upload Document" />);

    const uploadButton = screen.getByText('Click to Upload');

    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' }); 

    const input = uploadButton.closest('button')!.parentElement!.querySelector('input')!;
    await fireEvent.change(input, { target: { files: [largeFile] } });

    expect(showToastMock).toHaveBeenCalled();
  });

  it('should accept valid file and call setFile + setFieldValue', async () => {
    const setFileMock = vi.fn();

    renderWithFormik(
      <DocFileUpload
        name="documentBase"
        label="Upload Document"
        setFile={setFileMock}
        format="documentFormat"
      />
    );

    const validFile = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });

    const uploadButton = screen.getByText('Click to Upload');
    const input = uploadButton.closest('button')!.parentElement!.querySelector('input')!;

    await fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(setFileMock).toHaveBeenCalled();
    });
  });
});
