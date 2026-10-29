import React from 'react';

import { Button, Flex } from 'antd';
import { Formik } from 'formik';

import { bankAccountInitialValues } from './bankAccountInitialValues';
import { bankAccountSchema } from './bankAccountSchema';
import { BankAccountFormValues, BankAccountSubmitProps } from './bankAccountTypes';
import BankRequirementsSection from './BankRequirementsSection';
import DocumentUploadSection from './DocumentUploadSection';
import AuthorisedSignatorySection from '../ComplianceShared/AuthorisedSignatorySection';
import CompanyDetailsSection from '../ComplianceShared/CompanyDetailsSection';
import DeclarationSection from '../ComplianceShared/DeclarationSection';
import DirectorsSection from '../ComplianceShared/DirectorsSection';
import OfficeUseSection from '../ComplianceShared/OfficeUseSection';

const DOC_KEYS: (keyof BankAccountFormValues)[] = [
    'doc_coi',
    'doc_moaAoa',
    'doc_companyPan',
    'doc_boardResolution',
    'doc_directorKyc',
    'doc_addressProof',
    'doc_directorList',
    'doc_specimenSignatures',
];

const BankAccountForm: React.FC<BankAccountSubmitProps> = ({ item, onSubmit }) => {
    const handleSubmit = async (values: BankAccountFormValues) => {
        const companyInfo: Record<string, string> = {};

        // Scalar string fields
        const skipKeys = new Set([...DOC_KEYS, 'bank_directors', 'bank_signatories', 'bank_preferredBanks', 'bank_additionalFacilities']);

        Object.entries(values).forEach(([key, value]) => {
            if (DOC_KEYS.includes(key as keyof BankAccountFormValues)) return;
            if (skipKeys.has(key)) return;
            companyInfo[key] = String(value);
        });

        // Serialise arrays
        companyInfo.bank_directors = JSON.stringify(values.bank_directors);
        companyInfo.bank_signatories = JSON.stringify(values.bank_signatories);
        companyInfo.bank_preferredBanks = values.bank_preferredBanks.join(',');
        companyInfo.bank_additionalFacilities = values.bank_additionalFacilities.join(',');

        // Serialise booleans explicitly
        companyInfo.bank_boardResolutionRequired = String(values.bank_boardResolutionRequired);
        companyInfo.bank_hasExistingResolution = String(values.bank_hasExistingResolution);
        companyInfo.bank_beneficialOwnershipRequired = String(values.bank_beneficialOwnershipRequired);
        companyInfo.bank_kycEnclosed = String(values.bank_kycEnclosed);

        // Build documents array
        const documents = DOC_KEYS.filter((key) => !!values[key]).map((key) => ({
            key: key as string,
            base64: values[key] as string,
            fileName: key as string,
        }));

        await onSubmit({ companyInfo, documents });
    };

    return (
        <Formik
            initialValues={bankAccountInitialValues}
            validationSchema={bankAccountSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
            initialTouched={Object.keys(bankAccountInitialValues).reduce<Record<string, boolean>>((acc, k) => { acc[k] = true; return acc; }, {})}
            validateOnMount={false}
            enableReinitialize
        >
            {({ submitForm, isSubmitting }) => (
                <Flex vertical gap={20}>
                    <OfficeUseSection />
                    <CompanyDetailsSection />
                    <DirectorsSection fieldName="bank_directors" />
                    <AuthorisedSignatorySection fieldName="bank_signatories" />
                    <BankRequirementsSection />
                    <DocumentUploadSection />
                    <DeclarationSection />

                    <Flex justify="flex-end">
                        <Button
                            type="primary"
                            size="large"
                            loading={isSubmitting}
                            onClick={submitForm}
                            className="!bg-[#ff4f4f] !border-[#ff4f4f] !rounded-[10px] !px-8 !font-semibold hover:!bg-[#e63c3c] hover:!border-[#e63c3c]"
                        >
                            Submit Application
                        </Button>
                    </Flex>
                </Flex>
            )}
        </Formik>
    );
};

export default BankAccountForm;
