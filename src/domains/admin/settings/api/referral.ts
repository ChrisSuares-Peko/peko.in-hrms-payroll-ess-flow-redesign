import { SuccessGenericResponse, UserPayload } from "@customtypes/general";
import { ApiClient } from "@src/services/config";

export const getCodes = async (payload: UserPayload&{partnerId:any,searchText:string} ) => {
    try {
          if(payload.partnerId==='default')payload.partnerId=''
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/referralCodes/getCodes`,
            {
                params: {
                    partnerId:payload.partnerId,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};