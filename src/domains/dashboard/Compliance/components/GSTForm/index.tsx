import React from 'react';

import { Button, Flex } from 'antd';
import { Formik } from 'formik';

import DocumentUploadSection from './DocumentUploadSection';
import { gstInitialValues } from './gstInitialValues';
import GSTRegistrationSection from './GSTRegistrationSection';
import GSTReturnSection from './GSTReturnSection';
import { gstSchema } from './gstSchema';
import { GSTFormValues, GSTSubmitProps } from './gstTypes';
import GSTTypeSelection from './GSTTypeSelection';
import AuthorisedSignatorySection from '../ComplianceShared/AuthorisedSignatorySection';
import CompanyDetailsSection from '../ComplianceShared/CompanyDetailsSection';
import DeclarationSection from '../ComplianceShared/DeclarationSection';
import DirectorsSection from '../ComplianceShared/DirectorsSection';
import OfficeUseSection from '../ComplianceShared/OfficeUseSection';

const DOC_KEYS: (keyof GSTFormValues)[] = [
    'doc_companyPan',
    'doc_coi',
    'doc_moaAoa',
    'doc_boardResolution',
    'doc_signatoryKyc',
    'doc_addressProof',
    'doc_cancelledCheque',
    'doc_dsc',
    'doc_salesInvoices',
    'doc_purchaseInvoices',
    'doc_gstrReports',
];

const GSTForm: React.FC<GSTSubmitProps> = ({ item, onSubmit }) => {
    const handleSubmit = async (values: GSTFormValues) => {
        const companyInfo: Record<string, string> = {};

        const skipKeys = new Set<string>([
            ...DOC_KEYS,
            'gst_directors',
            'gst_signatories',
            'gst_selectedTypes',
            'ret_returnTypes',
        ]);

        // Scalar fields
        Object.entries(values).forEach(([key, value]) => {
            if (skipKeys.has(key)) return;
            if (typeof value === 'boolean') {
                companyInfo[key] = String(value);
            } else {
                companyInfo[key] = String(value ?? '');
            }
        });

        // Serialise array/object fields
        companyInfo.gst_directors = JSON.stringify(
            values.gst_directors.map(({ dscAvailable, ...rest }) => ({
                ...rest,
                dsc: dscAvailable,
            }))
        );
        companyInfo.gst_signatories = JSON.stringify(values.gst_signatories);
        companyInfo.gst_selectedTypes = values.gst_selectedTypes.join(',');
        companyInfo.ret_returnTypes = values.ret_returnTypes.join(',');

        // Build documents array (non-empty doc fields only)
        const documents = DOC_KEYS.filter((key) => !!values[key]).map((key) => ({
            key: key as string,
            base64: values[key] as string,
            fileName: key as string,
        }));

        await onSubmit({ companyInfo, documents });
    };

    return (
        <Formik
            initialValues={gstInitialValues}
            validationSchema={gstSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
            enableReinitialize
        >
            {({ values, submitForm, isSubmitting }) => (
                <Flex vertical gap={20}>
                    <OfficeUseSection />
                    <CompanyDetailsSection />
                    <DirectorsSection fieldName="gst_directors" />
                    <AuthorisedSignatorySection fieldName="gst_signatories" directorsFieldName="gst_directors" />
                    <GSTTypeSelection />
                    <GSTRegistrationSection />
                    <GSTReturnSection />
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

export default GSTForm;
