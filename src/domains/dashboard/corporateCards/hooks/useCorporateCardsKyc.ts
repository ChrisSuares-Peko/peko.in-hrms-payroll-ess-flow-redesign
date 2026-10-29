import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    CorporateCardRole,
    initiateKyc as initiateKycAction,
    setKycStage,
} from '../slices/corporateCardsSlice';

/**
 * Drives the KYC gate that precedes the Corporate Cards dashboard. State lives in Redux
 * (`reducer.corporateCards`) and is persisted, so a verified user is not re-gated on reload.
 *
 * Demo flow only:
 * - `initiateKyc(role)` stores the manually-chosen role and moves to 'submitted'. In production
 *   this opens the DigiLocker/KYC journey and the stage is derived from the user's real KYC status.
 * - `viewAs` is a temporary manual Admin/Cardholder selector; later this is derived from auth role.
 */
export const useCorporateCardsKyc = () => {
    const dispatch = useAppDispatch();
    const { kycStage, viewAs } = useAppSelector(state => state.reducer.corporateCards);

    return {
        stage: kycStage,
        viewAs,
        initiateKyc: (role: CorporateCardRole) => dispatch(initiateKycAction(role)),
        goToDashboard: () => dispatch(setKycStage('verified')),
    };
};
