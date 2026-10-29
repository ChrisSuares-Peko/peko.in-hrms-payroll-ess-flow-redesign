import React, { useEffect, useRef } from 'react';

import { DeleteOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Form, Image, Row, Typography, Upload } from 'antd';
import dayjs from 'dayjs';
import { useFormikContext } from 'formik';
import { useLocation } from 'react-router-dom';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { LineItem } from './LineItems';
import { getPurchaseRequestById } from '../../../api';
import newRFQsIcon from '../../../assets/icons/newRFQsIcon.svg';
import { usePurchaseRequestApi } from '../../../hooks/usePurchaseRequestApi';
import { PurchaseRequestDetail } from '../../../types';

const { Text } = Typography;

type AttachmentFile = { fileName: string; fileBase64: string; fileFormat: string };
type PrAttachmentFile = { fileName: string; url: string };
type FormValues = { attachments: AttachmentFile[]; prAttachments: PrAttachmentFile[]; prRef: string; title: string; deadline: string; notes: string; lineItems: LineItem[] };

const PrAttachmentItem: React.FC<{ fileName: string; url: string; onRemove: () => void }> = ({ fileName, url, onRemove }) => (
    <Flex align="center" gap={10} style={{ padding: '10px 12px', background: '#fff', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)', borderRadius: 8 }}>
        <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18, flexShrink: 0 }} />
            <Text className="text-sm text-gray-700" ellipsis>{fileName}</Text>
        </a>
        <DeleteOutlined
            style={{ color: '#ff4d4f', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
            onClick={(e) => { e.preventDefault(); onRemove(); }}
        />
    </Flex>
);

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const BasicInformation: React.FC = () => {
    const dispatch = useAppDispatch();
    const { setValues, setFieldValue, values } = useFormikContext<FormValues>();
    const { dropdownData, fetchDropdownData } = usePurchaseRequestApi();
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const fromPR = (useLocation().state?.fromPR) as PurchaseRequestDetail | undefined;

    // Seeded with initial prRef — prevents enableReinitialize (EditRFQ) or fromPR from triggering full populate
    const prevPrRefRef = useRef(fromPR ? String(fromPR.id) : values.prRef);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

    // Mount: if prRef already set (draft restore with no existing prAttachments), load from PR.
    // Skip if prAttachments is already populated — edit mode seeds it from detail.attachments.
    useEffect(() => {
        if (!values.prRef || fromPR || values.prAttachments?.length > 0) return;
        (async () => {
            const pr = await getPurchaseRequestById({ corporateId: String(corporateId), id: values.prRef });
            if (pr) setFieldValue('prAttachments', pr.attachments?.map(a => ({ fileName: a.fileName, url: a.url })) ?? []);
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // User selects a PR from the dropdown: full populate (fields + attachments)
    useEffect(() => {
        if (values.prRef === prevPrRefRef.current) return;
        prevPrRefRef.current = values.prRef;
        if (!values.prRef) { setFieldValue('prAttachments', []); return; }

        const currentValues = values;
        (async () => {
            const pr = await getPurchaseRequestById({ corporateId: String(corporateId), id: currentValues.prRef });
            if (!pr) return;
            setFieldValue('prAttachments', pr.attachments?.map(a => ({ fileName: a.fileName, url: a.url })) ?? []);
            setValues({
                ...currentValues,
                title: currentValues.title || pr.title || '',
                deadline: pr.neededBy ? pr.neededBy.split('T')[0] : '',
                notes: pr.notes ?? '',
                lineItems: pr.lineItems?.length
                    ? pr.lineItems.map((li, i) => ({ key: String(i + 1), description: li.itemName, qty: li.qty, unit: li.unit || 'Unit', price: li.estUnitCost ?? '' }))
                    : currentValues.lineItems,
            });
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.prRef]);

    const handleBeforeUpload = (file: File) => {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            dispatch(showToast({ variant: 'error', description: 'Unsupported file type. Allowed: PDF, JPG, PNG.' }));
            return Upload.LIST_IGNORE;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            const format = file.name.split('.').pop() ?? '';
            setFieldValue('attachments', [...values.attachments, { fileName: file.name, fileBase64: base64, fileFormat: format }]);
        };
        reader.readAsDataURL(file);
        return false;
    };

    const handleRemoveUpload = (file: { name: string }): void => {
        setFieldValue('attachments', values.attachments.filter(a => a.fileName !== file.name));
    };

    return (
        <Card bordered={false} className="rounded-2xl mb-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 24 } }}>
            <Flex gap={14} align="center">
                <Flex align="center" justify="center" style={{ width: 37, height: 37, borderRadius: 10, background: '#fff4f4', flexShrink: 0 }}>
                    <Image src={newRFQsIcon} alt="New RFQ" width={24} height={24} preview={false} />
                </Flex>
                <Flex vertical justify="space-between" style={{ height: 35 }}>
                    <Text style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 500, fontSize: 14, lineHeight: '1.186', color: '#000' }}>Basic Information</Text>
                    <Text style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>Title, type, and submission deadline for this request</Text>
                </Flex>
            </Flex>
            <Divider style={{ margin: '12px 0', marginLeft: -24, width: 'calc(100% + 48px)', borderColor: '#f0f0f0' }} />

            <div className="[&_.ant-form-item]:!mb-3">
                <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                        <TextInput name="title" type="text" label="Title" placeholder="Enter the title" isRequired allowAlphabetsAndSpecialCharacters={[',', '.', '/', '-']} maxLength={50} />
                    </Col>
                    <Col xs={24} md={12}>
                        <SelectInputWithSearch name="prRef" label="Link to Purchase Request (optional)" placeholder="Select link" options={dropdownData.map(pr => ({ value: String(pr.id), label: pr.refNumber }))} />
                    </Col>
                </Row>

                <Row gutter={[16, 0]} style={{ marginBottom: -14 }}>
                    <Col xs={24} md={12}>
                        <DatePickerInput name="deadline" label="Submission Deadline" placeholder="Select date" classes="w-full" isRequired minDate={dayjs()} />
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item label="Attachments">
                            <Flex vertical gap={6}>
                                <Upload
                                    className="[&_.ant-upload-list-item-actions]:!opacity-100 [&_.ant-upload-list-item-action]:!opacity-100"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    style={{ width: '100%' }}
                                    fileList={values.attachments.map(a => ({ uid: a.fileName, name: a.fileName, status: 'done' as const }))}
                                    beforeUpload={handleBeforeUpload}
                                    onRemove={handleRemoveUpload}
                                >
                                    <Flex align="center" justify="space-between" className="border border-dashed border-gray-300 rounded-md py-1.5 px-3 bg-white cursor-pointer w-full">
                                        <Text className="text-sm text-gray-500">Upload File</Text>
                                        <Button size="small" type="default" className="rounded">Browse File</Button>
                                    </Flex>
                                </Upload>
                                {values.prAttachments?.map(a => (
                                    <PrAttachmentItem
                                        key={a.fileName}
                                        {...a}
                                        onRemove={() => setFieldValue('prAttachments', values.prAttachments.filter(p => p.fileName !== a.fileName))}
                                    />
                                ))}
                            </Flex>
                        </Form.Item>
                    </Col>
                </Row>
            </div>
        </Card>
    );
};

export default BasicInformation;
