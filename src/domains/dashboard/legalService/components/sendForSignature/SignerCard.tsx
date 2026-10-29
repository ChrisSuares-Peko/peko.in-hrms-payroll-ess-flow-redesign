import { useEffect, useState } from 'react';

import { DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Flex, Form, Input, Typography } from 'antd';
import { Formik, useFormikContext } from 'formik';
import { ReactSVG } from 'react-svg';

import useScreenSize from '@src/hooks/useScreenSize';

import INDFlag from '../../assets/icons/INflag.svg';
import signVerifiedGreen from '../../assets/icons/signVerified.svg';
import signVerifiedYellow from '../../assets/icons/signVerifiedYellow.svg';
import { signerSchema } from '../../schema/signerSchema';

export type SigningPolicy = 'QUICKSIGN' | 'AADHAAR';

const ESIGN_TYPE_OPTIONS: { value: SigningPolicy; label: string }[] = [
    { value: 'QUICKSIGN', label: 'Normal eSign' },
    { value: 'AADHAAR', label: 'Aadhaar-based eSign' },
];

export interface SignerValues {
    name: string;
    email: string;
    phone: string;
    signingPolicy: SigningPolicy;
}

interface SignerCardProps {
    index: number;
    values: SignerValues;
    fieldsCount: number;
    isExpanded: boolean;
    onExpand: () => void;
    onChange: (values: SignerValues) => void;
    onDelete?: () => void;
    hasError?: boolean;
    otherEmails?: string[];
}

const InnerCard = ({
    index,
    fieldsCount,
    isExpanded,
    onExpand,
    onChange,
    onDelete,
    hasError,
}: Omit<SignerCardProps, 'values' | 'otherEmails'>) => {
    const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext<SignerValues>();
    const { md } = useScreenSize();
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        setIsTouchDevice('ontouchstart' in document.documentElement);
    }, []);


    const canDrag = Boolean(values.name && values.email && !errors.name && !errors.email);

    const handleDragStart = (e: React.DragEvent) => {
        if (!canDrag) { e.preventDefault(); return; }
        const dragImage = document.createElement('div');
        dragImage.style.cssText = `width:110px;height:40px;background:transparent;position:absolute;top:-9999px;pointer-events:none;`;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        e.dataTransfer.setData('signerField', JSON.stringify({ type: 'new', signerIndex: index }));
        e.dataTransfer.setData('startX', e.clientX.toString());
        e.dataTransfer.setData('startY', e.clientY.toString());
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const hasFormError = hasError || (touched.name && !!errors.name) || (touched.email && !!errors.email);

    return (
        <Flex vertical className="w-full">
            <Flex className={`w-full rounded-[10px] border pt-3 px-5 pb-3 ${hasFormError ? 'border-[#FF3A3A]' : 'border-gray-200'}`}>
                <Flex className="flex-col w-full">
                    {/* Header */}
                    <Flex className="w-full cursor-pointer" justify="space-between" align="center" onClick={onExpand}>
                        <Flex align="center">
                            <Typography.Text className="font-medium">Signer {index + 1}</Typography.Text>
                            {!hasFormError && (
                                <Flex align="center" className="ml-2">
                                    <ReactSVG src={fieldsCount > 0 ? signVerifiedGreen : signVerifiedYellow} />
                                </Flex>
                            )}
                        </Flex>
                        {isExpanded && onDelete && index > 0 && (
                            <DeleteOutlined
                                onClick={e => { e.stopPropagation(); onDelete(); }}
                                className="text-base text-red-400 hover:text-red-500 cursor-pointer"
                            />
                        )}
                        {!(isExpanded && onDelete && index > 0) && (
                            isExpanded
                                ? <UpOutlined style={{ fontSize: 12, color: '#6B7280' }} />
                                : <DownOutlined style={{ fontSize: 12, color: '#6B7280' }} />
                        )}
                    </Flex>

                    {/* Expanded body */}
                    {isExpanded && (
                        <Flex className="flex-col mt-3">
                            <Form layout="vertical" className="w-full">
                                <Form.Item
                                    label="Recipient Name"
                                    required
                                    validateStatus={touched.name && errors.name ? 'error' : ''}
                                    help={touched.name && errors.name ? errors.name : undefined}
                                >
                                    <Input
                                        placeholder="Enter Recipient Name"
                                        value={values.name}
                                        onChange={e => { setFieldValue('name', e.target.value); onChange({ ...values, name: e.target.value }); }}
                                        onBlur={() => setFieldTouched('name', true)}
                                        maxLength={50}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Recipient Email"
                                    required
                                    validateStatus={touched.email && errors.email ? 'error' : ''}
                                    help={touched.email && errors.email ? errors.email : undefined}
                                >
                                    <Input
                                        placeholder="Enter Email"
                                        value={values.email}
                                        onChange={e => { setFieldValue('email', e.target.value); onChange({ ...values, email: e.target.value }); }}
                                        onBlur={() => setFieldTouched('email', true)}
                                        maxLength={100}
                                        autoComplete="off"
                                    />
                                </Form.Item>

                                <Flex vertical gap={12} className="mb-6">
                                    <Typography.Text
                                        style={{ fontFamily: 'Roboto', fontWeight: 600, fontSize: 15, lineHeight: '21px', color: '#314259' }}
                                    >
                                        Select eSign Type
                                    </Typography.Text>
                                    <Flex vertical gap={12}>
                                        {ESIGN_TYPE_OPTIONS.map(option => {
                                            const isSelected = values.signingPolicy === option.value;
                                            const selectSigningPolicy = () => {
                                                setFieldValue('signingPolicy', option.value);
                                                onChange({ ...values, signingPolicy: option.value });
                                            };
                                            return (
                                                <Flex
                                                    key={option.value}
                                                    align="center"
                                                    gap={12}
                                                    className="cursor-pointer"
                                                    onClick={selectSigningPolicy}
                                                >
                                                    <span
                                                        role="radio"
                                                        aria-checked={isSelected}
                                                        className="flex items-center justify-center rounded-full shrink-0"
                                                        style={{ width: 16, height: 16, boxSizing: 'border-box', border: `2px solid ${isSelected ? '#FF4F4F' : '#314259'}` }}
                                                    >
                                                        {isSelected && (
                                                            <span className="rounded-full" style={{ width: 8, height: 8, background: '#FF4F4F' }} />
                                                        )}
                                                    </span>
                                                    <Typography.Text
                                                        style={{ fontFamily: 'Roboto', fontWeight: 400, fontSize: 14, lineHeight: '21px', color: '#314259' }}
                                                    >
                                                        {option.label}
                                                    </Typography.Text>
                                                </Flex>
                                            );
                                        })}
                                    </Flex>
                                </Flex>

                                <Form.Item label="Phone Number (optional)">
                                    <Input
                                        placeholder="Phone Number"
                                        value={values.phone}
                                        onChange={e => { const v = e.target.value.replace(/\D/g, ''); setFieldValue('phone', v); onChange({ ...values, phone: v }); }}
                                        maxLength={10}
                                        className="p-0"
                                        prefix={
                                            <Flex align="center" gap={6} className="p-[.43rem] h-full border-e me-2 cursor-not-allowed">
                                                <img src={INDFlag} alt="" />
                                                <p>+91</p>
                                            </Flex>
                                        }
                                    />
                                </Form.Item>
                            </Form>

                            {canDrag && (
                                <Flex justify="center" align="center" vertical>
                                    <div
                                        draggable
                                        onDragStart={handleDragStart}
                                        className="p-2 w-full cursor-pointer"
                                        style={{ borderRadius: 0, borderWidth: 2, borderStyle: 'solid', borderColor: '#05BE63', backgroundColor: '#D9EECC' }}
                                    >
                                        <Flex justify="center" align="center">
                                            <Typography.Text className="font-medium text-[1rem] text-center">{`Signer ${index + 1}`}</Typography.Text>
                                        </Flex>
                                        <Flex justify="center" align="center">
                                            <Typography.Text className="font-normal text-[.75rem] text-[#8E8E8E] text-center">
                                                {isTouchDevice || !md
                                                    ? "(Double-tap the document and choose 'Signer' from the dropdown menu.)"
                                                    : '(Drag & drop to position)'}
                                            </Typography.Text>
                                        </Flex>
                                    </div>
                                </Flex>
                            )}
                        </Flex>
                    )}
                </Flex>
            </Flex>
            {hasFormError && (
                <Typography.Text className="text-[#FF3A3A] text-xs mt-1 ml-1">
                    Please fill the signer details
                </Typography.Text>
            )}
        </Flex>
    );
};

const SignerCard = ({ values, otherEmails = [], ...rest }: SignerCardProps) => (
    <Formik
        initialValues={values}
        validationSchema={signerSchema(otherEmails)}
        onSubmit={() => {}}
    >
        <InnerCard {...rest} />
    </Formik>
);

export default SignerCard;
