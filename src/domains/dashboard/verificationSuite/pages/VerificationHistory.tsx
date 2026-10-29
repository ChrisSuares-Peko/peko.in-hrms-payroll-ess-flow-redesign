import React, { useState } from 'react';

import { Badge, Flex, Pagination, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import HistoryHeader from '../components/HistoryHeader';
import useFilter from '../hooks/useFilter';
import useHistoryApi from '../hooks/useHistoryApi';
import { setverificationResponse } from '../slices/verificationSlice';

const VerificationHistory = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const dispatch = useDispatch();
    const navigate = useNavigate();
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

    // Handling cases where last month has fewer days
    if (lastMonth.getDate() !== today.getDate()) {
        lastMonth.setDate(0);
    }
    const initialValues = {
        page: 1,
        itemsPerPage: 10,
        filter: '',
        status: 'ALL',
        // module: 'all',
        searchText: '',
        from: lastMonth.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
    };
    const [filters, setFilters] = useState(initialValues);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, count, history, downloadReport } = useHistoryApi(filters);

    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleChangeFilters,
    } = useFilter({
        setFilters,
        initalStartDate: filters.from,
        initalEndDate: filters.to,
    });

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
        if (formattedType === 'Director Verify DIN') {
            formattedType = "Director's DIN";
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

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
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
            title: 'Verification Type',
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
                    <Flex vertical gap={4} className="w-96">
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
                            className="flex items-center gap-1"
                        >
                            <div
                                className="px-2 rounded-2xl"
                                style={{
                                    color: findColorByStatus(normalizedStatus).text,
                                    backgroundColor: findColorByStatus(normalizedStatus).background,
                                    padding: '1px 9px',
                                    border: '1px solid transparent',
                                    borderRadius: '15px',
                                    lineHeight: '1.2',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                }}
                            >
                                {normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase()}
                            </div>
                        </Badge>
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
                            dispatch(setverificationResponse(record));
                            navigate(paths.verificationSuite.verificationDetails);
                        }}
                    >
                        View
                    </Typography.Text>
                </Flex>
            ),
        },
    ];
    return (
        <Flex vertical>
            <HistoryHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleChangeFilters={handleChangeFilters}
                handleDownloadReport={downloadReport}
            />
            <GenericTable
                rowKey={record => record.id}
                className="w-full"
                bordered={false}
                columns={columns}
                dataSource={history}
                pagination={false}
                scroll={{ x: 992 }}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-7"
                style={{ display: 'block' }}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default VerificationHistory;
