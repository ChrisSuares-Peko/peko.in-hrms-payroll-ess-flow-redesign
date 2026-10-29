import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Space, Spin, TableProps, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import balanceSheet from '@domains/dashboard/PekoCloud/assets/icons/balanceSheet.svg';
import chequeCleared from '@domains/dashboard/PekoCloud/assets/icons/cheque-cleared.svg';
import cPending from '@domains/dashboard/PekoCloud/assets/icons/cheque-pending.svg';
import creditIcon from '@domains/dashboard/PekoCloud/assets/icons/credit.svg';
import debitIcon from '@domains/dashboard/PekoCloud/assets/icons/debit.svg';
import totalCheque from '@domains/dashboard/PekoCloud/assets/icons/total-cheque.svg';
import totalFIle from '@domains/dashboard/PekoCloud/assets/icons/total-file.svg';
import { paths } from '@src/routes/paths';

import { formatDate } from './helperFunctions';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert any input to a string
    return stringText.charAt(0).toUpperCase() + stringText.slice(1).toLowerCase();
};
export const financialData = [
    {
        title: 'Total Files',
        value: '45',
        isCurrency: false,
        icon: totalFIle,
        bgColor: 'bg-[#FFF6F2]',
    },
    {
        title: 'Total Cheques',
        value: '211',
        isCurrency: false,
        icon: totalCheque,
        bgColor: 'bg-[#F9F4FF]',
    },
    {
        title: 'Cheques Pending',
        value: '30',
        isCurrency: true,
        icon: cPending,
        bgColor: 'bg-[#FFFBE4]',
    },
    {
        title: 'Cheques Cleared',
        value: '21',
        isCurrency: false,
        icon: chequeCleared,
        bgColor: 'bg-[#F6FCEB]',
    },
];
export const financialColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void,
    handleDocDownload: (record: any) => void,
    loadingRows: any
): TableProps<any>['columns'] => [
    {
        title: 'Document Name',
        dataIndex: 'documentName',
        key: 'documentName',
        render: (text: string, record: any) => (
            <Flex gap={10}>
                <Flex align="center">
                    <ReactSVG src={balanceSheet || record?.document} />
                </Flex>
                <Flex vertical justify="center">
                    <Typography.Text className="text-base text-gray-900 whitespace-nowrap">
                        {text}
                    </Typography.Text>
                </Flex>
            </Flex>
        ),
    },
    {
        title: 'Document Number',
        dataIndex: 'documentNumber',
        key: 'documentNumber',
    },
    {
        title: 'Document Type',
        dataIndex: 'documentType',
        key: 'documentType',
        render: text => (
            <Typography.Text className="whitespace-nowrap">{text || 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Issued Date',
        dataIndex: 'issueDate',
        key: 'issueDate',
        render: issueDate => (issueDate ? formatDate(issueDate) : ''),
    },
    {
        title: 'Expiry Date',
        dataIndex: 'expireDate',
        key: 'expireDate',
        render: expireDate => (expireDate ? formatDate(expireDate) : 'N/A'),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status, record) => {
            let colorClass = '';
            if (status === 'Active') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'Expired') {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            } else if (status === 'Upcoming') {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            }
            const formattedStatus = formatText(status);
            return record.expireDate ? (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl whitespace-nowrap`}
                >
                    {formattedStatus}
                </Typography.Text>
            ) : (
                <Typography.Text className="text-[#05BE63] bg-[#DDFFE2] font-normal px-3 py-1 rounded-2xl whitespace-nowrap">
                    Active
                </Typography.Text>
            );
        },
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        width: '10%',
        render: (text, record) => (
            <Space size="middle">
                {/* <a href={record.document} target="_blank" rel="noopener noreferrer" download> */}
                <Button
                    className="border-0"
                    disabled={record.documentAvailability === 'NA' || loadingRows[record.id]}
                    onClick={() => handleDocDownload(record)}
                >
                    {loadingRows[record.id] ? (
                        <Spin size="small" className="text-xs" />
                    ) : (
                        <DownloadOutlined
                            className={`text-green-400 ${record.documentAvailability === 'NA' ? 'opacity-50' : ''}`}
                        />
                    )}
                </Button>
                {/* </a> */}

                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];
export const chequeBooksColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void,
    handleDocDownload: (record: any) => void,
    loadingRows: any
): TableProps<any>['columns'] => [
    {
        title: 'Cheque Book ID',
        dataIndex: 'bookId',
        key: 'bookId',
        render: (text: string, record: any) => (
            <Link
                style={{ color: '#101828', textDecoration: 'none' }}
                to={`/${paths.pekoCloud.index}/${paths.pekoCloud.financials}/${paths.pekoCloud.chequeBookDetails}`}
                state={{
                    chequeBookId: record.id,
                }}
            >
                {text}
            </Link>
        ),
    },
    {
        title: 'Account Name',
        dataIndex: 'accountName',
        key: 'accountName',
    },
    {
        title: 'Account Number',
        dataIndex: 'accountNumber',
        key: 'accountNumber',
    },
    {
        title: 'Bank Name',
        dataIndex: 'bankName',
        key: 'bankName',
        render: text => <Typography.Text className="whitespace-nowrap">{text}</Typography.Text>,
    },

    {
        title: 'Account Balance',
        dataIndex: 'accountBalance', // Ensure this matches the key in your data source
        key: 'amount',
        render: text => {
            const number = parseFloat(text); // Convert string to number
            return text ? (
                <Typography.Text className="whitespace-nowrap">
                    ₹ {number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </Typography.Text>
            ) : (
                <Typography.Text className="whitespace-nowrap">N/A</Typography.Text>
            );
        },
    },

    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';
            if (status === 'Active') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'Issued' || status === 'Reissued') {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            } else {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }
            const formattedStatus = formatText(status);
            return (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl whitespace-nowrap`}
                >
                    {formattedStatus}
                </Typography.Text>
            );
        },
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        render: (text, record) => (
            <Space>
                {/* <a href={record.document} target="_blank" rel="noopener noreferrer" download> */}
                <Button
                    onClick={() => handleDocDownload(record)}
                    className="border-0"
                    disabled={record.documentAvailability === 'NA' || loadingRows[record.id]}
                >
                    {loadingRows[record.id] ? (
                        <Spin size="small" className="text-xs" />
                    ) : (
                        <DownloadOutlined
                            className={`text-green-400 ${record.documentAvailability === 'NA' ? 'opacity-50' : ''}`}
                        />
                    )}
                </Button>
                {/* </a> */}

                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];

export const retrieveChequeBookData = (data: string | number | null | undefined | false) => {
    if (data === null) return 'N/A';
    if (data === '') return 'N/A';
    if (data === undefined) return 'N/A';
    if (data === false) return 'N/A';
    return data;
};
export const chequeBookColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Date',
        dataIndex: 'dateAdded',
        key: 'dateAdded',
        render: dateAdded => formatDate(dateAdded),
    },
    {
        title: 'Payee Name',
        dataIndex: 'payeeName',
        key: 'payeeName',
    },
    {
        title: 'Cheque Book Number',
        dataIndex: 'chequeBookNumber',
        key: 'chequeBookNumber',
    },
    {
        title: 'Bank Name',
        dataIndex: 'bankAccount',
        key: 'bankAccount',
    },
    {
        title: 'Cheque Number',
        dataIndex: 'chequeNumber',
        key: 'chequeNumber',
    },
    {
        title: 'Cheque Date',
        dataIndex: 'dateOfCheque',
        key: 'dateOfCheque',
        render: dateOfCheque => formatDate(dateOfCheque),
    },
    {
        title: 'Due Date',
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: dueDate => formatDate(dueDate),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';
            if (status === 'Cleared') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'Issued' || status === 'Presented') {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            } else {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }
            const formattedStatus = formatText(status);
            return (
                <Typography.Text className={`${colorClass} font-normal px-3 py-1 rounded-2xl`}>
                    {formattedStatus}
                </Typography.Text>
            );
        },
    },
    // {
    //     title: 'Actions',
    //     dataIndex: 'actions',
    //     key: 'actions',
    //     render: (text, record) =>

    //             <Space>
    //                 <a href={record.document} target="_blank" rel="noopener noreferrer" download>
    //                     <Button
    //                         type="link"
    //                         className="border-0"
    //                         disabled={record.document === 'NA'}
    //                     >
    //                         <DownloadOutlined
    //                             className={`text-green-400 ${record.document === 'NA' ? 'opacity-50' : ''}`}
    //                         />
    //                     </Button>
    //                 </a>
    //                 <Button type="link" className="border-0">
    //                     <EditOutlined
    //                         className="text-[#E30000]"
    //                         onClick={() => handleEdit(record)}
    //                     />
    //                 </Button>
    //                 <Button type="link" className="border-0">
    //                     <DeleteOutlined
    //                         className="text-[#E30000]"
    //                         onClick={() => handleDelete(record)}
    //                     />
    //                 </Button>
    //             </Space>

    // },
];
export const chequeLeafsColumn = (
    handleDelete: (record: any) => void,
    handleEdit: (record: any) => void,
    handleDocDownload: (record: any) => void,
    loadingRows: any
): TableProps<any>['columns'] => [
    {
        title: 'Cheque Book Number',
        dataIndex: 'chequeBookNumber',
        key: 'chequeBookNumber',

        render: (text: string, record: any) => (
            <Link
                style={{ color: '#101828', textDecoration: 'none' }}
                to={`/${paths.pekoCloud.index}/${paths.pekoCloud.financials}/${paths.pekoCloud.chequeDetails}`}
                state={{
                    chequeLeafId: record.id,
                }}
            >
                {text || 'N/A'}
            </Link>
        ),
    },
    {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (text: string, record: any) => {
            const isCredit = text === 'Credit';
            const iconSrc = isCredit ? creditIcon : debitIcon;

            return (
                <Flex gap={10} className="-ml-[.125rem]">
                    <Flex align="center" justify="start">
                        <ReactSVG src={iconSrc} />
                    </Flex>
                    <Flex vertical justify="center">
                        <Typography.Text className="text-xs whitespace-nowrap">
                            {text || 'N/A'}
                        </Typography.Text>
                    </Flex>
                </Flex>
            );
        },
    },
    {
        title: 'Payee Name',
        dataIndex: 'payeeName',
        key: 'payeeName',
        render: payeeName => (
            <Typography.Text className="whitespace-nowrap">{payeeName || 'N/A'}</Typography.Text>
        ),
    },
    // {

    //     title: 'Date Added',
    //     dataIndex: 'dateAdded',
    //     key: 'dateAdded',
    // },

    {
        title: 'Bank Name',
        dataIndex: 'bankAccount',
        key: 'bankAccount',
        render: bankAccount => (
            <Typography.Text className="whitespace-nowrap">{bankAccount || 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Cheque Number',
        dataIndex: 'chequeNumber',
        key: 'chequeNumber',
        render: chequeNumber => (
            <Typography.Text className="whitespace-nowrap">{chequeNumber || 'N/A'}</Typography.Text>
        ),
    },
    {
        title: 'Cheque Date',
        dataIndex: 'dateOfCheque',
        key: 'dateOfCheque',
        render: dateOfCheque =>
            dateOfCheque ? (
                <Typography.Text className="whitespace-nowrap">
                    {formatDate(dateOfCheque)}
                </Typography.Text>
            ) : (
                <Typography.Text className="whitespace-nowrap">N/A</Typography.Text>
            ),
    },
    {
        title: 'Due Date',
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: dueDate =>
            dueDate ? (
                <Typography.Text className="whitespace-nowrap">
                    {formatDate(dueDate)}
                </Typography.Text>
            ) : (
                <Typography.Text className="whitespace-nowrap">N/A</Typography.Text>
            ),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount, record) =>
            amount ? (
                <Typography.Text className="font-normal whitespace-nowrap">
                    {`₹ ${parseFloat(amount)
                        .toFixed(2)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
                </Typography.Text>
            ) : (
                <Typography.Text className="font-normal whitespace-nowrap">N/A</Typography.Text>
            ),
    },

    {
        title: ' Status',

        dataIndex: 'status',
        key: 'status',
        className: 'ant-table-tbody-ant-table-cell',
        render: status => {
            let colorClass = '';
            if (status === 'Cleared') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'Issued' || status === 'Presented') {
                colorClass = 'text-[#007BFF] bg-[#E0F3FF]';
            } else {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }
            const formattedStatus = formatText(status);
            return status ? (
                <Typography.Text
                    className={`${colorClass} font-normal px-3 py-1 rounded-2xl -ml-[.125rem] whitespace-nowrap`}
                >
                    {formattedStatus}
                </Typography.Text>
            ) : (
                <Typography.Text className="font-normal px-3 py-1 rounded-2xl -ml-[.125rem] whitespace-nowrap">
                    N/A
                </Typography.Text>
            );
        },
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        render: (text, record) => (
            <Space>
                <Button
                    onClick={() => handleDocDownload(record)}
                    className="border-0"
                    disabled={record.documentAvailability === 'NA' || loadingRows[record.id]}
                >
                    {loadingRows[record.id] ? (
                        <Spin size="small" className="text-xs" />
                    ) : (
                        <DownloadOutlined
                            className={`text-green-400 ${record.documentAvailability === 'NA' ? 'opacity-50' : ''}`}
                        />
                    )}
                </Button>

                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];
