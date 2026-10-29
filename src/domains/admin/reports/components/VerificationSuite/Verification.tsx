import React, { useState } from 'react';

import { Badge, Flex, Pagination, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import Header from './Header';
import SuccessModal from './SuccessModal';
import useFilter from '../../hooks/useFilter';
import useHistoryApi from '../../hooks/useVerificationHistory';

export type DropDown = {
    value: number | string;
    label: string;
}[];

const Verification = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        category: '',
        sort: 'DESC',
        sortField: '',
        page: 1,
        status: 'ALL',
        itemsPerPage: 10,
        from: todayFormatted,
        to: todayFormatted,
        id: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
        handleCategoryFilters,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });
    const [price, setPrice] = useState({});
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, count, downloadReport, history } = useHistoryApi(filters);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const cancelModal = () => {
        setIsOpen(false);
    };

    const statusStyles = {
        VALID: {
            text: '#16a34a',
            background: '#d1fae5',
        },
        INVALID: {
            text: '#d97b7b',
            background: '#ffc2c2',
        },
    };
    function findColorByStatus(status: string) {
        let value = statusStyles.VALID;
        if (status === 'VALID' || status === 'INVALID') {
            value = statusStyles[status];
        }
        return value;
    }
    const formatVerificationType = (type: string, accessKey?: string): string => {
        if (!type || type.trim() === '') return 'N/A';

        // gstin_verify and gst_business_verify can both report the same raw
        // "GSTIN" type text, so accessKey is the only reliable way to tell them apart.
        if (accessKey === 'gst_business_verify') return 'GSTIN Business';

        const normalized = type.replace(/Aadhar/gi, 'Aadhaar').trim(); // Replace any casing of 'Adhar' with 'Aadhaar'
        const lower = normalized.toLowerCase();
        if (lower === 'pan') return 'PAN';
        if (lower === 'aadhaar') return 'Aadhaar';

        let formattedType = normalized.replace(/\bId\b/g, 'ID');
        if (formattedType === 'Director Verify CIN') {
            formattedType = "Director's CIN";
        }
        if (formattedType === 'GSTIN with PAN') {
            formattedType = 'Fetch GSTIN from PAN';
        }
        if (formattedType === 'Aadhaar Card') {
            formattedType = 'Aadhaar OKYC';
        }
        if (formattedType === 'Advance PAN Verification') {
            formattedType = 'Advance PAN';
        }

        return formattedType;
    };

    const knownAcronyms = ['PAN', 'CIN', 'DIN', 'DL', 'IFSC', 'GST', 'KYC'];

    function formatServiceField(text: any) {
        if (!text || typeof text !== 'string') return '';

        const upperText = text.toUpperCase();

        // Check if it's GSTIN or a known acronym
        if (upperText === 'GSTIN' || knownAcronyms.includes(upperText)) {
            return upperText;
        }

        // Special case: EPIC Number
        const normalized = text.trim().toLowerCase();
        if (normalized === 'epic_number') return 'EPIC Number';

        return text
            .replace(/_/g, ' ') // Replace underscores with spaces
            .toLowerCase() // Convert to lowercase
            .replace(/\b\w/g, (char: string) => char.toUpperCase()); // Capitalize each word
    }

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: (transactionDate: any) => (
                <Flex vertical>
                    <Typography.Text>
                        {formattedDateOnly(new Date(transactionDate))}
                    </Typography.Text>
                    <Typography.Text>{formattedTime(new Date(transactionDate))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Corporate ID',
            sorter: false,
            dataIndex: ['credential', 'username'],
            render: (data: any, record: any) => (
                <Typography.Text>{record?.credential?.username || 'N/A'}</Typography.Text>
            ),
        },
        {
            sorter: false,
            title: 'Corporate Name',
            dataIndex: ['credential', 'name'],
            render: (data: any, record: any) => (
                <Typography.Text>{record?.credential?.name || 'N/A'}</Typography.Text>
            ),
        },
        {
            sorter: false,

            title: 'Partner Name',
            dataIndex: ['credential', 'registeredByCredential'],
            render: (data: any, record: any) => (
                <Typography.Text>
                    {record?.credential?.registeredByCredential || '-'}
                </Typography.Text>
            ),
        },

        {
            title: 'Verification Type',
            sorter: true,
            dataIndex: 'verificationType',
            key: 'verificationType',
            render: (type: string, record: any) => (
                <Flex>
                    <Typography.Text>
                        {formatVerificationType(type, record?.accessKey)}
                    </Typography.Text>
                </Flex>
            ),
        },

        {
            title: 'Input Details',
            dataIndex: 'inputPayload',
            key: 'inputPayload',

            render: (inputPayload: any) => {
                if (!inputPayload || Object.keys(inputPayload).length === 0) {
                    return <Typography.Text>N/A</Typography.Text>;
                }

                const formatKey = (key: string) => {
                    if (key.toLowerCase() === 'dob') {
                        return 'DOB';
                    }
                    if (key === 'dl_number') {
                        return 'DL Number';
                    }

                    return formatServiceField(key === 'phone' ? 'Mobile Number' : key); // Default formatting
                };

                return (
                    <Flex vertical gap={4} className="w-56">
                        {Object.entries(inputPayload).map(([key, value]) =>
                            value ? (
                                <Typography.Text key={key}>
                                    {formatKey(key)}: {String(value)}
                                </Typography.Text>
                            ) : null
                        )}
                    </Flex>
                );
            },
        },

        {
            title: 'Result',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const normalizedStatus = status === 'VALID' ? 'VALID' : 'INVALID';
                return (
                    <Flex>
                        <Badge
                            status={normalizedStatus === 'VALID' ? 'success' : 'error'}
                            text={
                                normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase()
                            }
                            className="px-2 rounded-2xl"
                            style={{
                                color: findColorByStatus(normalizedStatus).text,
                                backgroundColor: findColorByStatus(normalizedStatus).background,
                                padding: '1px 9px',
                                border: '1px ',
                                borderRadius: '15px',
                            }}
                        />
                    </Flex>
                );
            },
        },
        {
            title: 'Actions',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: any) => (
                <Flex>
                    <Typography.Text
                        className="text-bgOrange2 cursor-pointer"
                        onClick={() => {
                            setIsOpen(true);
                            setPrice(record);
                        }}
                    >
                        View
                    </Typography.Text>
                </Flex>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                from={filters.from}
                to={filters.to}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleSearch={updateSearchText}
                searchText={searchText}
                handleChangeFilters={handleCategoryFilters}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={history}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {isOpen && (
                <SuccessModal isOpen={isOpen} handleCancel={cancelModal} responseData={price} />
            )}
        </Flex>
    );
};

export default Verification;
