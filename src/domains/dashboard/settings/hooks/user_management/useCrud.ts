import { useState } from 'react';

import {
    freezeCardholderCards,
    getCardUsers,
} from '@src/domains/dashboard/corporateCards/api/admin/cardUsersApi';
import { getKybStatus } from '@src/domains/dashboard/corporateCards/api/admin/kybStatusApi';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import {
    chagneStatusSubCorporate,
    createSubCorporate,
    deleteSubCorporate,
    resendInvitation,
    updateSubCorporate,
    validateCreateSubCorporate,
} from '../../api/userManagement';
import { FormValues, SubCorporate } from '../../types/userManagement';

// The cardholders list is paginated; request the backend max so the delete check sees every member.
const CARDHOLDER_LOOKUP_SIZE = 100;


// Structural / system entries in serviceAccess that are not grantable services.
const NON_DELEGATABLE_LABELS = ['Dashboard', 'More Services', 'Need Help', 'Settings'];

interface userCrudProps {
    reloadTable: () => void;
    handleCancel: () => void;
    selectedRow?: SubCorporate;
}
export default function useCrud({ handleCancel, reloadTable, selectedRow }: userCrudProps) {
    const {  services  } = useAppSelector(state => state.reducer.subscriptions);
    // `services` above is the subscriptions slice; this one is the serviceAccess tree the sidebar renders.
    const { services: serviceTree } = useAppSelector(state => state.reducer.services);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const [isInitialSubmit, setIsInitialSubmit] = useState(true);
    // Set when a delete was refused because the user still holds live corporate cards.
    const [unableToDelete, setUnableToDelete] = useState(false);

    const validateBeforeCreateSubUser = async (values: FormValues) => {
        setIsLoading(true);

        const data: {} | false = await validateCreateSubCorporate({
            ...values,
        });

        if (data) {
            setIsInitialSubmit(false);
        }
        setIsLoading(false);
    };

    const createSubUser = async (values: FormValues & { services: { [key: string]: boolean } }) => {
        const serviceObj = values.services;
        const atleastOne = Object.values(serviceObj).some(value => value === true);
        if (!atleastOne) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Please select atleast one service',
                })
            );
            return;
        }
        setIsLoading(true);
        delete values.confirmemail;
        const serviceList = Object.keys(serviceObj)
            .map(key => ({
                label: key,
                hasAccess: serviceObj[key],
            }))
            .filter(permission => permission.hasAccess);

        const data = await createSubCorporate({
            ...values,
            name: values.name.trim(),
            services: serviceList,
        });

        if (data) {
            handleCancel();
            reloadTable();
            dispatch(
                showToast({
                    variant: 'success',
                    description: data.message,
                })
            );
        }
        setIsLoading(false);
    };

    const updateServiceAccess = async (values: { [key: string]: boolean }, subUserId: number) => {
        const atleastOne = Object.values(values).some(value => value === true);

        if (!atleastOne) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Please select atleast one service',
                })
            );
            return;
        }
        setIsLoading(true);

        const payload = Object.keys(values)
            .map(key => ({
                label: key,
                hasAccess: values[key],
            }))
            .filter(permission => permission.hasAccess);

        const data = await updateSubCorporate({
            services: payload,
            subUserId,
        });

        if (data) {
            dispatch(
                showToast({
                    variant: 'success',
                    description: data.message,
                })
            );
            handleCancel();
            reloadTable();
        }
        setIsLoading(false);
    };

    const deleteSubUser = async (subUserId: number) => {
        setIsLoading(true);
        const hasCorporateCards = (services?.userAccessibleServices || []).includes(
            accessKeys.corporateCards
        );
        // The cardholders API refuses a corporate with no live card application (never applied, or closed —
        // and closure has already frozen every card), so there is nothing to check or freeze; skip straight
        // to the delete. If the status lookup itself fails, fall through to the full check.
        const kybStatus = hasCorporateCards ? await getKybStatus(role, id) : false;
        const hasLiveCardAccount = !kybStatus || Boolean(kybStatus.data?.application);
        if (hasCorporateCards && hasLiveCardAccount) {
            const cardUsers = await getCardUsers(role, id, { itemsPerPage: CARDHOLDER_LOOKUP_SIZE });
            if (!cardUsers) {
                setIsLoading(false);
                dispatch(
                    showToast({
                        variant: 'error',
                        description: "Could not verify the user's cards. Please try again.",
                    })
                );
                return;
            }
            // Absent from the list means no Corporate Cards access, hence no cards — safe to delete.
            const cardUser = (cardUsers.data?.rows ?? []).find(
                row => String(row.id) === String(subUserId)
            );
            if ((cardUser?.cardCount ?? 0) > 0) {
                setIsLoading(false);
                handleCancel();
                setUnableToDelete(true);
                return;
            }
            await freezeCardholderCards(role, id, String(subUserId));
        }
        const data = await deleteSubCorporate(subUserId);

        if (data) {
            reloadTable();
            dispatch(
                showToast({
                    variant: 'success',
                    description: data.message,
                })
            );
        }
        handleCancel();
        setIsLoading(false);
    };

    const blockSubUser = async (subUserId: number, status: string) => {
        setIsLoading(true);
        const data: {} | false = await chagneStatusSubCorporate({ subUserId, status });

        if (data) {
            reloadTable();
            dispatch(
                showToast({
                    variant: 'success',
                    description: 'User status updated successfully',
                })
            );
        }
        handleCancel();
        setIsLoading(false);
    };

    const resendInvite = async (subUserId: number) => {
        setIsLoading(true);
        const data: {} | false = await resendInvitation(subUserId);

        if (data) {
            dispatch(showToast({ description: 'Resend successfully', variant: 'success' }));
        }
        setIsLoading(false);
    };

    // A corporate can delegate exactly what it can see: the live serviceAccess tree,
    // minus structural entries. Deriving it from a hardcoded catalogue left most
    // services undelegatable and drifted every time a new one shipped.
    // `label` is what the BE matches sub-user grants on, so it is always the stored
    // key — `alias` is an admin display-name override and must never be sent.
    const corporateServices = (serviceTree?.data ?? [])
        .filter(service => service.hasAccess)
        .filter(service => !NON_DELEGATABLE_LABELS.includes(service.label))
        .map(service => ({ label: service.label, display: service.alias || service.label }));

    const initialValues = !selectedRow
        ? {}
        : selectedRow.services.reduce((acc: { [key: string]: boolean }, service) => {
              acc[service.label] = service.hasAccess;
              return acc;
          }, {});

    return {
        validateBeforeCreateSubUser,
        isInitialSubmit,
        setIsInitialSubmit,
        createSubUser,
        updateServiceAccess,
        deleteSubUser,
        blockSubUser,
        resendInvite,
        isLoading,
        corporateServices,
        initialValues,
        unableToDelete,
        closeUnableToDelete: () => setUnableToDelete(false),
    };
}
