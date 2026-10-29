import React from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { Formik } from 'formik';
import { ReactSVG } from 'react-svg';

import globalImg from '../../assets/icons/global.svg';
import CompanyDetailsForm from '../../forms/CompanyDetailsForm';
import useCompanyDetailsSubmit from '../../hooks/useCompanyDetailsSubmit';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { CompanyDetailsSchema } from '../../schema/CompanyDetailsSchema';
import CenteredHeader from '../shared/CenteredHeader';

interface BankAccountSetupProps {
    onSkip: () => void;
    onProceed: () => void;
}

const CompanyDetails: React.FC<BankAccountSetupProps> = ({ onSkip, onProceed }) => {
    const { handleSubmit } = useCompanyDetailsSubmit();
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: CompanyDetailsSchema,
    });

    return (
        <Formik
            initialValues={{
                registeredEmail: 'company@example.com',
                phoneNumber: '+60 12-345 6789',
                legalName: 'Peko Technologies Sdn Bhd',
                marketingName: 'Peko',
                businessWebsiteUrl: 'https://peko.com',
                averageTransactionValue: 'MYR 5,000',
                averageTransactionVolume: '100/month',
                internationalOrganizationType: 'Private Limited',
                communicationAddress: '',
                registeredAddress: '',
                settlementBankAccountDetails: '',
                proofOfRegisteredAddress: null,
                localTaxIdentifier: null,
                certificateOfIncorporation: null,
                boardResolution: null,
                beneficiaryOwnerInfo: null,
                pciDssCertification: null,
                settlementBankAccountProof: null,
                lobSpecificDocument: null,
                gstCertificate: null,
            }}
            validationSchema={CompanyDetailsSchema}
            // update the onSubmit function to handle form submission and proceed to the next step
            onSubmit={values => {
                handleSubmit(values);
                onProceed();
            }}
        >
            {({ handleSubmit: submitForm, setFieldTouched, values }) => (
                <>
                    {/* Scrollable form body */}
                    <Flex
                        vertical
                        style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 140px)' }}
                        className="pr-1 pt-4"
                    >
                        {/* Header */}
                        <CenteredHeader
                            icon={
                                <ReactSVG
                                    src={globalImg}
                                    beforeInjection={svg => {
                                        svg.setAttribute('width', '40');
                                        svg.setAttribute('height', '40');
                                    }}
                                />
                            }
                            outerClass="bg-[#F9F6F5] rounded-3xl"
                            title="Company Details"
                            description="Please provide your company information for international remittance setup"
                        />

                        <CompanyDetailsForm />
                    </Flex>

                    {/* Footer */}
                    <Flex
                        justify="flex-end"
                        gap={12}
                        className="border-t border-[#E4E4E7] pt-4 mt-4"
                    >
                        <Button
                            onClick={onSkip}
                            className="px-5 h-9 border-[#CBD5E1] text-[#475569]"
                        >
                            Back
                        </Button>
                        <Button
                            type="primary"
                            danger
                            icon={<ArrowRightOutlined />}
                            iconPosition="end"
                            onClick={() => handleFormSubmitWithAutoFocus(submitForm, setFieldTouched, values)}
                            className="px-5 h-9"
                        >
                            Submit Application
                        </Button>
                    </Flex>
                </>
            )}
        </Formik>
    );
};

export default React.memo(CompanyDetails);
