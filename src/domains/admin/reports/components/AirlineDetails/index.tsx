import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Col, Collapse, Flex, Row, Skeleton, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import Additional from './Additional';
import DateTimeForm from './changedDate';
import ExistingBooking from './existingBooking';
import UploadNewTicket from './UploadNewTicket';
import useAirlineModificationDetails from '../../hooks/airline/useAirlineModificationDetails';

const AirlineDetails = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const { request: bookingId } = Object.fromEntries(queryParams.entries());
    const { data, isLoading, getAllTableData } = useAirlineModificationDetails(bookingId!);
    const customExpandIcon = (panelProps: { isActive?: boolean }) =>
        panelProps.isActive ? <DownOutlined /> : <RightOutlined />;
    const showUploadNewTicket =
        data?.modificationStatus === 'MODIFICATION_PAYMENT_COMPLETED' ||
        data?.modificationStatus === 'TICKETED' ||
        data?.modificationStatus === 'REQUESTED_FOR_CANCELLATION' ||
        data?.modificationStatus === 'MODIFICATION_REJECTED';

    let dynamicTitle = 'Upload New Ticket';
    if (data?.modificationStatus === 'TICKETED') dynamicTitle = 'Review Ticket';
    if (data?.modificationStatus === 'MODIFICATION_REJECTED') dynamicTitle = 'Review Payment';
    if (data?.modificationStatus === 'REQUESTED_FOR_CANCELLATION') dynamicTitle = 'Review Ticket';

    return (
        <Flex vertical gap={20}>
            <Typography.Text className="text-lg font-medium" style={{ margin: 0 }}>
                Modify Request
            </Typography.Text>
            {isLoading || !data ? (
                <Skeleton className="mt-10" paragraph={{ rows: 20 }} />
            ) : (
                <Flex vertical gap={20}>
                    <Collapse
                        expandIconPosition="end"
                        className="rounded-lg bg-[#F5F5F5]"
                        expandIcon={customExpandIcon}
                        // defaultActiveKey={['1']}
                        items={[
                            {
                                key: '1',
                                label: (
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        Primary Booking Details
                                    </Typography.Title>
                                ),

                                children: (
                                    <>
                                        <Row className="mt-2 w-full">
                                            <Col className="flex">
                                                <Typography.Text className="text-base font-light px-3">
                                                    Airline PNR:{' '}
                                                    <Typography.Text className="font-medium">
                                                        {
                                                            data?.flightBooking?.ticketDocument[0]
                                                                ?.airlineLocators[0]?.airlineLocator
                                                        }
                                                    </Typography.Text>
                                                </Typography.Text>
                                                <Typography.Text className="text-base font-light px-3">
                                                    Confirmation number:{' '}
                                                    <Typography.Text className="font-medium">
                                                        {data?.flightBooking?.bookingReferenceId}
                                                    </Typography.Text>
                                                </Typography.Text>
                                            </Col>
                                        </Row>
                                        <Row className="mt-3">
                                            <Col span={24}>
                                                <ExistingBooking
                                                    journey={data?.flightBooking?.journey}
                                                    bookingReferenceId={
                                                        data?.flightBooking?.bookingReferenceId
                                                    }
                                                    ticketDocument={
                                                        data?.flightBooking?.ticketDocument
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </>
                                ),
                            },
                        ]}
                    />
                    <Collapse
                        className="rounded-lg bg-[#F5F5F5]"
                        expandIconPosition="end"
                        expandIcon={customExpandIcon}
                        // defaultActiveKey={['1']}
                        items={[
                            {
                                key: '1',
                                label: (
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        Requested Modification Details
                                    </Typography.Title>
                                ),
                                children: (
                                    <Row className="">
                                        <Col span={24}>
                                            <DateTimeForm
                                                journey={data?.modificationRequestedJourney}
                                            />
                                        </Col>
                                    </Row>
                                ),
                            },
                        ]}
                    />

                    <Collapse
                        className="rounded-lg bg-[#F5F5F5]"
                        expandIconPosition="end"
                        expandIcon={customExpandIcon}
                        defaultActiveKey={
                            data.modificationStatus === 'MODIFICATION_REQUESTED' ? ['1'] : []
                        }
                        items={[
                            {
                                key: '1',
                                label: (
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        Update Price and Status
                                    </Typography.Title>
                                ),
                                children: (
                                    <Row className="">
                                        <Col span={24}>
                                            <Additional
                                                data={data}
                                                bookingId={bookingId!}
                                                getAllTableData={getAllTableData}
                                            />
                                        </Col>
                                    </Row>
                                ),
                            },
                        ]}
                    />
                    {showUploadNewTicket && (
                        <Collapse
                            className="rounded-lg bg-[#F5F5F5]"
                            expandIconPosition="end"
                            expandIcon={customExpandIcon}
                            defaultActiveKey={
                                data.modificationStatus === 'MODIFICATION_PAYMENT_COMPLETED'
                                    ? ['1']
                                    : []
                            }
                            items={[
                                {
                                    key: '1',
                                    label: (
                                        <Typography.Title level={5} style={{ margin: 0 }}>
                                            {dynamicTitle}
                                        </Typography.Title>
                                    ),
                                    children: (
                                        <Row className="">
                                            <Col span={24}>
                                                <UploadNewTicket
                                                    data={data}
                                                    bookingId={bookingId!}
                                                    getAllTableData={getAllTableData}
                                                />
                                            </Col>
                                        </Row>
                                    ),
                                },
                            ]}
                        />
                    )}
                </Flex>
            )}
        </Flex>
    );
};

export default AirlineDetails;
