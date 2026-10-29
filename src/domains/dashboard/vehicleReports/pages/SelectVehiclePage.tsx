import { Flex } from 'antd';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import AnotherVehicleBanner from '../components/selectVehicle/AnotherVehicleBanner';
import FleetVehiclePicker from '../components/selectVehicle/FleetVehiclePicker';
import ReportPageHeader from '../components/shared/ReportPageHeader';
import useFleetVehicles from '../hooks/useFleetVehicles';
import { setReportType, setSelectedVehicle } from '../slices/vehicleReportSlice';
import { SelectedVehicle, isReportType } from '../types/index';
import { reportMeta, vehicleReportsRoot } from '../utils/reportMeta';

// Vehicle picker shared by all three report flows. The report being bought comes
// from the `:reportType` route param, so this screen is deep-linkable and survives
// a refresh (unlike the Redux-only slice state).
const SelectVehiclePage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { reportType } = useParams();
    const { vehicles, isLoading } = useFleetVehicles();
    const selected = useAppSelector(state => state.reducer.vehicleReport.selectedVehicle);

    // A typo in the URL would otherwise fall through to an empty page.
    if (!isReportType(reportType)) {
        return <Navigate to={vehicleReportsRoot} replace />;
    }

    const meta = reportMeta[reportType];

    const continueWith = (vehicle: SelectedVehicle) => {
        dispatch(setReportType(reportType));
        dispatch(setSelectedVehicle(vehicle));
        // A manually entered vehicle has no registration number yet — the form on the
        // next step collects it — so the URL recovery hint is omitted rather than blank.
        const hint = vehicle.vehicleNumber
            ? `&vehicle=${encodeURIComponent(vehicle.vehicleNumber)}`
            : '';
        navigate(`${vehicleReportsRoot}/${meta.formPath}?type=${reportType}${hint}`);
    };

    return (
        <Flex vertical gap={24}>
            <ReportPageHeader title={meta.title} subtitle={meta.subtitle} />

            <Flex vertical gap={20} className="mx-auto w-full max-w-[800px]">
                <FleetVehiclePicker
                    vehicles={vehicles}
                    isLoading={isLoading}
                    selectedNumber={selected?.vehicleNumber}
                    onSelect={continueWith}
                    onAddVehicle={() =>
                        navigate(`${paths.dashboard.turbo}/${paths.turbo.addVehicle}`)
                    }
                />
                {/* Straight through to the form, which collects the vehicle details
                    itself — there is no intermediate step for a manual entry. */}
                <AnotherVehicleBanner onEnterManually={() => continueWith({ isManual: true })} />
            </Flex>
        </Flex>
    );
};

export default SelectVehiclePage;
