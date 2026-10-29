import { ReactNode } from 'react';

import { CheckCircleFilled, FileTextOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Skeleton, Typography } from 'antd';

import ProfileField from './ProfileField';
import { VendorBusiness } from '../apis';
import { ProfileValues } from '../utils/serviceDetailForm';

const { Text } = Typography;

interface ServiceProfileFormProps {
    profileValues: ProfileValues;
    onFieldChange: (field: keyof ProfileValues, value: string) => void;
    onPanChange: (value: string) => void;
    fieldErrors: Record<string, string>;
    isProfileLoading: boolean;
    entityTypeOptions: { label: string; value: string }[];
    statesList: { label: string; value: string }[];
    showPanVerify: boolean;
    isPanVerified: boolean;
    isVerifyingPan: boolean;
    onVerifyPan: () => void;
    documents: string[];
    // GST Registration only (GST_Registration.pdf §A2) — shows Proposed/Alternate Name below the
    // usual profile fields. Not folded into a generic per-service field list since no other
    // service needs this yet; see GST_REGISTRATION_IMPLEMENTATION_PLAN.md §3.1 for the tradeoff.
    showProposedNameFields?: boolean;
    vendorBusinesses: VendorBusiness[];
    selectedVendorBusinessId: string | null;
    onSelectVendorBusiness: (applicationId: string) => void;
}

// ServiceDetail's left column: the profile form (prefilled from company/vendor-business data,
// see useServiceDetailData) plus the vendor's required-documents list for this service.
const ServiceProfileForm = ({
    profileValues,
    onFieldChange,
    onPanChange,
    fieldErrors,
    isProfileLoading,
    entityTypeOptions,
    statesList,
    showPanVerify,
    isPanVerified,
    isVerifyingPan,
    onVerifyPan,
    documents,
    showProposedNameFields = false,
    vendorBusinesses,
    selectedVendorBusinessId,
    onSelectVendorBusiness,
}: ServiceProfileFormProps) => {
    let panVerifySuffix: ReactNode;
    if (showPanVerify) {
        panVerifySuffix = isPanVerified ? (
            <CheckCircleFilled style={{ color: '#52c41a' }} />
        ) : (
            <Button
                type="text"
                size="small"
                loading={isVerifyingPan}
                onClick={onVerifyPan}
                style={{ color: '#FF3A3A', fontWeight: 500, paddingInline: 8 }}
            >
                Verify
            </Button>
        );
    }

    return (
        <Flex vertical gap={24}>
            <Flex
                vertical
                gap={20}
                className="px-4 py-6 rounded-lg"
                style={{ border: '1px solid #F0F0F0' }}
            >
                {isProfileLoading ? (
                    <Skeleton active title={false} paragraph={{ rows: 4 }} />
                ) : (
                    <>
                        {/* More than one business registered against this account — the corporate
                            picks which one explicitly instead of us guessing by name match. */}
                        {vendorBusinesses.length > 1 && (
                            <Row gutter={[16, 20]}>
                                <Col xs={24}>
                                    <ProfileField
                                        label="Select Business"
                                        value={selectedVendorBusinessId ?? ''}
                                        onChange={onSelectVendorBusiness}
                                        isSelect
                                        options={vendorBusinesses.map(b => ({
                                            label: b.business_name,
                                            value: String(b.application_id),
                                        }))}
                                        placeholder="Select the business to prefill from"
                                    />
                                </Col>
                            </Row>
                        )}
                        <Row gutter={[16, 20]}>
                            <Col xs={24} sm={12}>
                                <ProfileField
                                    label="Legal Business Name"
                                    value={profileValues.legalBusinessName}
                                    onChange={v => onFieldChange('legalBusinessName', v)}
                                    error={fieldErrors.legalBusinessName}
                                    placeholder="e.g., Peko Technologies Pvt Ltd"
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <ProfileField
                                    label="PAN"
                                    value={profileValues.pan}
                                    onChange={v => onPanChange(v.toUpperCase())}
                                    error={fieldErrors.pan}
                                    suffix={panVerifySuffix}
                                    placeholder="e.g., ABCDE1234F"
                                />
                            </Col>
                        </Row>
                        <Row gutter={[16, 20]}>
                            <Col xs={24} sm={12}>
                                <ProfileField
                                    label="Entity Type"
                                    value={profileValues.entityType}
                                    onChange={v => onFieldChange('entityType', v)}
                                    isSelect
                                    options={entityTypeOptions}
                                    error={fieldErrors.entityType}
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <ProfileField
                                    label="State of Registration"
                                    value={profileValues.stateOfRegistration}
                                    onChange={v => onFieldChange('stateOfRegistration', v)}
                                    isSelect
                                    options={statesList}
                                    error={fieldErrors.stateOfRegistration}
                                />
                            </Col>
                        </Row>
                        <Row gutter={[16, 20]}>
                            <Col xs={24} sm={12}>
                                <ProfileField
                                    label="Name"
                                    value={profileValues.name}
                                    onChange={v => onFieldChange('name', v)}
                                    error={fieldErrors.name}
                                    placeholder="e.g., Joseph Kumar"
                                />
                            </Col>
                            <Col xs={24} sm={12}>
                                <ProfileField
                                    label="Email"
                                    value={profileValues.email}
                                    onChange={v => onFieldChange('email', v)}
                                    error={fieldErrors.email}
                                    placeholder="e.g., joseph@example.com"
                                />
                            </Col>
                        </Row>
                        <Row gutter={[16, 20]}>
                            <Col xs={24} sm={12}>
                                <ProfileField
                                    label="Phone number"
                                    value={profileValues.phoneNumber}
                                    onChange={v => onFieldChange('phoneNumber', v)}
                                    error={fieldErrors.phoneNumber}
                                    placeholder="e.g., 9876543210"
                                />
                            </Col>
                        </Row>
                        {showProposedNameFields && (
                            <Row gutter={[16, 20]}>
                                <Col xs={24} sm={12}>
                                    <ProfileField
                                        label="Proposed Business Name"
                                        value={profileValues.proposedName}
                                        onChange={v => onFieldChange('proposedName', v)}
                                        error={fieldErrors.proposedName}
                                        placeholder="First preference trade name"
                                    />
                                </Col>
                                <Col xs={24} sm={12}>
                                    <ProfileField
                                        label="Alternate Name (optional)"
                                        value={profileValues.alternateName}
                                        onChange={v => onFieldChange('alternateName', v)}
                                        error={fieldErrors.alternateName}
                                        placeholder="Second preference, if the first is unavailable"
                                        required={false}
                                    />
                                </Col>
                            </Row>
                        )}
                    </>
                )}
            </Flex>

            {documents.length > 0 && (
                <Flex
                    vertical
                    gap={12}
                    className="p-4 rounded-lg"
                    style={{ border: '1px solid #F0F0F0' }}
                >
                    <Text strong className="text-base">
                        Required documents
                    </Text>
                    <Flex vertical gap={10}>
                        {documents.map((doc, i) => (
                            <Flex align="center" gap={8} key={i}>
                                <FileTextOutlined style={{ color: '#FF3A3A', fontSize: 15 }} />
                                <Text className="text-sm">{doc}</Text>
                            </Flex>
                        ))}
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
};

export default ServiceProfileForm;
