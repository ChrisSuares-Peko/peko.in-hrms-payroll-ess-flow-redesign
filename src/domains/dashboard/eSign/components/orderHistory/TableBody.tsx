import { useState, type FC } from 'react';

import { Flex, Pagination, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import DownloadItem from './DownloadItem';
import ESignTypeLabel from './ESignTypeLabel';
import SignersBadges from './SignersBadges';
import StatusBadge from './StatusBadge';
import { useESignDocument } from '../../hooks/useESignDocument';
import useESignHistory from '../../hooks/useESignHistory';
import { setESignDocData } from '../../slices/eSignDocSlice';
import { HistoryTableItem, SignerInfo } from '../../types';

interface TableProps {
    searchText: string;
    filters: any;
}

const TableBody: FC<TableProps> = ({ searchText, filters }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const { tableData, isLoading, count } = useESignHistory({
        searchText,
        pageSize,
        page: currentPage,
        from: filters.from,
        to: filters.to,
    });
    const { isLoading: l2, downloadDocument } = useESignDocument();
    const columns = [
        {
            title: 'Created Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'eSign Type',
            dataIndex: 'signers_info',
            key: 'esign_type',
            render: (signers_info: SignerInfo[], record: HistoryTableItem) => (
                <ESignTypeLabel signingPolicy={record.signingPolicy} signers_info={signers_info} />
            ),
        },
        {
            title: 'Document Name',
            dataIndex: 'docket_title',
            key: 'docket_title',
            render: (title: string) => <Typography.Text>{title}</Typography.Text>,
        },
        {
            title: "Signer's Name",
            dataIndex: 'signers_info',
            key: 'signers_info',
            render: (signers_info: [SignerInfo]) => <SignersBadges signers_info={signers_info} />,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <StatusBadge status={status} />,
            width: 170,
        },
        {
            title: <Flex>Download</Flex>,
            dataIndex: 'document_url',
            key: 'document_url',
            render: (_document_url: string, record: HistoryTableItem) => (
                <Flex vertical gap={2}>
                    <DownloadItem
                        label="Certificate"
                        isActive={record.status === 'COMPLETED'}
                        onClick={() =>
                            downloadDocument(record.id, 'ephotocopy', record.docket_title)
                        }
                    />
                    <DownloadItem
                        label="Document"
                        isActive={record.status === 'COMPLETED'}
                        onClick={() => downloadDocument(record.id, 'Flat', record.docket_title)}
                    />
                </Flex>
            ),
        },
        {
            title: 'Actions',
            dataIndex: '',
            key: '',
            render: (_: any, record: any) => (
                <Flex
                    onClick={async () => {
                        dispatch(setESignDocData({ id: record?.id, isDisabled: true }));
                        navigate(paths.eSign.viewPage);
                    }}
                    className="text-green-600 cursor-pointer hover:text-green-700 w-fit"
                >
                    View
                </Flex>
            ),
        },
    ];
    return (
        <>
            <GenericTable
                loading={isLoading || l2}
                dataSource={tableData}
                columns={columns}
                pagination={false}
                rowKey={record => record.id}
            />
            {tableData!?.length > 0 && (
                <Pagination
                    className="mt-3 text-center sm:mt-10 sm:text-end"
                    total={count}
                    current={currentPage}
                    defaultPageSize={pageSize}
                    onChange={(page, pageSize2) => {
                        setCurrentPage(page);
                        setPageSize(pageSize2);
                    }}
                />
            )}
        </>
    );
};

export default TableBody;
