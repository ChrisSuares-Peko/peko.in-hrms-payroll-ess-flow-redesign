import { useCallback, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { setUserInfo } from '@src/slices/userSlice';

import {
    verifyAdvancePan,
    verifyBankAccount,
    verifyBankIfsc,
    verifyBusinessGst,
    verifyCin,
    verifyCorporateEntity,
    verifyDirector,
    verifyDirectorDin,
    verifyGst,
    verifyGstPan,
    verifyGstReturn,
    verifyLicense,
    verifyPan,
    verifyPassport,
    verifyVoterId,
} from '../api';

export default function useVerifyApi(accessKeys: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const { user } = useAppSelector(state => state.reducer.user);
    const [resp, setResp] = useState<any>(null);

    const verifyBank = useCallback(
        async (values: any) => {
            setIsLoading(true);
            try {
                let data: any | false = null;

                if (accessKeys === 'bank_account_verify') {
                    data = await verifyBankAccount({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'ifsc_verify') {
                    data = await verifyBankIfsc({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'pan_verify') {
                    data = await verifyPan({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'advance_pan_verify') {
                    data = await verifyAdvancePan({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'dl_verify') {
                    data = await verifyLicense({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'gstin_pan') {
                    data = await verifyGstPan({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'cin_verify') {
                    data = await verifyCin({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'voter_id_verify') {
                    data = await verifyVoterId({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'passport_verify') {
                    data = await verifyPassport({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'gstin_verify') {
                    data = await verifyGst({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'corporate_verify') {
                    data = await verifyCorporateEntity({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'director_verify_cin') {
                    data = await verifyDirector({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'director_verify_din') {
                    data = await verifyDirectorDin({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'gst_business_verify') {
                    data = await verifyBusinessGst({
                        userId: id,
                        userType: role,
                        values,
                    });
                } else if (accessKeys === 'gst_return_check') {
                    data = await verifyGstReturn({
                        userId: id,
                        userType: role,
                        values,
                    });
                }

                if (data.status) {
                    setResp(data.data);
                }
                dispatch(
                    setUserInfo({ user: { ...user!, balance: data.data.corporateFinalBalance } })
                );

                return data.data;
            } catch (error) {
              
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [accessKeys, dispatch, user, id, role]
    );

    return { isLoading, verifyBank, resp };
}
