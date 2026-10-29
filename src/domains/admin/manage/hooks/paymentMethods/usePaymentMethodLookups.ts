import { useMemo } from 'react';

import useGetAllServiceOperators from '@src/domains/admin/settings/hooks/pekoCredits/useGetAllServiceOperators';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import useGetPaymentGateways from './useGetPaymentGateways';

const usePaymentMethodLookups = () => {
    const { partnerData, loading: partnersLoading } = usePartnersForCorporate('');
    const { gatewayOptions, gatewayLoading } = useGetPaymentGateways();
    const { serviceData, serviceOperatorLoading } = useGetAllServiceOperators();

    const serviceNameById = useMemo(
        () => new Map((serviceData ?? []).map(({ value, label }) => [Number(value), label])),
        [serviceData]
    );

    return {
        partnerOptions: partnerData,
        partnersLoading,
        gatewayOptions,
        gatewayLoading,
        serviceOptions: serviceData ?? [],
        servicesLoading: serviceOperatorLoading,
        serviceNameById,
    };
};

export type PaymentMethodLookups = ReturnType<typeof usePaymentMethodLookups>;

export default usePaymentMethodLookups;
