import { useEffect, useState } from 'react';

import { Flex, Pagination } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import PaymentLinksHeader from '../components/Header';
import { ResendLinkModal } from '../components/ResendLinkModal';
import useFilter from '../hooks/useFilters';
import useGetPaymentLinks from '../hooks/useGetPaymentLinks';
import { RolePermissionAccessData } from '../types/common';
import PaymentLinkColumns from '../utils/PaymentLinkColumns';

const PaymentLinks = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    };
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLinkDetails, setSelectedLinkDetails] = useState(false);
    const [filters, setFilters] = useState(initialValues);
    const [tooltipText, setTooltipText] = useState('Copy to clipboard');
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Payment Links', 'Manage'); // Get the service
    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const {
        handlePageChange,
        handleTableChange,
        handleSearch,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const { isLoading, paymentLinksList, totalCount, downloadReport } = useGetPaymentLinks(filters);

    const columns = PaymentLinkColumns({
        tooltipText,
        setTooltipText,
        setSelectedLinkDetails,
        setModalVisible,
        accessPermission,
    });
    return (
        <Flex vertical gap={20}>
            <PaymentLinksHeader
                searchText={filters.searchText}
                handleSearch={handleSearch}
                accessPermission={accessPermission}
                downloadReport={downloadReport}
                from={filters.from}
                to={filters.to}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={paymentLinksList}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={totalCount as number}
                pageSize={initialValues.itemsPerPage}
                showSizeChanger={false}
            />
            <ResendLinkModal
                open={modalVisible}
                handleCancel={() => setModalVisible(false)}
                selectedLinkDetails={selectedLinkDetails}
            />
        </Flex>
    );
};

export default PaymentLinks;
