import React from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import AdminCardDashboard from './AdminCardDashboard';
import CorporateCardDashboard from './CorporateCardDashboard';
import pineLabs from '../assets/pinelabs.png';
import GateSkeleton from '../components/common/GateSkeleton';
import {
    InitiateKyb,
    KybLanding,
    KybPending,
    KybRejected,
    KybSubmitted,
    KybVerified,
    UploadDocumentsKyb,
} from '../components/kyb/admin';
import { InitiateKyc, KycSubmitted } from '../components/kyc';
import { MembershipStatusScreen, RequestAccessLanding } from '../components/membership';
import { useCorporateCardsKyc } from '../hooks';
import { useCompleteKyb } from '../hooks/admin/useCompleteKyb';
import { useCorporateAgreement } from '../hooks/admin/useCorporateAgreement';
import { useKybDocumentChecklist } from '../hooks/admin/useKybDocumentChecklist';
import { useKybDocuments } from '../hooks/admin/useKybDocuments';
import { useKybStatusApi } from '../hooks/admin/useKybStatusApi';
import { useReopenKyb } from '../hooks/admin/useReopenKyb';
import { useSaveBusinessType } from '../hooks/admin/useSaveBusinessType';
import { useSubmitKybDocuments } from '../hooks/admin/useSubmitKybDocuments';
import { useInitiateKycApi } from '../hooks/user/useInitiateKycApi';
import { useKycStatusApi } from '../hooks/user/useKycStatusApi';
import { useMembershipRequest } from '../hooks/user/useMembershipRequest';
import { useRefreshMembership } from '../hooks/user/useRefreshMembership';
import { setKybStage } from '../slices/corporateCardsSlice';
import { actsAsAdminUi, holdsCardMembership, isAccountOwner } from '../utils/activeRole';
import { ADDRESS_PROOF_DOCUMENT, CORPORATE_AGREEMENT_DOCUMENT, KYB_UPLOAD } from '../utils/kybData';
import { MEMBERSHIP_STATUS_COPY } from '../utils/membershipData';

/**
 * Corporate Cards entry page.
 *
 * - Corporate (admin) users: KYB gate renders based on kybStage, synced from the real kyb-status API
 *   on mount; verified → admin dashboard.
 * - Sub-corporate users: KYC status is fetched on mount; gate renders based on current stage.
 */
const CorporateCardsPage = () => {
    const dispatch = useAppDispatch();
    const { stage } = useCorporateCardsKyc();
    const { handleInitiateKyc, submitLoading } = useInitiateKycApi();
    const { role, serviceMemberships, activeSubRole, employeeProfileId } = useAppSelector(
        state => state.reducer.auth
    );
    const { kybStage, businessType } = useAppSelector(state => state.reducer.corporateCards);

    const isCardholderView = !actsAsAdminUi({ role, serviceMemberships, activeSubRole });
    const isCardMember =
        isAccountOwner(role) || holdsCardMembership(role, employeeProfileId, serviceMemberships);

    const {
        request: membershipRequest,
        stage: membershipStage,
        isLoading: isMembershipLoading,
        isSubmitting,
        submitRequest,
    } = useMembershipRequest(isCardholderView && !isCardMember);
    const { refreshMembership, isRefreshing } = useRefreshMembership();

    const { isLoading: isStatusLoading } = useKycStatusApi(isCardholderView && isCardMember);

    const { isLoading: isKybLoading, refetch: refetchKybStatus } = useKybStatusApi(!isCardholderView);
    const checklist = useKybDocumentChecklist(!isCardholderView);
    const uploadDocuments = checklist.documentsFor(businessType ?? undefined);
    const isKybUploadStage = !isCardholderView && kybStage === 'upload';
    const kybDocuments = useKybDocuments(isKybUploadStage);
    const corporateAgreement = useCorporateAgreement(refetchKybStatus, isKybUploadStage);
    const { handleSubmit: handleSubmitKybDocuments, submitLoading: kybSubmitLoading } =
        useSubmitKybDocuments(
            values =>
                corporateAgreement.submitForVerification(
                    values['doc_corporate-agreement'],
                    kybDocuments.isSaved(CORPORATE_AGREEMENT_DOCUMENT)
                ),
            uploadDocuments.filter(doc => !kybDocuments.isSaved(doc))
        );
    const { handleSaveBusinessType, saveLoading: businessTypeLoading } = useSaveBusinessType();
    const { handleComplete } = useCompleteKyb();
    const { handleReopen, reopenLoading } = useReopenKyb();

    // Approval granted the membership on the employee's row, but every card route reads the session blob
    // written at login — so the session is rotated before KYC is opened, or the first call is refused.
    const handleEnterKyc = async () => {
        if (await refreshMembership()) handleInitiateKyc();
    };

    const handleGetStarted = () => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('corporate_cards_get_started');
        }
        dispatch(setKybStage('initiate'));
    };

    if (!isCardholderView) {
        if (isKybLoading) {
            return <GateSkeleton />;
        }
        if (kybStage === 'complete') return <AdminCardDashboard />;

        let kybContent: React.ReactNode = null;
        if (kybStage === 'landing') kybContent = <KybLanding onGetStarted={handleGetStarted} />;
        if (kybStage === 'initiate')
            kybContent = (
                <InitiateKyb
                    businessType={businessType ?? undefined}
                    options={checklist.options}
                    documentsFor={checklist.documentsFor}
                    isLoading={checklist.isLoading}
                    failed={checklist.failed}
                    onRetry={checklist.refetch}
                    submitLoading={businessTypeLoading}
                    onInitiate={handleSaveBusinessType}
                    onBack={() => dispatch(setKybStage('landing'))}
                />
            );
        if (kybStage === 'upload')
            kybContent = (
                <UploadDocumentsKyb
                    documents={uploadDocuments}
                    onBack={() => dispatch(setKybStage('initiate'))}
                    onSubmit={handleSubmitKybDocuments}
                    submitLoading={kybSubmitLoading || corporateAgreement.submitLoading}
                    uploadedDocuments={kybDocuments.uploaded}
                    documentStates={kybDocuments.states}
                    onDocumentSelected={kybDocuments.saveDocument}
                    onDocumentRemoved={kybDocuments.removeDocument}
                    isDocumentSaved={kybDocuments.isSaved}
                    restoring={kybDocuments.isLoading || checklist.isLoading}
                    restoreFailed={kybDocuments.restoreFailed}
                    onRetryRestore={kybDocuments.refetch}
                    agreement={{
                        ...corporateAgreement,
                        signedCopySaveState:
                            kybDocuments.states[CORPORATE_AGREEMENT_DOCUMENT.documentName],
                        signedCopyFileName: kybDocuments.uploaded[
                            CORPORATE_AGREEMENT_DOCUMENT.documentName
                        ]
                            ? (kybDocuments.uploaded[CORPORATE_AGREEMENT_DOCUMENT.documentName]
                                  .fileName ?? KYB_UPLOAD.savedFallbackName)
                            : undefined,
                        onSignedCopySelected: file =>
                            kybDocuments.saveDocument(CORPORATE_AGREEMENT_DOCUMENT, file),
                        onSignedCopyRemoved: () =>
                            kybDocuments.removeDocument(CORPORATE_AGREEMENT_DOCUMENT),
                        addressProofSaveState:
                            kybDocuments.states[ADDRESS_PROOF_DOCUMENT.documentName],
                        addressProofFileName: kybDocuments.uploaded[
                            ADDRESS_PROOF_DOCUMENT.documentName
                        ]
                            ? (kybDocuments.uploaded[ADDRESS_PROOF_DOCUMENT.documentName]
                                  .fileName ?? KYB_UPLOAD.savedFallbackName)
                            : undefined,
                        onAddressProofSelected: file =>
                            kybDocuments.saveDocument(ADDRESS_PROOF_DOCUMENT, file),
                        onAddressProofRemoved: () =>
                            kybDocuments.removeDocument(ADDRESS_PROOF_DOCUMENT),
                    }}
                />
            );
        if (kybStage === 'submitted') kybContent = <KybSubmitted />;
        if (kybStage === 'pending') kybContent = <KybPending />;
        if (kybStage === 'verified') kybContent = <KybVerified onGoToDashboard={handleComplete} />;
        if (kybStage === 'rejected')
            kybContent = <KybRejected onResubmit={handleReopen} resubmitLoading={reopenLoading} />;

        return (
            <div className="w-full overflow-y-auto px-1 sm:px-4 pb-6 pt-1 sm:pb-10 sm:pt-2">
                <div className="flex justify-end">
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] text-textGreyLight sm:text-xs">Issued by</span>
                        <img src={pineLabs} alt="Pine Labs" className="h-4 sm:h-5" />
                    </div>
                </div>
                {kybContent ?? <KybLanding onGetStarted={handleGetStarted} />}
            </div>
        );
    }

    if (isMembershipLoading || isStatusLoading) {
        return <GateSkeleton />;
    }

    // An employee who holds no card membership reached this page from the sidebar, which their employer's
    // completed onboarding put there. They ask for access here; the KYC gate below is for members only.
    if (!isCardMember) {
        return (
            <div className="w-full overflow-y-auto px-1 sm:px-4 pb-6 pt-1 sm:pb-10 sm:pt-2">
                <div className="flex justify-end">
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] text-textGreyLight sm:text-xs">Issued by</span>
                        <img src={pineLabs} alt="Pine Labs" className="h-4 sm:h-5" />
                    </div>
                </div>
                {membershipStage === 'request' ? (
                    <RequestAccessLanding onRequest={submitRequest} loading={isSubmitting} />
                ) : (
                    <MembershipStatusScreen
                        copy={MEMBERSHIP_STATUS_COPY[membershipStage]}
                        request={membershipRequest}
                        onAction={
                            membershipStage === 'approved' ? handleEnterKyc : submitRequest
                        }
                        actionLoading={
                            membershipStage === 'approved' ? isRefreshing : isSubmitting
                        }
                    />
                )}
            </div>
        );
    }

    const kycScreens: Record<string, React.ReactNode> = {
        initiate: <InitiateKyc onInitiate={handleInitiateKyc} loading={submitLoading} />,
        submitted: <KycSubmitted />,
    };

    if (kycScreens[stage])
        return (
            <div className="w-full overflow-y-auto px-1 sm:px-4 pb-6 pt-1 sm:pb-10 sm:pt-2">
                <div className="flex justify-end">
                    <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] text-textGreyLight sm:text-xs">Issued by</span>
                        <img src={pineLabs} alt="Pine Labs" className="h-4 sm:h-5" />
                    </div>
                </div>
                {kycScreens[stage]}
            </div>
        );

    return <CorporateCardDashboard />;
};

export default CorporateCardsPage;
