import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import InspectionPackageCard from '../components/inspection/InspectionPackageCard';
import RadioCardGroup from '../components/shared/RadioCardGroup';
import ReportPageHeader from '../components/shared/ReportPageHeader';
import ReportSectionCard from '../components/shared/ReportSectionCard';
import VehicleStripCard from '../components/shared/VehicleStripCard';
import useCarReportPlans from '../hooks/useCarReportPlans';
import { setInspectionCategory, setInspectionPackage } from '../slices/vehicleReportSlice';
import { InspectionPackage, VehicleCategory } from '../types/index';
import { inspectionCategoryOptions, inspectionPackages } from '../utils/data';
import { reportMeta, vehicleReportsRoot } from '../utils/reportMeta';

const meta = reportMeta.inspection;

// Step 1 of the inspection funnel: pick a vehicle category and an inspection package.
const InspectionServicePage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { priceFor, packageAvailable } = useCarReportPlans();
    const { selectedVehicle, inspectionPackage, inspectionCategory } = useAppSelector(
        state => state.reducer.vehicleReport
    );

    // Live price from the admin-managed plans, and only packages Droom can actually
    // book (active + product code configured) are offered — an unbookable one would
    // just auto-refund. Teasers (Health Report) are hidden for now.
    const packages = inspectionPackages
        .filter(pkg => !pkg.isTeaser && packageAvailable(pkg.id) !== false)
        .map(pkg => ({ ...pkg, price: priceFor('inspection', pkg.id) ?? pkg.price }));

    if (!selectedVehicle) {
        return (
            <Navigate
                to={`${vehicleReportsRoot}/inspection/${paths.turbo.selectVehicle}`}
                replace
            />
        );
    }

    const continueWith = (pkg: InspectionPackage) => {
        dispatch(setInspectionPackage(pkg));
        navigate(`${vehicleReportsRoot}/${paths.turbo.inspection}/${paths.turbo.inspectionBooking}`);
    };

    // One vendor sample serves every package — the ECO report format is the same.
    const viewSample = () =>
        window.open('/samples/inspection-sample-report.pdf', '_blank', 'noopener');

    return (
        <Flex vertical gap={24}>
            <ReportPageHeader title={meta.title} subtitle={meta.subtitle} />

            <Flex vertical gap={20}>
                <VehicleStripCard
                    vehicle={selectedVehicle}
                    actions={
                        <Button
                            danger
                            size="large"
                            onClick={() =>
                                navigate(
                                    `${vehicleReportsRoot}/inspection/${paths.turbo.selectVehicle}`
                                )
                            }
                        >
                            Change vehicle <ArrowRightOutlined />
                        </Button>
                    }
                />

                <ReportSectionCard title="Vehicle category">
                    <RadioCardGroup
                        options={inspectionCategoryOptions}
                        value={inspectionCategory}
                        onChange={value =>
                            dispatch(setInspectionCategory(value as VehicleCategory))
                        }
                    />
                </ReportSectionCard>

                <ReportSectionCard title="Select an inspection service">
                    <Row gutter={[20, 20]}>
                        {packages.map(pkg => (
                            <Col key={pkg.id} xs={24} md={12} xl={8}>
                                <InspectionPackageCard
                                    pkg={pkg}
                                    isSelected={inspectionPackage?.id === pkg.id}
                                    onContinue={() => continueWith(pkg)}
                                    onViewSample={viewSample}
                                />
                            </Col>
                        ))}
                    </Row>
                </ReportSectionCard>
            </Flex>
        </Flex>
    );
};

export default InspectionServicePage;
