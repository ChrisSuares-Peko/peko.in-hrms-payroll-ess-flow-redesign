import React, { useState } from 'react';

import { Flex, Pagination } from 'antd';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { getOrderColumns } from './orderColumns';
import TopUpModal from './TopUpModal';
import { getOrderDetails } from '../../api/index';
import usePayment from '../../hooks/useTopupPayment';

type Props = {
    data: any;
    totalRecord: number;
    isLoading: boolean;
    handlePageChange: (page: number, itemsPerPage: number) => void;
    filter: { searchText: string; page: number; itemsPerPage: number };
};

const OrderTable = ({ data, handlePageChange, totalRecord, isLoading, filter }: Props) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [openModal, setOpenModal] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<any>();
    const [selectedDetails, setSelectedDetails] = useState<any>();

    const { handleSubmission } = usePayment();

    // Extract country from plan name pattern: "Country_DataGB_Days_d"
    const extractCountryFromPlanName = (planName: string): string => {
        if (!planName) return '';
        return planName.split('_')[0] || '';
    };

    const showPlanUnavailable = () => {
        dispatch(showToast({ description: 'Plan is not available', variant: 'error' }));
    };

    const handleView = (record: any) => {
        if (!record.planId) {
            showPlanUnavailable();
            return;
        }
        navigate(`${paths.esim.esimDetails}`, {
            state: {
                id: record.id,
                iccid: record.iccid,
                planId: record.planId,
                customerUid: record.customerUid,
                corporateTxnId: record.orderId,
                country: record.country || record.countryName,
                purchasedFor: record.purchasedFor,
            },
        });
    };

    const handleTopUp = async (record: any) => {
        if (!record.planId) {
            showPlanUnavailable();
            return;
        }

        let country =
            record.country || extractCountryFromPlanName(record.plan) || record.countryName || '';

        if (!country) {
            try {
                const res = await getOrderDetails({
                    userType: role,
                    userId: id,
                    planId: record.planId,
                    iccid: record.iccid,
                    customerUid: record.customerUid,
                });

                country = res && res.countryName ? res.countryName : '';
            } catch (err) {
                console.error('Failed to fetch country', err);
            }
        }

        setSelectedPlanId(record.planId);
        setSelectedDetails({ ...record, country: country || '' });
        setOpenModal(true);

        const details = {
            url: `${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.orders}`,
            service: 'eSim',
        };
        sessionStorage.setItem('ESIM', JSON.stringify(details));
    };

    const handleTopUpSubmit = async (
        selectedData: string,
        selectedValidity: string,
        selectedCountry: string
    ) => {
        if (!selectedCountry || !selectedData || !selectedValidity) {
            return;
        }

        const postData = {
            orders: [
                {
                    country: selectedCountry,
                    data: Number(selectedData) * 1024,
                    validity: Number(selectedValidity),
                    quantity: 1,
                    iccid: selectedDetails.iccid ?? '',
                },
            ],
        };

        handleSubmission(postData);
        setOpenModal(false);
    };

    const columns = getOrderColumns({ onView: handleView, onTopUp: handleTopUp });

    return (
        <Flex vertical>
            <GenericTable
                rowKey={record => record.id}
                bordered={false}
                className="w-full"
                columns={columns}
                dataSource={data || []}
                pagination={false}
                loading={isLoading}
                scroll={{ x: 'max-content' }}
            />

            {data?.length > 0 && (
                <Pagination
                    className="sm:text-end text-center mt-10"
                    current={filter.page}
                    size="small"
                    total={totalRecord}
                    onChange={(page, pageSize) => {
                        if (page !== filter.page) handlePageChange(page, pageSize);
                        else handlePageChange(1, pageSize);
                    }}
                />
            )}
            {openModal && (
                <TopUpModal
                    handleCancel={() => setOpenModal(false)}
                    handleSubmit={handleTopUpSubmit}
                    planId={selectedPlanId}
                    isLoading={false}
                    isOpen={openModal}
                    country={selectedDetails.country}
                    iccid={selectedDetails.iccid}
                />
            )}
        </Flex>
    );
};

export default OrderTable;
