import { useState } from 'react';

import { Button, Col, Flex, Form, Row, Skeleton } from 'antd';
import { Dayjs } from 'dayjs';
import { Formik } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import DocsCard from './DocsCard';
import useEmployeeInfoApi from '../../hooks/employeeOnboardingHooks/useUpdateEmployeeApi';

type Props = {
    nextTab: (key: string) => void;
};

const Documents = ({ nextTab }: Props) => {
    const { updateDocumentInformation } = useEmployeeInfoApi();

    const [, setExpiryDate] = useState<Dayjs>();

    const { isLoading } = useAppSelector(state => state.reducer.employeeSettings);

    const handleFileChange = (docName: string, file: File) => {
        console.log(`File changed for ${docName}:`, file);
    };

    const handleDocumentsSubmit = async (values: any, formikBag: any) => {
        const documents = ['adharCardCopy', 'panCardCopy', 'offerLetter', 'nda'];

        let allValid = true;

        const employeeDocs = documents.reduce((acc: any[], docName) => {
            const file = values[docName];
            const expiryKey = `${docName}Expiry`;

            if (file && !values[expiryKey]) {
                formikBag.setFieldError(expiryKey, 'Please enter the expiry date');
                allValid = false;
            } else if (file) {
                acc.push({
                    name: docName,
                    url: { base64: file, format: 'pdf' },
                    expiryDate: values[expiryKey],
                });
            }
            return acc;
        }, []);

        if (allValid) {
            await updateDocumentInformation(employeeDocs);
            nextTab('5');
        } else {
            formikBag.setSubmitting(false);
        }
    };

    const handleExpiryDateChange = (date: Dayjs) => {
        setExpiryDate(date);
    };

    return isLoading ? (
        <Skeleton />
    ) : (
        <Flex vertical className="my-8" justify="center" align="middle">
            <Formik
                initialValues={{
                    adharCardCopy: null,
                    panCardCopy: null,
                    offerLetter: null,
                    nda: null,
                    adharCardCopyExpiry: null,
                    panCardCopyExpiry: null,
                    offerLetterExpiry: null,
                    ndaExpiry: null,
                }}
                onSubmit={handleDocumentsSubmit}
            >
                {({ handleSubmit, errors, touched }) => (
                    <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                        <Flex justify="center">
                            <Col span={16}>
                                <Row>
                                    {[
                                        {
                                            name: 'adharCardCopy',
                                            label: 'Adhar Card Copy',
                                            index: 0,
                                        },
                                        { name: 'panCardCopy', label: 'PAN Card Copy', index: 1 },
                                        { name: 'offerLetter', label: 'Offer Letter', index: 2 },
                                        { name: 'nda', label: 'NDA', index: 3 },
                                    ].map((doc, i) => (
                                        <Col xs={24} sm={12} key={i}>
                                            <Flex justify="start">
                                                <DocsCard
                                                    handleFileChange={handleFileChange}
                                                    name={doc.name}
                                                    onDateChange={handleExpiryDateChange}
                                                    label={doc.label}
                                                    error={errors[doc.name as keyof typeof errors]}
                                                    touched={
                                                        touched[doc.name as keyof typeof touched]
                                                    }
                                                    expiryError={
                                                        errors[
                                                            `${doc.name}Expiry` as keyof typeof errors
                                                        ]
                                                    }
                                                    expiryTouched={
                                                        touched[
                                                            `${doc.name}Expiry` as keyof typeof touched
                                                        ]
                                                    }
                                                />
                                            </Flex>
                                        </Col>
                                    ))}
                                </Row>
                                <Flex justify="space-between" className="mt-4">
                                    <Button
                                        onClick={() => nextTab('3')}
                                        type="default"
                                        danger
                                        className="font-semibold w-[8rem]"
                                    >
                                        Back
                                    </Button>

                                    <Button
                                        htmlType="submit"
                                        type="primary"
                                        danger
                                        className="font-semibold w-[8rem]"
                                    >
                                        Next
                                    </Button>
                                </Flex>
                            </Col>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default Documents;
