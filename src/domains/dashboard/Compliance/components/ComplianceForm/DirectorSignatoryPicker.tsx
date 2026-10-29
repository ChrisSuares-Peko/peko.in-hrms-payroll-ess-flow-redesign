import React, { useState } from 'react';

import { UserOutlined } from '@ant-design/icons';
import { Checkbox, Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type DirectorRow = Record<string, string>;

interface Props {
    directorsKey: string;
    signatoryNameKey: string;
    signatoryDinPanKey: string;
    signatoryDesignationKey: string;
    signatoryMobileKey: string;
    signatoryEmailKey: string;
    signatoryDscKey: string;
}

const DirectorSignatoryPicker: React.FC<Props> = ({
    directorsKey,
    signatoryNameKey,
    signatoryDinPanKey,
    signatoryDesignationKey,
    signatoryMobileKey,
    signatoryEmailKey,
    signatoryDscKey,
}) => {
    const { values, setFieldValue } = useFormikContext<Record<string, any>>();
    const directors: DirectorRow[] = (values[directorsKey] ?? []).filter(
        (r: DirectorRow) => r.name?.trim(),
    );

    const [selected, setSelected] = useState<number | null>(null);

    if (directors.length === 0) return null;

    const apply = (idx: number | null) => {
        setSelected(idx);
        if (idx === null) return;
        const dir = directors[idx];
        setFieldValue(signatoryNameKey, dir.name ?? '');
        setFieldValue(signatoryDinPanKey, dir.din || dir.pan || '');
        setFieldValue(signatoryDesignationKey, dir.designation ?? '');
        setFieldValue(signatoryMobileKey, dir.mobile ?? '');
        setFieldValue(signatoryEmailKey, dir.email ?? '');
        setFieldValue(signatoryDscKey, dir.dscAvailable ? 'Yes' : dir.dsc ?? '');
    };

    return (
        <div className="col-span-2 mb-2 bg-[#fff8f8] border border-[#ffe0e0] rounded-[12px] px-4 py-3">
            <Text className="!text-[11px] !font-medium !text-[rgba(0,0,0,0.55)] block mb-2">
                <UserOutlined className="mr-1" />
                Select a director to auto-fill signatory details
            </Text>
            <Flex vertical gap={8}>
                {directors.map((dir, di) => {
                    const isChecked = selected === di;
                    return (
                        <button
                            key={di}
                            type="button"
                            onClick={() => apply(isChecked ? null : di)}
                            className="flex items-center gap-3 px-3 py-2 rounded-[8px] cursor-pointer border transition-all w-full text-left"
                            style={
                                isChecked
                                    ? { background: '#fff1f1', borderColor: '#ff4f4f' }
                                    : { background: '#fff', borderColor: '#f0f0f0' }
                            }
                        >
                            <Checkbox
                                checked={isChecked}
                                onClick={e => e.stopPropagation()}
                                onChange={() => apply(isChecked ? null : di)}
                            />
                            <Text className="!text-[12px] !font-semibold !text-[#314259]">{dir.name}</Text>
                            {(dir.din || dir.pan) && (
                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.4)]">
                                    {dir.din ? `DIN: ${dir.din}` : `PAN: ${dir.pan}`}
                                </Text>
                            )}
                            {dir.mobile && (
                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.4)]">· {dir.mobile}</Text>
                            )}
                            {dir.email && (
                                <Text className="!text-[11px] !text-[rgba(0,0,0,0.4)]">· {dir.email}</Text>
                            )}
                        </button>
                    );
                })}
            </Flex>
            {selected !== null && (
                <Text className="!text-[10px] !text-[rgba(0,0,0,0.4)] block mt-2">
                    Details auto-filled — you can still edit any field below.
                </Text>
            )}
        </div>
    );
};

export default DirectorSignatoryPicker;
