import React from 'react';

import { Button, Flex, Form } from 'antd';
import { Formik } from 'formik';


import ADT1Section from './ADT1Section';
import AnnualFilingSection from './AnnualFilingSection';
import DIR3KYCSection from './DIR3KYCSection';
import DocumentUploadSection from './DocumentUploadSection';
import DPT3Section from './DPT3Section';
import FilingSelectionSection from './FilingSelectionSection';
import { mcaInitialValues } from './mcaInitialValues';
import { mcaSchema } from './mcaSchema';
import { MCAFormValues, MCASubmitProps } from './mcaTypes';
import MSME1Section from './MSME1Section';
import OtherROCSection from './OtherROCSection';
import AuthorisedSignatorySection from '../ComplianceShared/AuthorisedSignatorySection';
import CompanyDetailsSection from '../ComplianceShared/CompanyDetailsSection';
import DeclarationSection from '../ComplianceShared/DeclarationSection';
import DirectorsSection from '../ComplianceShared/DirectorsSection';
import OfficeUseSection from '../ComplianceShared/OfficeUseSection';
import ShareholdersSection from '../ComplianceShared/ShareholdersSection';

const DOC_KEYS = [
    'doc_coi',
    'doc_moaAoa',
    'doc_adt1_boardResolution',
    'doc_adt1_consentLetter',
    'doc_financialStatements',
    'doc_auditorReport',
    'doc_directorsReport',
    'doc_agmNoticeMinutes',
    'doc_shareholdingPattern',
    'doc_dir3_directorKyc',
    'doc_dpt3_loanAgreements',
    'doc_msme_vendorInvoices',
    'decl_signature',
    'decl_companySeal',
];

export default function MCAForm({ item, onSubmit }: MCASubmitProps) {
    const handleSubmit = async (values: MCAFormValues) => {
        // Build companyInfo — all flat string fields
        const companyInfo: Record<string, string> = {};

        Object.keys(values).forEach((key) => {
            const val = values[key];
            if (DOC_KEYS.includes(key)) return;
            if (Array.isArray(val)) return;
            if (typeof val === 'boolean') {
                companyInfo[key] = String(val);
                return;
            }
            companyInfo[key] = val ?? '';
        });

        // Serialise array fields to JSON
        companyInfo.mca_directors = JSON.stringify(values.mca_directors);
        companyInfo.mca_shareholders = JSON.stringify(values.mca_shareholders);
        companyInfo.mca_signatories = JSON.stringify(values.mca_signatories);
        companyInfo.mca_selectedFilings = JSON.stringify(values.mca_selectedFilings);

        // Build documents array from doc_* fields (skip empty values)
        const documents: { key: string; base64: string; fileName: string }[] = [];
        DOC_KEYS.forEach((key) => {
            const base64 = values[key];
            if (base64 && typeof base64 === 'string' && base64.length > 0) {
                documents.push({ key, base64, fileName: key });
            }
        });

        await onSubmit({ companyInfo, documents });
    };

    return (
        <Formik
            initialValues={mcaInitialValues}
            validationSchema={mcaSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
        >
            {({ handleSubmit: formikSubmit, values }) => (
                <Form layout="vertical" onFinish={formikSubmit}>
                    <Flex vertical gap={24}>
                        <OfficeUseSection />

                        <CompanyDetailsSection />

                        <DirectorsSection fieldName="mca_directors" />

                        <ShareholdersSection fieldName="mca_shareholders" />

                        <AuthorisedSignatorySection fieldName="mca_signatories" />

                        <FilingSelectionSection />

                        {values.mca_selectedFilings.includes('ADT1') && <ADT1Section />}

                        {(values.mca_selectedFilings.includes('AOC4') ||
                            values.mca_selectedFilings.includes('MGT7')) && (
                            <AnnualFilingSection />
                        )}

                        {values.mca_selectedFilings.includes('DIR3KYC') && <DIR3KYCSection />}

                        {values.mca_selectedFilings.includes('DPT3') && <DPT3Section />}

                        {values.mca_selectedFilings.includes('MSME1') && <MSME1Section />}

                        {values.mca_selectedFilings.includes('OTHER') && <OtherROCSection />}

                        <DocumentUploadSection />

                        <DeclarationSection />

                        <Flex justify="flex-end" gap={10}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="!h-10 !px-8 !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[15px]"
                            >
                                Submit
                            </Button>
                        </Flex>
                    </Flex>
                </Form>
            )}
        </Formik>
    );
}
