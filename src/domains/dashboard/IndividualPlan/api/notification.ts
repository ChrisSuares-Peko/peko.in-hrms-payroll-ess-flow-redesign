import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export const getNotificationApi = async () => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `user/sub-corporate/send-notification`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

// export const checkNotificationExists= async ()=>{
//     try {
//         const resp: SuccessGenericResponse<{}> = await ApiClient.get(
//             `user/sub-corporate/check-notification`,
//         );
//         const data  = resp;
//         return data;
//     } catch (err) {
//         return false;
//     }
// }
