import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import DocumentsTab from '../../../components/employeeDetails/DocumentsTab';
import { useDeleteDocumentApi } from '../../../hooks/docAndAssetsHooks/useDocDeleteApi';
import useGetEmployeeDocument from '../../../hooks/docAndAssetsHooks/useGetEmployeeDocument';

const mockDispatch = vi.fn();
vi.mock('react-redux', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useDispatch: () => mockDispatch,
    };
});

vi.mock('../../../hooks/docAndAssetsHooks/useGetEmployeeDocument', () => ({
    default: vi.fn(),
}));

vi.mock('../../../hooks/docAndAssetsHooks/useDocDeleteApi', () => ({
    useDeleteDocumentApi: vi.fn(),
}));

vi.mock('@src/hooks/useDebounceSearch', () => ({
    default: () => ({ searchText: '', updateSearchText: vi.fn() }),
}));

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource }: any) => (
        <div data-testid="documents-table">{(dataSource ?? []).length} rows</div>
    ),
}));

vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    default: ({ isOpen, title }: any) => (isOpen ? <div data-testid="confirmation-modal">{title}</div> : null),
}));

vi.mock('../../../components/modals/EmployeeDocumentModal', () => ({
    default: ({ open, selectedRowData, EmpName }: any) =>
        open ? (
            <div data-testid="employee-document-modal">
                {selectedRowData ? 'edit' : 'create'}:{EmpName ?? ''}
            </div>
        ) : null,
}));

const mockDocs = [
    { name: 'Aadhaar Card', url: 'http://example.com/a.pdf', expiryDate: '2030-01-01', _id: 'doc-1' },
    { name: 'PAN Card', url: 'http://example.com/b.pdf', expiryDate: '2031-01-01', _id: 'doc-2' },
];

const employeeData = { id: 'emp-1', fullName: 'Jane Doe' };

const defaultDocHook = {
    employeeDocs: mockDocs,
    docCount: 2,
    getEmployeeDocuments: vi.fn(),
    isLoading: false,
};

beforeEach(() => {
    vi.clearAllMocks();
    (useGetEmployeeDocument as Mock).mockReturnValue(defaultDocHook);
    (useDeleteDocumentApi as Mock).mockReturnValue({
        deleteDocumentData: vi.fn(),
        deleteLoader: false,
    });
});

describe('DocumentsTab', () => {
    it('renders the search input, Add Document button, and the document table with mocked data', () => {
        render(<DocumentsTab isLoading={false} employeeData={employeeData} />);

        expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add Document' })).toBeInTheDocument();
        expect(screen.getByTestId('documents-table')).toHaveTextContent('2 rows');
    });

    it('calls useGetEmployeeDocument with the employee id', () => {
        render(<DocumentsTab isLoading={false} employeeData={employeeData} />);

        expect(useGetEmployeeDocument).toHaveBeenCalledWith('emp-1', 1, '');
    });

    it('renders an empty table when there are no documents', () => {
        (useGetEmployeeDocument as Mock).mockReturnValue({ ...defaultDocHook, employeeDocs: [], docCount: 0 });

        render(<DocumentsTab isLoading={false} employeeData={employeeData} />);

        expect(screen.getByTestId('documents-table')).toHaveTextContent('0 rows');
    });

    it('opens the EmployeeDocumentModal in "create" mode when Add Document is clicked', () => {
        render(<DocumentsTab isLoading={false} employeeData={employeeData} />);

        expect(screen.queryByTestId('employee-document-modal')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Add Document' }));

        expect(screen.getByTestId('employee-document-modal')).toHaveTextContent('create');
    });

    it('does not show the delete confirmation modal by default', () => {
        render(<DocumentsTab isLoading={false} employeeData={employeeData} />);

        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
    });
});
