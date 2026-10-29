import React from 'react';

import { Button, Flex } from 'antd';
import { Form, Formik , useFormikContext } from 'formik';

import DeducteeDetailsSection from './DeducteeDetailsSection';
import DocumentUploadSection from './DocumentUploadSection';
import TANRegistrationSection from './TANRegistrationSection';
import { tdsInitialValues } from './tdsInitialValues';
import TDSReturnSection from './TDSReturnSection';
import { tdsSchema } from './tdsSchema';
import { TDSFormValues, TDSSubmitProps } from './tdsTypes';
import TDSTypeSelection from './TDSTypeSelection';
import AuthorisedSignatorySection from '../ComplianceShared/AuthorisedSignatorySection';
import CompanyDetailsSection from '../ComplianceShared/CompanyDetailsSection';
import DeclarationSection from '../ComplianceShared/DeclarationSection';
import OfficeUseSection from '../ComplianceShared/OfficeUseSection';

const DOC_KEYS: (keyof TDSFormValues)[] = [
    'doc_tanLetter',
    'doc_challans',
    'doc_payrollReports',
    'doc_vendorReports',
    'doc_deducteePan',
    'doc_form16Files',
];

// Inner component so we can access formik context for conditional rendering
const TDSFormInner: React.FC<{ isSubmitting: boolean }> = ({ isSubmitting }) => {
    const { values } = useFormikContext<TDSFormValues>();
    const selectedTypes = values.tds_selectedTypes;
    const isTanReg = selectedTypes.includes('TAN_REG');
    const isTdsReturn = selectedTypes.includes('TDS_RETURN');
    const isNil = values.ret_returnTypes.includes('NIL');

    return (
        <Form>
            <Flex vertical gap={20}>
                <OfficeUseSection />

                <CompanyDetailsSection />

                <AuthorisedSignatorySection fieldName="tds_signatories" />

                <TDSTypeSelection />

                {isTanReg && <TANRegistrationSection />}

                {isTdsReturn && <TDSReturnSection />}

                {isTdsReturn && !isNil && <DeducteeDetailsSection />}

                <DocumentUploadSection />

                <DeclarationSection />

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                        size="large"
                        style={{ backgroundColor: '#ff4f4f', borderColor: '#ff4f4f', borderRadius: 10 }}
                    >
                        Submit TDS Form
                    </Button>
                </div>
            </Flex>
        </Form>
    );
};

const TDSForm: React.FC<TDSSubmitProps> = ({ item, onSubmit }) => {
    const handleSubmit = async (values: TDSFormValues) => {
        const companyInfo: Record<string, string> = {};
        const documents: { key: string; base64: string; fileName: string }[] = [];

        Object.entries(values).forEach(([key, value]) => {
            if (DOC_KEYS.includes(key as keyof TDSFormValues)) {
                return; // handled separately
            }

            if (Array.isArray(value)) {
                companyInfo[key] = JSON.stringify(value);
            } else if (typeof value === 'boolean') {
                companyInfo[key] = String(value);
            } else {
                companyInfo[key] = (value as string) ?? '';
            }
        });

        // Extract document fields
        DOC_KEYS.forEach((key) => {
            const raw = values[key] as string;
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(
                            (doc: { base64: string; name: string }, idx: number) => {
                                documents.push({
                                    key: `${key}_${idx}`,
                                    base64: doc.base64,
                                    fileName: doc.name,
                                });
                            },
                        );
                    } else {
                        documents.push({ key, base64: parsed.base64 ?? raw, fileName: parsed.name ?? key });
                    }
                } catch {
                    documents.push({ key, base64: raw, fileName: key });
                }
            }
        });

        await onSubmit({ companyInfo, documents });
    };

    return (
        <Formik<TDSFormValues>
            initialValues={tdsInitialValues}
            validationSchema={tdsSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
            enableReinitialize
        >
            {({ isSubmitting }) => <TDSFormInner isSubmitting={isSubmitting} />}
        </Formik>
    );
};

export default TDSForm;
