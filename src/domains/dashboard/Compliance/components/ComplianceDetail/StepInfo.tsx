import { useEffect, useMemo, useRef } from 'react';

import { Button, Flex, Form, Typography } from 'antd';
import { Formik, useFormikContext } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import iconReceiptEdit from '../../assets/icons/icon-receipt-edit.svg';
import { buildInfoSchema, buildInitialValues } from '../../schema/buildDynamicSchema';
import type { FieldDef } from '../../types/formConfig';
import { complianceFormConfig } from '../../utils/complianceFormConfig';
import DynamicFieldRenderer from '../ComplianceForm/DynamicFieldRenderer';

const { Text } = Typography;

type InfoValues = Record<string, string | string[] | boolean | Record<string, string | boolean>[]>;

interface StepInfoProps {
    complianceType: string;
    onBack: () => void;
    onContinue: (values: InfoValues) => void | Promise<void>;
    onChange?: (values: InfoValues) => void;
    savedValues?: InfoValues;
    rejectedFields?: string[];
    isContinuing?: boolean;
}

function AutoSaveInfo({ onChange }: { onChange: (values: InfoValues) => void }) {
    const { values } = useFormikContext<InfoValues>();
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onChange(values), 600);
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [values, onChange]);
    return null;
}

function groupFieldsBySection(fields: FieldDef[]): { section: string; fields: FieldDef[] }[] {
    const { order, map } = fields.reduce<{ order: string[]; map: Record<string, FieldDef[]> }>(
        (acc, field) => {
            const key = field.section ?? '';
            if (!acc.map[key]) {
                acc.map[key] = [];
                acc.order.push(key);
            }
            acc.map[key].push(field);
            return acc;
        },
        { order: [], map: {} },
    );
    return order.map(section => ({ section, fields: map[section] }));
}

export default function StepInfo({ complianceType, onBack, onContinue, onChange, savedValues, rejectedFields, isContinuing }: StepInfoProps) {
    const { user } = useAppSelector((state) => (state.reducer as any).user);
    const config = complianceFormConfig[complianceType];
    const schema = useMemo(() => buildInfoSchema(config?.fields ?? []), [config]);
    const initialValues = useMemo(
        () => ({ ...buildInitialValues(config?.fields ?? [], user), ...savedValues }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [complianceType],
    );

    const groups = groupFieldsBySection(config?.fields ?? []);
    const hasSections = groups.some(g => g.section !== '');

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={schema}
            onSubmit={onContinue}
            enableReinitialize
        >
            {({ handleSubmit }) => (
                <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                    {onChange && <AutoSaveInfo onChange={onChange} />}
                    <Flex vertical gap={16} className="w-full">
                        {rejectedFields && rejectedFields.length > 0 && (
                            <div className="bg-[#fff8f0] border border-[#ffd591] rounded-[12px] px-4 py-3">
                                <Text className="!text-[12px] !text-[#d46b08] !font-medium !block !mb-1">
                                    Fields flagged by admin for correction
                                </Text>
                                <Text className="!text-[13px] !text-[#7c4700]">
                                    {rejectedFields.map(key => config?.fields.find(f => f.key === key)?.label ?? key).join(', ')}
                                </Text>
                            </div>
                        )}

                        {hasSections ? groups.map((group, idx) => (
                            <div key={group.section} className="border border-[#ebebeb] rounded-[22px] p-4 sm:p-6 w-full">
                                <Flex align="flex-start" gap={14} className="mb-5">
                                    <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                        <img src={iconReceiptEdit} alt="" width={24} height={24} />
                                    </div>
                                    <Flex vertical gap={4}>
                                        <Text className="!text-[14px] !font-medium !text-black">
                                            {group.section || 'Fill in the required information'}
                                        </Text>
                                        {idx === 0 && (
                                            <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                                                All fields marked with * are mandatory
                                            </Text>
                                        )}
                                    </Flex>
                                </Flex>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 w-full items-start [&_.ant-form-item-label]:min-h-[62px] [&_.ant-form-item-label]:flex [&_.ant-form-item-label]:flex-col [&_.ant-form-item-label]:justify-end">
                                    {group.fields.map(field => (
                                        <div key={field.key} className={field.colSpan === 1 ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                                            <DynamicFieldRenderer field={field} isRejected={rejectedFields?.includes(field.key) ?? false} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="border border-[#ebebeb] rounded-[22px] p-4 sm:p-6 w-full">
                                <Flex align="flex-start" gap={14} className="mb-5">
                                    <div className="bg-[#fff4f4] rounded-[10px] p-[7px] shrink-0">
                                        <img src={iconReceiptEdit} alt="" width={24} height={24} />
                                    </div>
                                    <Flex vertical gap={4}>
                                        <Text className="!text-[14px] !font-medium !text-black">
                                            Fill in the required information
                                        </Text>
                                        <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">
                                            All fields marked with * are mandatory
                                        </Text>
                                    </Flex>
                                </Flex>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 w-full items-start [&_.ant-form-item-label]:min-h-[62px] [&_.ant-form-item-label]:flex [&_.ant-form-item-label]:flex-col [&_.ant-form-item-label]:justify-end">
                                    {(config?.fields ?? []).map(field => (
                                        <div key={field.key} className={field.colSpan === 1 ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                                            <DynamicFieldRenderer field={field} isRejected={rejectedFields?.includes(field.key) ?? false} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                loading={isContinuing}
                                className="!h-10 !w-[154px] !rounded-lg !bg-[#ff4f4f] !border-[#ff4f4f] !font-medium !text-[15px]"
                            >
                                Continue
                            </Button>
                        </Flex>
                    </Flex>
                </Form>
            )}
        </Formik>
    );
}
