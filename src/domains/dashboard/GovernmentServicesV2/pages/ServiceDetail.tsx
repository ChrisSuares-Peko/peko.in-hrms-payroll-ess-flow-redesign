import { Col, Flex, Row, Skeleton, Typography } from 'antd';

import ServicePricingPanel from '../components/ServicePricingPanel';
import ServiceProfileForm from '../components/ServiceProfileForm';
import useGovtServicePayment from '../hooks/useGovtServicePayment';
import useServiceDetailActions from '../hooks/useServiceDetailActions';
import useServiceDetailData from '../hooks/useServiceDetailData';
import { isGstRegistrationService } from '../utils/gstForm';
import { ENTITY_TYPE_OPTIONS, ProfileValues } from '../utils/serviceDetailForm';

const { Title, Text } = Typography;

// Profile form (left) + pricing/payment (right). Page data (draft/profile/vendor-business
// resolution) lives in useServiceDetailData; PAN-verify and Continue live in
// useServiceDetailActions, since both need this hook's state as input.
const ServiceDetail = () => {
    const {
        userId,
        role,
        dispatch,
        selectedService,
        isFetching,
        resumeExisting,
        hasCheckedDraft,
        isVendorCatalogService,
        documents,
        statesList,
        isProfileLoading,
        profileValues,
        setProfileValues,
        fieldErrors,
        setFieldErrors,
        verifiedPan,
        setVerifiedPan,
        isPanPrefilled,
        setIsPanPrefilled,
        vendorBusinesses,
        selectedVendorBusinessId,
        handleSelectVendorBusiness,
    } = useServiceDetailData();

    const {
        variants,
        selectedVariantId,
        setSelectedVariantId,
        selectedVariant,
        govFee,
        pekoFee,
        totalAmount,
        isPricingLoading,
        proceedToPayment,
        isProceeding,
    } = useGovtServicePayment({ selectedService });

    const {
        isVerifyingPan,
        isPanVerified,
        showPanVerify,
        handleVerifyPan,
        onPanChange,
        isApplying,
        handleContinue,
    } = useServiceDetailActions({
        userId,
        role,
        dispatch,
        // Guarded by the !selectedService check below at the point these are actually called.
        selectedService: selectedService!,
        isVendorCatalogService,
        profileValues,
        setProfileValues,
        setFieldErrors,
        verifiedPan,
        setVerifiedPan,
        isPanPrefilled,
        setIsPanPrefilled,
        totalAmount,
        proceedToPayment,
        selectedVendorBusinessId,
    });

    // Holds the skeleton until the async resumeExisting draft check resolves, so the profile page
    // doesn't flash before getting redirected into the Trademark form.
    if (isFetching || (resumeExisting && !hasCheckedDraft)) {
        return <Skeleton active paragraph={{ rows: 10 }} className="p-4" />;
    }

    if (!selectedService) {
        return null;
    }

    const handleFieldChange = (field: keyof ProfileValues, value: string) => {
        setProfileValues(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Flex vertical gap={24} className="p-4">
            <Flex vertical gap={4}>
                <Title level={4} className="!mb-0">
                    {selectedService.name}
                </Title>
                <Text style={{ color: '#8C8C8C' }} className="text-base">
                    {selectedService.description}
                </Text>
            </Flex>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={14}>
                    <ServiceProfileForm
                        profileValues={profileValues}
                        onFieldChange={handleFieldChange}
                        onPanChange={onPanChange}
                        fieldErrors={fieldErrors}
                        isProfileLoading={isProfileLoading}
                        entityTypeOptions={ENTITY_TYPE_OPTIONS}
                        statesList={statesList}
                        showPanVerify={showPanVerify}
                        isPanVerified={isPanVerified}
                        isVerifyingPan={isVerifyingPan}
                        onVerifyPan={handleVerifyPan}
                        documents={documents}
                        showProposedNameFields={isGstRegistrationService(selectedService.serviceId)}
                        vendorBusinesses={vendorBusinesses}
                        selectedVendorBusinessId={selectedVendorBusinessId}
                        onSelectVendorBusiness={handleSelectVendorBusiness}
                    />
                </Col>

                <Col xs={24} lg={10}>
                    <ServicePricingPanel
                        variants={variants}
                        selectedVariantId={selectedVariantId}
                        onSelectVariant={setSelectedVariantId}
                        selectedVariant={selectedVariant}
                        isPricingLoading={isPricingLoading}
                        pekoFee={pekoFee}
                        govFee={govFee}
                        totalAmount={totalAmount}
                        isApplying={isApplying}
                        isProceeding={isProceeding}
                        onContinue={handleContinue}
                    />
                </Col>
            </Row>
        </Flex>
    );
};

export default ServiceDetail;
