import { useState } from 'react';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';

import RequestModal from '../components/renewal/RequestModal';
import useRenewals from '../hooks/useRenewals';

const { Text } = Typography;

type RenewalRecord = {
    _id?: string;
    application_id?: string;
    renewal_type?: string;
    due_date?: string;
    status?: string;
    company?: {
        _id?: string;
        proposed_name?: string;
        country?: { name?: string };
        freezone?: string;
    };
    external_company?: {
        name?: string;
        country?: { name?: string };
        freezone?: string;
    };
    reference_id?: string;
};

export default function Renewals() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        searchText: '',
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, tableData, count, refetch } = useRenewals(filters);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    const formatLabel = (value?: string) => {
        if (!value) return 'N/A';
        return value
            .split('_')
            .map(word =>
                word.toUpperCase() === word ? word : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(' ');
    };

    const getCompanyName = (record: RenewalRecord) =>
        record.company?.proposed_name || record.external_company?.name || 'N/A';

    const getCountryOrRegion = (record: RenewalRecord) =>
        record.company?.country?.name || record.external_company?.country?.name || 'N/A';

    const columns = [
        {
            title: 'Renewal ID',
            dataIndex: 'application_id',
            key: 'application_id',
            render: (value: string) => <Text>{value || 'N/A'}</Text>,
        },
        {
            title: 'Company Name',
            key: 'company_name',
            render: (_: unknown, record: RenewalRecord) => <Text>{getCompanyName(record)}</Text>,
        },
        {
            title: 'Renewal Type',
            dataIndex: 'renewal_type',
            key: 'renewal_type',
            render: (value: string) => <Text>{formatLabel(value)}</Text>,
        },
        {
            title: 'Country / Region',
            key: 'country_region',
            render: (_: unknown, record: RenewalRecord) => (
                <Text>{getCountryOrRegion(record)}</Text>
            ),
        },
        {
            title: 'Due Date',
            dataIndex: 'due_date',
            key: 'due_date',
            render: (value: string) => (
                <Text>{value ? formattedDateTime(new Date(value)) : 'N/A'}</Text>
            ),
        },
        {
            title: 'Actions',
            dataIndex: '_id',
            key: 'id',
            render: (id: string) => (
                <Button
                    danger
                    type="default"
                    size="small"
                    disabled={!id}
                    onClick={() =>
                        navigate(
                            `${paths.dashboard.globalBusinessSetup}/${paths.globalBusinessSetup.renewals}/${paths.globalBusinessSetup.viewRequest}/${id}`
                        )
                    }
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <>
            {/* Header — matches the visual rhythm of Pending Applications /
                Ongoing Setups (no surrounding card / border). */}
            <Row justify="space-between" className="w-full gap-5">
                <Flex className="flex justify-start gap-3">
                    <Typography.Text className="text-lg font-medium">Renewals</Typography.Text>
                </Flex>
                <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                    <Input
                        placeholder="Search"
                        suffix={<SearchOutlined className="text-gray-400" />}
                        value={searchText}
                        onChange={updateSearchText}
                        allowClear
                        maxLength={100}
                    />
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        onClick={() => setIsRequestModalOpen(true)}
                    >
                        Add Proposal
                    </Button>
                </Flex>
            </Row>

            <GenericTable
                rowKey={(record: RenewalRecord) =>
                    record._id ||
                    record.reference_id ||
                    record.company?._id ||
                    getCompanyName(record)
                }
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                style={{ overflow: 'auto' }}
                scroll={{ x: 768 }}
            />

            <Pagination
                current={filters.page}
                size="default"
                className="md:text-end text-center mt-5"
                onChange={page => setFilters(prev => ({ ...prev, page }))}
                total={count}
                showSizeChanger={false}
            />

            <RequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSuccess={refetch}
            />
        </>
    );
}
