import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createActivationCodeApi,
    updateActivationCodeApi,
    deleteCode,
} from '../../api/subscriptionCode';
import { NewActivationCode, SubscriptionCode } from '../../types/subscriptionCodes';

type Props = {
    handleCancel: () => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
};

const useUpdateCodes = ({ handleCancel, setRefresh }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const createActivationCode = useCallback(
        async (values: NewActivationCode) => {
            setIsLoading(true);
            delete values.activationCode;
            delete values.partnerId;
            const data: SubscriptionCode | false = await createActivationCodeApi({
                userId: id,
                userType: role,
                ...values,
            });
            if (data) {
                handleCancel();
                setRefresh(true);
                dispatch(
                    showToast({
                        description: `Activation code created successfully`,
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch, handleCancel, setRefresh]
    );

    const updateActivationCode = useCallback(
        async (values: NewActivationCode) => {
            setIsLoading(true);
            delete values.activationCode;
            delete values.partnerId;
            const data: SubscriptionCode | false = await updateActivationCodeApi({
                userId: id,
                userType: role,
                ...values,
            });
            if (data) {
                handleCancel();
                setRefresh(true);
                dispatch(
                    showToast({
                        description: `Activation code updated successfully`,
                        variant: 'success',
                    })
                );
            }
            setIsLoading(false);
        },
        [id, role, dispatch, handleCancel, setRefresh]
    );

    const deleteActivationCode = useCallback(
        async (rowId: number) => {
            setIsLoading(true);
            const data = await deleteCode({
                userId: id,
                userType: role,
                id: rowId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: data.message,
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
            setIsLoading(false);
            handleCancel();
        },
        [dispatch, id, role, setRefresh, handleCancel]
    );

    return {
        isLoading,
        createActivationCode,
        updateActivationCode,
        deleteActivationCode,
    };
};

export default useUpdateCodes;
