import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DeviceList } from '../types/compatibleDeviceType';
import { countryList, DataOptions, regionList } from '../types/eSIM';
import { PayrollEmployee, PlanData, TopUpFormData } from '../types/index';
import { EsimOrderDetails, OrderDetailsPayload } from '../types/orderDetails';
import { ordersList, OrdersListPayload, topUpHistoryList } from '../types/ordersList';
import { PackageList, PackageListPayload } from '../types/packagesList';
import { getPlanDetailsResponse, TopUpPayload, TopUpPlanList } from '../types/TopUp';

export const getCountriesApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<countryList[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/eSIM/countries`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getRegionsApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<regionList[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/eSIM/regions`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPlansByRegion = async (payload: UserPayload & { regionCode: string }) => {
    try {
        const resp: SuccessGenericResponse<DataOptions> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/eSIM/plans/region/${payload.regionCode}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCompatibleDeviceList = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<DeviceList> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/eSIM/compatibleDevice`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPackagesList = async (payload: PackageListPayload) => {
    try {
        const resp: SuccessGenericResponse<PackageList> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/eSIM/packages?type=${payload.esimType}&country=${payload.countryCode}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getEmployees = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{ employees: PayrollEmployee[] }> =
            await ApiClient.get(
                `${payload.userType}/${payload.userId}/payroll/employee/current-employees?searchText=`
            );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOrdersList = async (payload: OrdersListPayload) => {
    try {
        const resp: SuccessGenericResponse<ordersList> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/eSIM/orderPackageList`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: 'DESC',
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    fromDate: payload.fromDate,
                    toDate: payload.toDate,
                },
            }
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOrderDetails = async (
    payload: OrderDetailsPayload & { country?: string }
) => {
    try {
        const countryParam = payload.country
            ? `&country=${encodeURIComponent(payload.country)}`
            : '';
        const resp: SuccessGenericResponse<EsimOrderDetails> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/eSIM/getEsimDetails?planId=${payload.planId}&iccidNo=${payload.iccid}&customerUid=${payload.customerUid}${countryParam}`
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getTopUpPackagesList = async (payload: TopUpPayload) => {
    try {
        const resp: SuccessGenericResponse<TopUpPlanList> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/eSIM/topup/plans/${payload.iccid}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPlansAndDetails = async (payload: UserPayload & { planId: string; country?: string }) => {
    try {
        const query = payload.country ? `?country=${encodeURIComponent(payload.country)}` : '';
        const resp: SuccessGenericResponse<getPlanDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/eSIM/planTopUp/${payload.planId}${query}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getQRcodeApi = async (payload: UserPayload & { iccid?: string; corporateTxnId?: string ,customerUid?:string}) => {
    try {
        const esimId = payload.corporateTxnId || payload.iccid;

        const resp: any =
            await ApiClient.get(
                `${payload.userType}/${payload.userId}/purchase/eSIM/getQrCode/${esimId}?customerUid=${payload.customerUid}`
            );

        return resp;
    } catch (err) {
        return null;
    }
};

export const getTopUpHistory = async (payload: OrdersListPayload & { iccid: string }) => {
    try {
        const resp: SuccessGenericResponse<topUpHistoryList> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/eSIM/topupList`,
            {
                params: {
                    iccid: payload.iccid,
                    searchText: payload.searchText,
                    sort: 'DESC',
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPlans = async (payload: UserPayload & countryList) => {
    try {
        const country = payload.country || 'India';
        const resp: SuccessGenericResponse<DataOptions> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/eSIM/plans/${country}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPlanDetails = async (payload: UserPayload & TopUpFormData) => {
    try {
        const resp: SuccessGenericResponse<PlanData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/eSIM/planDetails`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err: any) {
        return false;
    }
};
