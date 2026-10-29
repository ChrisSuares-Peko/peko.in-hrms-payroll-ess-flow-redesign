import React, { useEffect, useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tooltip, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import AirlineAirportModal from './AirlineAirportModal';
import AirlineAirportsHeader from './AirlineAirportsHeader';
import useGetAirlineAirports from '../../hooks/airlineAirports/useGetAirlineAirports';
import useFilter from '../../hooks/useFilters';

const AirlineAirports = () => {
    const initialFilters = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'ASC',
        sortField: 'id',
    };
    const [filters, setFilters] = useState(initialFilters);
    const [openModal, setOpenModal] = useState(false);
    const [modalData, setModalData] = useState<any>(null);
    const [accessPermission, setAccessPermission] = useState<any>();

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Airline Airports');

    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { tableData, count, loading, setRefresh, addAirport, updatePriority } =
        useGetAirlineAirports(filters);
    const { handlePageChange, handleTableChange } = useFilter({ setFilters });

    const handleEdit = (record: any) => {
        setModalData(record);
        setOpenModal(true);
    };

    const handleSave = (values: any) => {
        updatePriority(modalData.id, values.priority);
    };

    const columns = [
        {
            title: 'Code',
            dataIndex: 'airportCode',
            sorter: true,
            key: 'airportCode',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Airport Name',
            dataIndex: 'airportName',
            sorter: true,
            key: 'airportName',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'City',
            dataIndex: 'cityName',
            sorter: true,
            key: 'cityName',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Country',
            dataIndex: 'countryName',
            sorter: true,
            key: 'countryName',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            sorter: true,
            key: 'priority',
            render: (val: number | null) => (
                <Typography.Text>{val != null ? val : '-'}</Typography.Text>
            ),
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (_: any, record: any) => (
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {!accessPermission?.update ? (
                            <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} />
                        ) : (
                            <EditOutlined
                                className="cursor-pointer"
                                onClick={() => handleEdit(record)}
                            />
                        )}
                    </span>
                </Tooltip>
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <AirlineAirportsHeader
                searchText={searchText}
                handleSearch={updateSearchText}
                setRefresh={setRefresh}
                onAdd={addAirport}
                isLoading={loading}
                accessPermission={accessPermission}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={loading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {openModal && modalData && (
                <AirlineAirportModal
                    open={openModal}
                    handleCancel={() => {
                        setOpenModal(false);
                        setModalData(null);
                    }}
                    data={modalData}
                    mode="edit"
                    onSave={handleSave}
                    isLoading={loading}
                />
            )}
        </Flex>
    );
};

export default AirlineAirports;
