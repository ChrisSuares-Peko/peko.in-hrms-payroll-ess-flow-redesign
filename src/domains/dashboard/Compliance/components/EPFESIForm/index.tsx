import React from 'react';

import { Button, Flex } from 'antd';
import { Form, Formik } from 'formik';

import DocumentUploadSection from './DocumentUploadSection';
import EmployeeDetailsSection from './EmployeeDetailsSection';
import { epfEsiInitialValues } from './epfEsiInitialValues';
import EPFESIRegistrationSection from './EPFESIRegistrationSection';
import EPFESIReturnSection from './EPFESIReturnSection';
import { epfEsiSchema } from './epfEsiSchema';
import { EPFESIFormValues, EPFESISubmitProps } from './epfEsiTypes';
import EPFESITypeSelection from './EPFESITypeSelection';
import AuthorisedSignatorySection from '../ComplianceShared/AuthorisedSignatorySection';
import CompanyDetailsSection from '../ComplianceShared/CompanyDetailsSection';
import DeclarationSection from '../ComplianceShared/DeclarationSection';
import OfficeUseSection from '../ComplianceShared/OfficeUseSection';

const DOC_KEYS: string[] = [
    'doc_employeeMaster',
    'doc_employeeKyc',
    'doc_uanIpList',
    'doc_salaryRegister',
    'doc_dsc',
];

const EPFESIForm: React.FC<EPFESISubmitProps> = ({ onSubmit }) => {
    const handleSubmit = async (values: EPFESIFormValues) => {
        const flat = values as Record<string, unknown>;
        const companyInfo: Record<string, string> = {};
        const documents: { key: string; base64: string; fileName: string }[] = [];

        Object.entries(flat).forEach(([key, value]) => {
            if (DOC_KEYS.includes(key)) return;

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
            const raw = flat[key] as string;
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(
                            (
                                doc: { base64: string; name: string },
                                idx: number,
                            ) => {
                                documents.push({
                                    key: `${key}_${idx}`,
                                    base64: doc.base64,
                                    fileName: doc.name,
                                });
                            },
                        );
                    } else {
                        documents.push({ key, base64: parsed.base64, fileName: parsed.name ?? key });
                    }
                } catch {
                    // Plain base64 string (single DocUploadField)
                    documents.push({ key, base64: raw, fileName: key });
                }
            }
        });

        await onSubmit({ companyInfo, documents });
    };

    return (
        <Formik<EPFESIFormValues>
            initialValues={epfEsiInitialValues}
            validationSchema={epfEsiSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
            enableReinitialize
        >
            {({ values, isSubmitting }) => {
                const selectedTypes = values.epf_selectedTypes ?? [];
                const isReg = selectedTypes.includes('EPF_ESI_REG');
                const isReturn = selectedTypes.includes('EPF_ESI_RETURN');

                return (
                    <Form>
                        <Flex vertical gap={20}>
                            {/* 1. Office use */}
                            <OfficeUseSection />

                            {/* 2. Company details */}
                            <CompanyDetailsSection />

                            {/* 3. Authorised signatory */}
                            <AuthorisedSignatorySection fieldName="epf_signatories" />

                            {/* 4. Type selection */}
                            <EPFESITypeSelection />

                            {/* 5. Registration section */}
                            {isReg && <EPFESIRegistrationSection />}

                            {/* 6. Return section */}
                            {isReturn && <EPFESIReturnSection />}

                            {/* 7. Employee details */}
                            {isReturn && <EmployeeDetailsSection />}

                            {/* 8. Documents */}
                            <DocumentUploadSection />

                            {/* 9. Declaration */}
                            <DeclarationSection />

                            {/* 10. Submit */}
                            <div className="flex justify-end">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isSubmitting}
                                    size="large"
                                    style={{
                                        backgroundColor: '#ff4f4f',
                                        borderColor: '#ff4f4f',
                                    }}
                                >
                                    Submit EPF / ESI Form
                                </Button>
                            </div>
                        </Flex>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default EPFESIForm;
