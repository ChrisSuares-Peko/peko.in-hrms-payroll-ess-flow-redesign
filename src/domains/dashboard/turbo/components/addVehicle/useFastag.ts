import { useEffect, useMemo, useState } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import usePaymentApi from '@src/domains/dashboard/billPayments/hooks/useFetchBillApi';
import useServiceProviderApi from '@src/domains/dashboard/billPayments/hooks/useServiceProviderApi';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import useFetchFastagBill from './useFetchFastagBill';
import { updateFleetFastag } from '../../api';

const useFastag = ({ verifyRcResponse, id, onSelectionChange }: any) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const {
        role,
        userId,
        fetching,
        billData,
        setBillData,
        fetchError,
        hasSavedProvider,
        runFetchBill,
    } = useFetchFastagBill(verifyRcResponse);

    const {
        serviceProviderData,
        isLoading: providersLoading,
        loadMoreServiceProviders,
        handleServiceProviderSearch,
        resetSearchIfDirty,
    } = useServiceProviderApi('Fastag');

    // Auto-fill (and lock) the FASTag registration with the vehicle's own number.
    const vehicleRegistration = verifyRcResponse?.vehicleNumber || '';

    const [showForm, setShowForm] = useState(!hasSavedProvider);
    const [registration, setRegistration] = useState(
        verifyRcResponse?.fastagRegistration || vehicleRegistration
    );
    const [billerId, setBillerId] = useState<string | undefined>(
        verifyRcResponse?.fastagBillerId || undefined
    );
    const [providerLabel, setProviderLabel] = useState<string | undefined>(
        verifyRcResponse?.fastagProvider
    );
    const [submitting, setSubmitting] = useState(false);

    const { handlePayment, isLoading: rechargeLoading } = usePaymentApi();

    const selectedBiller = useMemo(
        () => serviceProviderData.find(p => p.value === billerId),
        [serviceProviderData, billerId]
    );

    // On the add-vehicle screen the fleet doesn't exist yet, so instead of a Submit
    // here the selection is lifted up and saved as part of "Add Vehicle to Fleet".
    useEffect(() => {
        if (!onSelectionChange) return;
        if (selectedBiller && registration.trim()) {
            onSelectionChange({
                fastagProvider: selectedBiller.label,
                fastagBillerId: selectedBiller.value,
                fastagRegistration: registration.trim(),
                fastagParamName:
                    (selectedBiller.customerParams as any[])?.[0]?.paramName ||
                    'Vehicle Registration Number',
            });
        } else {
            onSelectionChange(null);
        }
    }, [selectedBiller, registration, onSelectionChange]);

    const handleSubmit = async () => {
        if (!registration.trim()) {
            dispatch(
                showToast({
                    description: 'Please enter the vehicle registration number',
                    variant: 'error',
                })
            );
            return;
        }
        if (!selectedBiller) {
            dispatch(
                showToast({ description: 'Please select a service provider', variant: 'error' })
            );
            return;
        }
        const paramName =
            (selectedBiller.customerParams as any[])?.[0]?.paramName ||
            'Vehicle Registration Number';

        setSubmitting(true);
        const ok = await runFetchBill(selectedBiller.value, paramName, registration.trim());
        if (!ok) {
            setSubmitting(false);
            dispatch(
                showToast({
                    description:
                        'Unable to fetch FASTag details. Please check the details and try again.',
                    variant: 'error',
                })
            );
            return;
        }

        const res: any = await updateFleetFastag({
            userType: role,
            userId,
            id,
            fastagProvider: selectedBiller.label,
            fastagBillerId: selectedBiller.value,
            fastagRegistration: registration.trim(),
            fastagParamName: paramName,
        });
        setSubmitting(false);
        if (res) {
            // We already have the freshly fetched bill (billData) and the selected
            // provider, so switch straight to the details view without triggering a
            // full-page refetch — the FASTag section handles its own loading.
            setProviderLabel(selectedBiller.label);
            setShowForm(false);
        } else {
            dispatch(
                showToast({ description: 'Failed to save FASTag provider', variant: 'error' })
            );
        }
    };

    const handleChangeProvider = () => {
        setBillData(null);
        setShowForm(true);
    };

    const handleRecharge = async () => {
        // Fall back to the just-submitted state since verifyRcResponse isn't refetched after submit.
        const rechargeBillerId = verifyRcResponse?.fastagBillerId || billerId;
        const rechargeRegistration = verifyRcResponse?.fastagRegistration || registration.trim();
        const paramName =
            verifyRcResponse?.fastagParamName ||
            (selectedBiller?.customerParams as any[])?.[0]?.paramName ||
            'Vehicle Registration Number';
        const provider = verifyRcResponse?.fastagProvider || providerLabel;

        // No FASTag provider available at all — fall back to the utility FASTag form.
        if (!rechargeBillerId || !rechargeRegistration) {
            navigate(`${paths.dashboard.billPayments}/${paths.billPayments.fastag}`);
            return;
        }

        const biller: any = selectedBiller || {
            value: rechargeBillerId,
            label: provider,
            customerParams: [{ paramName }],
        };
        const values = {
            serviceProvider: rechargeBillerId,
            [paramName]: rechargeRegistration,
        };
        // Return to THIS vehicle's details page on Cancel/Back from the summary.
        const backPath = `${paths.dashboard.turbo}/${paths.turbo.manageFleet}/${paths.turbo.viewDetails}?id=${id}`;

        await handlePayment(values, accessKeys.fastag, provider, undefined, biller, backPath);
    };

    return {
        showForm,
        registration,
        setRegistration,
        registrationReadOnly: Boolean(vehicleRegistration),
        billerId,
        setBillerId,
        providerLabel,
        fetching,
        submitting,
        billData,
        fetchError,
        serviceProviderData,
        providersLoading,
        loadMoreServiceProviders,
        handleServiceProviderSearch,
        resetSearchIfDirty,
        handleSubmit,
        handleChangeProvider,
        handleRecharge,
        rechargeLoading,
    };
};

export default useFastag;
