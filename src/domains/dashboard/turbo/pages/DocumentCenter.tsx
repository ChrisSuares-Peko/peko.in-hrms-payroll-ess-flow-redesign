import React from 'react';

import { Button, Col, Empty, Flex, Row, Skeleton, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import Documents from '../components/documents/Documents';
import useDocApi from '../hooks/useDocApi';
import useManageFleetApi from '../hooks/useManageFleet';
import { filterState } from '../types';

const DocumentCenter = () => {
    const navigate = useNavigate();
    const today = dayjs();

    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        from: todayFormatted,
        to: todayFormatted,
        // No paging UI on this screen — fetch the whole fleet and all documents (ticket 31002).
        pageSize: 500,
    };
   
   const filter: filterState = initialValues;
    const { doc, isLoading, isRefreshing, createDoc, deteteDoc, updateDoc } = useDocApi(filter);
    const { details } = useManageFleetApi(filter);

    const groupDocsByVehicle = (docs: any[]) => {
        const vehicleDocsMap: any = {};
        docs?.forEach(documents => {
            if (!vehicleDocsMap[documents.vehicleId]) {
                vehicleDocsMap[documents.vehicleId] = [];
            }
            vehicleDocsMap[documents.vehicleId].push(documents);
        });
        return vehicleDocsMap;
    };
    const vehicleDocsMap = groupDocsByVehicle(doc);

    return (
        <>
            <Flex vertical className="w-full">
                <Typography.Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                    Document Center
                </Typography.Text>
                <Typography.Text className="mt-1 text-gray-500 text-medium">
                    Upload and manage insurance, PUC, permits, and other essential documents to keep
                    your fleet compliant and up to date.
                </Typography.Text>
            </Flex>
            {isLoading ? (
                <Flex className="mt-10">
                    <Skeleton />
                </Flex>
            ) : (
                <Spin spinning={isRefreshing}>
                    {details && details.length > 0 ? (
                        <Row gutter={[20, 20]} className="mt-7">
                            <>
                                {details?.map((vehicle: any) => (
                                    <Col xs={24} xl={15}>
                                        <Documents
                                            key={vehicle.vehicleId}
                                            item={{
                                                vehicleId: vehicle.vehicleId,
                                                model: vehicle.model,
                                                vehicleNumber: vehicle.vehicleNumber,
                                                data: vehicleDocsMap[vehicle.vehicleId] || [], // If no docs uploaded yet, pass empty array
                                            }}
                                            createDoc={createDoc}
                                            deteteDoc={deteteDoc}
                                            updateDoc={updateDoc}
                                            // doc={doc}
                                        />
                                    </Col>
                                ))}
                            </>
                        </Row>
                    ) : (
                        <Flex vertical align="center" justify="center" className="mt-20 gap-4">
                            <Empty
                                description={
                                    <Typography.Text className="text-gray-500">
                                        No vehicles added yet. Add a vehicle to upload documents.
                                    </Typography.Text>
                                }
                            />
                            <Button
                                type="primary"
                                onClick={() =>
                                    navigate(
                                        `${paths.dashboard.turbo}/${paths.turbo.addVehicle}`,
                                    )
                                }
                            >
                                Add Vehicle
                            </Button>
                        </Flex>
                    )}
                </Spin>
            )}
        </>
    );
};

export default DocumentCenter;
