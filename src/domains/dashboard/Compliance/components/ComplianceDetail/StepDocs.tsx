import { useEffect, useMemo } from 'react';

import { Button, Flex, Form, Typography } from 'antd';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import { useAppDispatch } from '@src/hooks/store';

import DocUploadField, { DocFieldValue } from './DocUploadField';
import { SubmitDocumentItem } from '../../api';
import iconReceiptEdit from '../../assets/icons/icon-receipt-edit.svg';
import { SavedDocument, setComplianceDocuments } from '../../slices/complianceFormSlice';
import { complianceFormConfig } from '../../utils/complianceFormConfig';

const { Text } = Typography;

interface StepDocsProps {
    complianceType: string;
    onBack: () => void;
    onSubmit: (documents: SubmitDocumentItem[]) => void;
    isSubmitting?: boolean;
    savedDocuments?: SavedDocument[];
}

function AutoSaveDocs({ docs }: { docs: { key: string }[] }) {
    const { values } = useFormikContext<Record<string, DocFieldValue | ''>>();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const saved: SavedDocument[] = docs
            .filter(d => values[d.key] && (values[d.key] as DocFieldValue).base64)
            .map(d => ({ key: d.key, ...(values[d.key] as DocFieldValue) }));
        dispatch(setComplianceDocuments(saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(values)]);

    return null;
}

export default function StepDocs({ complianceType, onBack, onSubmit, isSubmitting, savedDocuments }: StepDocsProps) {
    const config = complianceFormConfig[complianceType];
    const docs = useMemo(() => config?.docs ?? [], [config]);

    const initialValues: Record<string, DocFieldValue | ''> = Object.fromEntries(
        docs.map(d => {
            const saved = savedDocuments?.find(s => s.key === d.key);
            return [d.key, saved ? { base64: saved.base64, name: saved.name, mimeType: saved.mimeType } : ''];
        })
    );

    const handleSubmit = (values: Record<string, DocFieldValue | ''>) => {
        const documents: SubmitDocumentItem[] = docs
            .filter(d => values[d.key] && (values[d.key] as DocFieldValue).base64)
            .map(d => ({ key: d.key, ...(values[d.key] as DocFieldValue) }));
        onSubmit(documents);
    };

    const validationSchema = useMemo(() => {
        const shape: Record<string, Yup.AnySchema> = {};
        docs.forEach(d => {
            if (d.required) {
                shape[d.key] = Yup.mixed()
                    .test('required', `${d.label} is required`, val => !!(val && (val as DocFieldValue).base64));
            }
        });
        return Yup.object().shape(shape);
    }, [docs]);

    return (
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ handleSubmit: formikSubmit }) => (
                <Form layout="vertical" onFinish={formikSubmit} className="w-full">
                    <AutoSaveDocs docs={docs} />
                    <Flex vertical gap={24} className="w-full">
                        <div className="border border-[#ebebeb] rounded-[22px] p-4 sm:p-6 w-full">
                            <Flex align="flex-start" gap={14} className="mb-5">
                                <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                    <img src={iconReceiptEdit} alt="" width={24} height={24} />
                                </div>
                                <Flex vertical gap={4}>
                                    <Text className="!text-[14px] !font-medium !text-black">
                                        Upload required documents
                                    </Text>
                                    <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                                        Accepted formats: PDF, JPG, PNG. Max size: 5MB per file
                                    </Text>
                                </Flex>
                            </Flex>

                            <Flex vertical gap={20} className="w-full">
                                {docs.map(doc => (
                                    <DocUploadField key={doc.key} name={doc.key} label={doc.label} required={doc.required} />
                                ))}
                            </Flex>
                        </div>

                        <Flex justify="flex-end" gap={10}>
                            <Button
                                onClick={onBack}
                                className="!h-10 !w-[118px] !rounded-lg !border-[#ff4f4f] !text-[#ff4f4f] !font-medium !text-[15px]"
                            >
                                Back
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isSubmitting}
                                className="!h-10 !w-[154px] !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[15px]"
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
