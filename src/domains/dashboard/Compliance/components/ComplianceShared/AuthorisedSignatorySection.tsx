import React, { useState } from 'react';

import { DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Flex, Row, Typography } from 'antd';
import { FieldArray, useFormikContext } from 'formik';

import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

import type { DirectorRow } from './DirectorsSection';

const { Text } = Typography;

export interface SignatoryRow {
    name: string;
    dinOrPan: string;
    designation: string;
    mobile: string;
    email: string;
    dscAvailable: string;
}

export const emptySignatory = (): SignatoryRow => ({
    name: '',
    dinOrPan: '',
    designation: '',
    mobile: '',
    email: '',
    dscAvailable: '',
});

interface Props {
    fieldName: string;
    directorsFieldName?: string;
    title?: string;
}

const AuthorisedSignatorySection: React.FC<Props> = ({
    fieldName,
    directorsFieldName,
    title = 'Authorised Signatory',
}) => {
    const { values, setFieldValue, setFieldTouched, setFieldError } = useFormikContext<Record<string, any>>();
    const rows: SignatoryRow[] = values[fieldName] ?? [];
    const directors: DirectorRow[] = directorsFieldName ? (values[directorsFieldName] ?? []) : [];
    const filledDirectors = directors.filter(d => d.directorName?.trim());

    // selectedDirectorIndex[signatoryIndex] = director index or null
    const [selectedDirector, setSelectedDirector] = useState<Record<number, number | null>>({});

    const signatoryFields = ['name', 'dinOrPan', 'designation', 'mobile', 'email', 'dscAvailable'];

    const clearSignatoryErrors = (signatoryIndex: number) => {
        const base = `${fieldName}[${signatoryIndex}]`;
        signatoryFields.forEach(f => {
            setFieldTouched(`${base}.${f}`, false, false);
            setFieldError(`${base}.${f}`, undefined);
        });
    };

    const applyDirector = (signatoryIndex: number, directorIndex: number | null) => {
        setSelectedDirector(prev => ({ ...prev, [signatoryIndex]: directorIndex }));
        clearSignatoryErrors(signatoryIndex);
        if (directorIndex === null) return;
        const dir = filledDirectors[directorIndex];
        const base = `${fieldName}[${signatoryIndex}]`;
        setFieldValue(`${base}.name`, dir.directorName ?? '', false);
        setFieldValue(`${base}.dinOrPan`, dir.din || dir.pan || '', false);
        setFieldValue(`${base}.designation`, dir.designation ?? '', false);
        setFieldValue(`${base}.mobile`, dir.mobile ?? '', false);
        setFieldValue(`${base}.email`, dir.email ?? '', false);
        setFieldValue(`${base}.dscAvailable`, dir.dscAvailable ?? '', false);
    };

    return (
        <div className="border border-[#ebebeb] rounded-[22px] p-6 w-full">
            <Flex vertical gap={2} className="mb-5">
                <Text className="!text-[14px] !font-semibold !text-black">{title}</Text>
                <Text className="!text-[11px] !text-[rgba(0,0,0,0.45)]">Add all authorised signatories</Text>
            </Flex>

            <FieldArray name={fieldName}>
                {({ push, remove }) => (
                    <Flex vertical gap={16}>
                        {rows.map((row, i) => {
                            const pickedIdx = selectedDirector[i] ?? null;
                            const isFilledFromDirector = pickedIdx !== null;

                            return (
                                <div key={i} className="border border-[#f0f0f0] rounded-[14px] p-4">
                                    <Flex justify="space-between" align="center" className="mb-3">
                                        <Text className="!text-[13px] !font-medium !text-[#314259]">Signatory {i + 1}</Text>
                                        {rows.length > 1 && (
                                            <Button
                                                type="text"
                                                icon={<DeleteOutlined />}
                                                onClick={() => {
                                                    remove(i);
                                                    setSelectedDirector(prev => {
                                                        const next: Record<number, number | null> = {};
                                                        Object.entries(prev).forEach(([k, v]) => {
                                                            const ki = Number(k);
                                                            if (ki !== i) next[ki > i ? ki - 1 : ki] = v;
                                                        });
                                                        return next;
                                                    });
                                                }}
                                                className="!text-[#ff4f4f] !p-0"
                                                size="small"
                                            />
                                        )}
                                    </Flex>

                                    {filledDirectors.length > 0 && (
                                        <div className="mb-4 bg-[#fff8f8] border border-[#ffe0e0] rounded-[10px] px-3 py-3">
                                            <Text className="!text-[11px] !font-medium !text-[rgba(0,0,0,0.55)] block mb-2">
                                                <UserOutlined className="mr-1" />
                                                Select a director to auto-fill signatory details
                                            </Text>
                                            <Flex vertical gap={8}>
                                                {filledDirectors.map((dir, di) => (
                                                    <button
                                                        key={di}
                                                        type="button"
                                                        onClick={() => applyDirector(i, pickedIdx === di ? null : di)}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-[8px] cursor-pointer border transition-all w-full text-left"
                                                        style={
                                                            pickedIdx === di
                                                                ? { background: '#fff1f1', borderColor: '#ff4f4f' }
                                                                : { background: '#fff', borderColor: '#f0f0f0' }
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={pickedIdx === di}
                                                            onChange={() => applyDirector(i, pickedIdx === di ? null : di)}
                                                            onClick={e => e.stopPropagation()}
                                                            style={{ accentColor: '#ff4f4f' }}
                                                        />
                                                        <Flex vertical gap={0}>
                                                            <Text className="!text-[12px] !font-semibold !text-[#314259]">{dir.directorName}</Text>
                                                            {(dir.din || dir.pan) && (
                                                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.4)]">
                                                                    {dir.din ? `DIN: ${dir.din}` : `PAN: ${dir.pan}`}
                                                                    {dir.mobile ? ` · ${dir.mobile}` : ''}
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                    </button>
                                                ))}
                                            </Flex>
                                            {isFilledFromDirector && (
                                                <Text className="!text-[10px] !text-[rgba(0,0,0,0.4)] block mt-2">
                                                    Details auto-filled — you can still edit any field below.
                                                </Text>
                                            )}
                                        </div>
                                    )}

                                    <Row gutter={[16, 0]}>
                                        <Col xs={24} sm={12}>
                                            <TextInput name={`${fieldName}[${i}].name`} label="Name" type="text" placeholder="Enter name" isRequired />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput name={`${fieldName}[${i}].dinOrPan`} label="DIN / PAN" type="text" placeholder="Enter DIN or PAN" convertToUppercase />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput name={`${fieldName}[${i}].designation`} label="Designation" type="text" placeholder="e.g. Director" />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput name={`${fieldName}[${i}].mobile`} label="Mobile" type="text" placeholder="10-digit mobile" allowNumbersOnly maxLength={10} addonBefore="+91" />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <TextInput name={`${fieldName}[${i}].email`} label="Email" type="email" placeholder="Enter email" />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <SelectInput
                                                name={`${fieldName}[${i}].dscAvailable`}
                                                label="DSC Available?"
                                                placeholder="Select"
                                                options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            );
                        })}

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => push(emptySignatory())}
                            className="!border-[#ff4f4f] !text-[#ff4f4f] !rounded-[10px]"
                        >
                            Add Signatory
                        </Button>
                    </Flex>
                )}
            </FieldArray>
        </div>
    );
};

export default AuthorisedSignatorySection;
