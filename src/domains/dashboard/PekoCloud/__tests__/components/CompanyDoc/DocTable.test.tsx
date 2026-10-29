import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Button, Space } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DocTable from '../../../components/CompanyDoc/DocTable';
import { useDeleteCompanyDocApi } from '../../../hooks/companyDocHooks/useDeleteCompanyDocApi';
import useDownloadDocument from '../../../hooks/useDownloadDocumentApi';

// Mock dependencies
vi.mock('../../../hooks/companyDocHooks/useDeleteCompanyDocApi', () => ({
    useDeleteCompanyDocApi: vi.fn(() => ({
        deleteCompanyDocData: vi.fn(),
        isLoading: false,
    })),
}));
vi.mock('../../../hooks/useDownloadDocumentApi', () => ({
    default: vi.fn(() => ({
        handleDocumentDownload: vi.fn(),
    })),
}));
vi.mock('../../../components/Modals/CompanyDocModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>CompanyDocModal</div>),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal.tsx', () => ({
    __esModule: true,
    default: vi.fn(({ handleSubmit }) => (
        <div>
            ConfirmationModal
            <button type="button" onClick={handleSubmit}>
                Yes
            </button>
        </div>
    )),
}));

vi.mock('../../../utils/companyDoc.tsx', () => ({
    companyDocColumn: vi.fn((handleDelete, handleEdit) => [
        {
            title: 'Document Name',
            dataIndex: 'documentName',
            key: 'documentName',
        },
        {
            title: 'Document Number',
            dataIndex: 'documentNumber',
            key: 'documentNumber',
        },
        {
            title: 'Document Type',
            dataIndex: 'Document Type',
            key: 'Document Type',
        },
        {
            title: 'Issued Date',
            dataIndex: 'issueDate',
            key: 'issueDate',
        },
        {
            title: 'Expiry Date',
            dataIndex: 'expireDate',
            key: 'expireDate',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            render: (text: any, record: any) => (
                <Space size="middle">
                    <Button className="border-0">
                        <DeleteOutlined
                            className="text-[#E30000]"
                            onClick={() => handleDelete(record)}
                        />
                    </Button>
                    <Button className="border-0">
                        <EditOutlined
                            className="text-[#E30000]"
                            onClick={() => handleEdit(record)}
                        />
                    </Button>
                </Space>
            ),
        },
    ]),
}));

describe('DocTable', () => {
    const mockSetReloadTable = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandleDocumentDownload = vi.fn();
    const mockHandleDeleteCompanyDoc = vi.fn();

    const defaultProps = {
        setReloadTable: mockSetReloadTable,
        orderCount: 20,
        tableLoading: false,
        tableDatas: [
            {
                id: '1',
                document: 'docKey',
                documentName: 'docName',
                issueDate: '12-04-2024',
                documentNumber: '23412424',
            },
        ],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useDeleteCompanyDocApi as any).mockReturnValue({
            deleteCompanyDocData: mockHandleDeleteCompanyDoc,
            isLoading: false,
        });
        (useDownloadDocument as any).mockReturnValue({
            handleDocumentDownload: mockHandleDocumentDownload,
        });
    });

    it('renders component correctly', () => {
        render(<DocTable {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for documents')).toBeInTheDocument();
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles search input change', () => {
        render(<DocTable {...defaultProps} />);

        const search = screen.getByPlaceholderText(/Search for documents/i);
        fireEvent.change(search, {
            target: { value: 'test' },
        });
        expect(search).toHaveValue('test');
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('opens CompanyDocModal when "Add New Document" is clicked', () => {
        render(<DocTable {...defaultProps} />);
        fireEvent.click(screen.getByText('Add New Document'));
        expect(screen.getByText('CompanyDocModal')).toBeInTheDocument();
    });

    it('handles document download', async () => {
        render(<DocTable {...defaultProps} />);
        const record = defaultProps.tableDatas[0];
        await mockHandleDocumentDownload(record);
        expect(mockHandleDocumentDownload).toHaveBeenCalledWith(record);
    });

    it('renders loading skeletons when tableLoading is true', () => {
        const { container } = render(<DocTable {...defaultProps} tableLoading />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('opens and closes ConfirmationModal and handles delete', async () => {
        render(<DocTable {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
        expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Yes/i }));
        await waitFor(() => {
            expect(mockHandleDeleteCompanyDoc).toHaveBeenCalled();
        });
    });

    it('handles page change', () => {
        render(<DocTable {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });
});
