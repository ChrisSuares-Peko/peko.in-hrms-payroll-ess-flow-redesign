import { Button, Card, Col, Flex, Image, Row, Typography } from 'antd';

import RegistrationTaxSection from './RegistrationTaxSection';
import RenewalCardsRow from './RenewalCardsRow';
import VehicleOverview from './VehicleOverview';
import VehicleRefreshButton from './VehicleRefreshButton';
import getVehicleImage from '../../utils/getVehicleImage';

const VehicleSummaryCard = ({
    verifyRcResponse,
    id,
    loading,
    vehicleDetails,
    registrationAndTaxDetails,
    onDelete,
    onAddVehicle,
    onEditServiceDates,
    onRefresh,
    isRefreshing,
}: any) => (
    <Card className="mt-4 rounded-xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
        <Flex
            justify="space-between"
            className="flex-col w-full gap-3 sm:flex-row sm:items-center"
        >
            <Typography.Text className="text-xl font-medium">
                {verifyRcResponse?.vehicleNumber}
            </Typography.Text>

            {id ? (
                <Flex className="flex-col w-full gap-3 sm:flex-row sm:w-fit sm:items-start">
                    <VehicleRefreshButton
                        lastRefreshedAt={verifyRcResponse?.lastRefreshedAt}
                        isRefreshing={isRefreshing}
                        onRefresh={onRefresh}
                    />
                    <Button
                        className="w-full px-6 sm:w-fit"
                        danger
                        onClick={onDelete}
                        loading={loading}
                    >
                        Delete Fleet
                    </Button>
                </Flex>
            ) : (
                <Button
                    className="w-full px-6 sm:w-fit"
                    type="primary"
                    onClick={onAddVehicle}
                    danger
                    loading={loading}
                >
                    Add Vehicle to Fleet
                </Button>
            )}
        </Flex>

        <Row gutter={[30, 10]} className="mt-5">
            <Col xs={24} xl={8} className="px-10 rounded-xl">
                <Flex
                    justify="center"
                    align="center"
                    className="px-5 rounded-xl"
                    style={{ height: '100%', minHeight: '200px', background: '#FBFBFB' }}
                >
                    <Image
                        src={getVehicleImage(
                            verifyRcResponse?.rawData?.body_type,
                            verifyRcResponse?.rawData?.class
                        )}
                        preview={false}
                    />
                </Flex>
            </Col>

            <Col xs={24} xl={16}>
                <Row gutter={[10, 10]}>
                    <RenewalCardsRow verifyRcResponse={verifyRcResponse} />
                    <>
                        <VehicleOverview vehicleDetails={vehicleDetails} />
                        <RegistrationTaxSection
                            verifyRcResponse={verifyRcResponse}
                            registrationAndTaxDetails={registrationAndTaxDetails}
                            onEdit={onEditServiceDates}
                        />
                    </>
                </Row>
            </Col>
        </Row>
    </Card>
);

export default VehicleSummaryCard;
