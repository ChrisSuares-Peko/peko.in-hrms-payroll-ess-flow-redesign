import React, { useEffect, useState } from 'react';

import {
    DeleteOutlined,
    DownloadOutlined,
    LoadingOutlined,
    PlusOutlined,
    EyeOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { Flex, Input, Table, Typography, Pagination, Badge, Button, Row, Col, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { DownloadType } from '@customtypes/general';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import DriverAssignedCell from '../components/DriverAssignedCell';
import MobileTable from '../components/MobileTable';
import VehicleRefreshAction from '../components/VehicleRefreshAction';
import useFilter from '../hooks/useFilter';
import useGetAllDriversApi from '../hooks/useGetAllDrivers';
import useManageFleetApi from '../hooks/useManageFleet';
import useRefreshVehicle from '../hooks/useRefreshVehicle';
import { resetInputParams, resetRcResponse } from '../slices/turboSlice';
import { filterState } from '../types/index';

const { Text, Paragraph } = Typography;

const ManageFleet = () => {
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [modalData, setModalData] = useState<any>();
    const navigate = useNavigate();
    const { xs } = useScreenSize();
    const today = dayjs();
    const dispatch = useDispatch();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        from: todayFormatted,
        to: todayFormatted,
    };
 
    const [filter, setFilter] = useState<filterState>(initialValues);
    const [isSearching, setIsSearching] = useState(false);
    const { searchText, updateSearchText } = useDebounceSearch(setFilter);
    const { fleet, count, isLoading, assignApi, unassignApi, setRefresh, deleteApi, downloadReport, refetch } =
        useManageFleetApi(filter);
    const { refreshVehicle, refreshingId } = useRefreshVehicle(refetch);

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSearching(true);
        updateSearchText(e);
    };

    useEffect(() => {
        if (!isLoading) setIsSearching(false);
    }, [isLoading]);

    const statusStyles = {
        ACTIVE: {
            text: '#16a34a',
            background: '#d1fae5',
        },
        INACTIVE: {
            text: '#B71215',
            background: '#FDECEC',
        },
        EXPIRING: {
            text: '#B78512',
            background: '#FDFDEC',
        },
    };

    function findColorByStatus(state: string) {
        const key = state?.toLowerCase();
        if (key === 'active') return statusStyles.ACTIVE;
        if (key === 'expiring soon') return statusStyles.EXPIRING;
        return statusStyles.INACTIVE;
    }

    const handleAddVehicleClick = () => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('add_vehicle_clicked');
        }
        dispatch(resetRcResponse());
        dispatch(resetInputParams());
        navigate(`${paths.dashboard.turbo}/${paths.turbo.addVehicle}`);
    };
    const handleDriverChange = async (driverId: string, vehicleId: string) => {
        const result = await assignApi({ driverId, vehicleId });

        if (result) {
            setRefresh(true);
            dispatch(
                showToast({
                    description: 'Driver assigned successfully',
                    variant: 'success',
                })
            );
        }

        // Logic to update the vehicle's driver (e.g., API call to save the driver assignment)
    };

    const handleDriverUnassign = async (assignmentId: string | number) => {
        const result = await unassignApi(assignmentId);

        if (result) {
            dispatch(
                showToast({
                    description: 'Driver unassigned successfully',
                    variant: 'success',
                })
            );
        }
    };

    const handleBulkUpload = () => {
        dispatch(
            showToast({
                description: `Coming Soon`,
                variant: 'info',
            })
        );
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (createdAt: any) => (
                <Flex vertical className="whitespace-nowrap">
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Vehicle Number',
            dataIndex: 'vehicleNumber',
            key: 'vehicleNumber',
            width: 140,
            render: (text: string) => <span className="whitespace-nowrap">{text}</span>,
        },
        {
            title: 'Make & Model',
            dataIndex: 'model',
            key: 'model',
            width: 200,
        },
        {
            title: 'Fuel Type',
            dataIndex: 'fuelType',
            key: 'fuelType',
            width: 110,
            render: (text: string) =>
                text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : 'N/A',
        },
        // {
        //     title: 'RC Status',
        //     dataIndex: 'rcStatus',
        //     key: 'rcStatus',
        //     render: (status: any) => 
        //         (
        //         <Flex>
        //             <Badge
        //                 status={status?.toLowerCase() !== 'active' ? 'error' : 'success'}
        //                 // eslint-disable-next-line no-unsafe-optional-chaining
        //                 text={status?.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
        //                 className="px-2 min-w-20 rounded-2xl"
        //                 style={{
        //                     color: findColorByStatus(status).text,
        //                     backgroundColor: findColorByStatus(status).background,
        //                     padding: '2px 7px',
        //                     borderRadius: '15px',
        //                 }}
        //             />
        //         </Flex>
        //     ),
        // },
        {
            title: 'Insurance',
            dataIndex: 'insuranceExpiry',
            key: 'insuranceExpiry',
            width: 140,
            render: (insuranceExpiry: any) => {
                let status = 'N/A';
                const expiryDate = dayjs(insuranceExpiry);
            
                if (!insuranceExpiry) {
                    return 'N/A';
                }
            
                if (!expiryDate.isValid()) {
                    return 'Invalid Date';
                }
            
                const daysToExpire = expiryDate.diff(today, 'day');
            
                if (expiryDate.isBefore(today, 'day')) {
                    status = 'Expired';
                } else if (daysToExpire <= 10) {
                    status = 'Expiring Soon';
                } else {
                    status = 'Active';
                }
            
                return (
                    <Flex>
                        <Badge
                            color={findColorByStatus(status).text}
                            text={status}
                            className="px-2 min-w-20 rounded-2xl"
                            style={{
                                color: findColorByStatus(status).text,
                                backgroundColor: findColorByStatus(status).background,
                                padding: '2px 7px',
                                borderRadius: '15px',
                            }}
                        />
                    </Flex>
                );
            }
        },
        {
            title: 'PUC',
            dataIndex: 'pucValidUpto',
            key: 'pucValidUpto',
            width: 140,
            render: (dateStr: any) => {
                const todays = new Date();
                const expiryDate = new Date(dateStr);
                const diffTime = expiryDate.getTime() - todays.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let statusText = '';
                let style = {
                    color: '#16a34a',
                    backgroundColor: '#d1fae5',
                    padding: '2px 7px',
                    borderRadius: '15px',
                };

                if (diffDays < 0) {
                    statusText = 'Expired';
                    style = {
                        color: '#B71215',
                        backgroundColor: '#FDECEC',
                        padding: '2px 7px',
                        borderRadius: '15px',
                    };
                } else if (diffDays <= 15) {
                    statusText = 'Expiring Soon';
                    style = {
                        color: '#B78512',
                        backgroundColor: '#FDFDEC',
                        padding: '2px 7px',
                        borderRadius: '15px',
                    };
                } else {
                    statusText = expiryDate.toLocaleDateString('en-IN');
                }

                return (
                    <Flex>
                        <Badge
                            color={style.color}
                            text={statusText}
                            className="px-2 min-w-20 rounded-2xl"
                            style={style}
                        />
                    </Flex>
                );
            },
        },

        {
            title: 'Driver Assigned',
            dataIndex: 'driver',
            key: 'driver',
            width: 200,
            render: (_: any, record: any) => (
                <div className="whitespace-nowrap">
                    <DriverAssignedCell
                        record={record}
                        drivers={drivers}
                        onAssign={handleDriverChange}
                        onUnassign={handleDriverUnassign}
                    />
                </div>
            ),
        },

        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Tooltip title="View">
                        <EyeOutlined
                            style={{ color: '#FF4F4F', cursor: 'pointer' }}
                            onClick={() =>
                                navigate(paths.turbo.viewDetails, { state: { key: record.id } })
                            }
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <DeleteOutlined
                            style={{ color: '#ff4d4f', cursor: 'pointer' }}
                            onClick={() => {
                                setModalData(record);
                                setOpenConfirmationModal(true);
                            }}
                        />
                    </Tooltip>
                    <VehicleRefreshAction
                        record={record}
                        refreshingId={refreshingId}
                        onRefresh={refreshVehicle}
                    />
                </div>
            ),
        },
    ];

    // You can handle API fetching here if needed for additional side effects
    const { drivers } = useGetAllDriversApi(filter);

   
    const { handleSearch, handlePageChange } = useFilter({
        setFilter,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const handleDelete = () => {
        deleteApi({ id: modalData!?.id }).then((res: any) => {
            if (res) {
                setRefresh(true);
                dispatch(
                    showToast({
                        description: 'Vehicle deleted successfully',
                        variant: 'success',
                    })
                );
            }
            setOpenConfirmationModal(false);
        });
    };
    return (
        <>
            <Flex vertical>
                {xs ? (
                    <div className="w-full space-y-4">
                        <Row gutter={[16, 16]} justify="space-between">
                            <Col xs={24} sm={24} md={12}>
                                <Paragraph className="mb-0 text-lg font-medium">
                                    Manage Fleet
                                </Paragraph>
                                <Paragraph type="secondary" className="mb-2">
                                    Manage your vehicles and assign drivers
                                </Paragraph>
                                <Row gutter={8} className='mt-3' >
                                    <Col>
                                        <Button
                                            type="primary"
                                            onClick={handleAddVehicleClick}
                                        >
                                            <PlusOutlined />
                                            Add Vehicle
                                        </Button>
                                    </Col>
                                    <Col>
                                        <Button
                                            className="h-9 border border-[#FF4F4F] text-[#FF4F4F] bg-transparent"
                                            onClick={handleBulkUpload}
                                        >
                                            Bulk Upload
                                        </Button>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <Row gutter={[12, 12]} align="middle">
                            <Col xs={24} sm={14}>
                                <Input
                                    placeholder="Search"
                                    suffix={isLoading || isSearching ? <LoadingOutlined spin /> : <SearchOutlined />}
                                    allowClear
                                    value={searchText}
                                    onChange={handleSearchInput}
                                    style={{
                                        borderTopRightRadius: 0,
                                        borderBottomRightRadius: 0,
                                        width: '100%',
                                    }}
                                />
                            </Col>
                            <Col xs={24} sm={10}>
                                <Button
                                    className="w-full h-9 border border-[#FF4F4F] text-[#FF4F4F] bg-transparent whitespace-nowrap"
                                    icon={<DownloadOutlined />}
                                    onClick={() => downloadReport(DownloadType.Csv, filter.searchText)}
                                >
                                    Download
                                </Button>
                            </Col>
                        </Row>
                    </div>
                ) : (

                    <><Flex className="flex-col justify-between w-full mt-3 md:flex-row md:mt-0">
                        {/* Title + Subtitle block */}
                        <Flex vertical className="w-full">
                            <Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                                Manage Fleet
                            </Text>
                            <Text className="mt-1 text-gray-400 text-medium">
                                Manage your vehicles and assign drivers
                            </Text>
                        </Flex>

                        {/* Button block */}
                        <Flex className="w-full mt-4 md:w-auto md:mt-0" gap={10}>
                            <Button
                                type="primary"
                                onClick={handleAddVehicleClick}
                            >
                                <PlusOutlined />
                                Add Vehicle
                            </Button>
                            <Button
                                className="h-9 border border-[#FF4F4F] text-[#FF4F4F] bg-transparent"
                                onClick={handleBulkUpload}
                            >
                                Bulk Upload
                            </Button>
                            <Button
                                className="h-9 border border-[#FF4F4F] text-[#FF4F4F] bg-transparent"
                                icon={<DownloadOutlined />}
                                onClick={() => downloadReport(DownloadType.Csv, filter.searchText)}
                            >
                                Download
                            </Button>
                        </Flex>
                    </Flex><Input
                            placeholder="Search"
                            suffix={isLoading || isSearching ? <LoadingOutlined spin /> : <SearchOutlined />}
                            allowClear
                            type="text"
                            className='mt-5'
                            maxLength={100}
                            value={filter.searchText}
                            onChange={handleSearch} /></>
                )}
            </Flex>
            {
                xs ? (
                    <MobileTable
                        isLoading={isLoading}
                        page={filter.page}
                        data={fleet}
                        count={count}
                        handlePageChange={handlePageChange}
                        drivers={drivers}
                        handleDriverChange={handleDriverChange}
                        handleDriverUnassign={handleDriverUnassign}
                        refreshingId={refreshingId}
                        onRefreshVehicle={refreshVehicle}
                    />

                ) : (
                    <Table
                        scroll={{ x: 1170 }}
                        loading={isLoading}
                        dataSource={fleet}
                        columns={columns}
                        pagination={false}
                        className="mt-5"
                    />
                )
            }


            <Pagination
                className="mt-10 text-center sm:text-end"
                total={count}
                current={filter.page}
                onChange={handlePageChange}
            />

            {openConfirmationModal && (
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this vehicle? This action will permanently remove the vehicle and its associated data (e.g., documents, driver assignment) from your fleet. "
                    handleSubmit={handleDelete}
                    isLoading={isLoading}
                />
            )}
        </>
    );
};

export default ManageFleet;
