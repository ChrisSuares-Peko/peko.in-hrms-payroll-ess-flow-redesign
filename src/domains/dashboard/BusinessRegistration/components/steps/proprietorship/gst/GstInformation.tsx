import { useRef, useState } from 'react';

import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { searchHsnCode } from '../../../../api';
import {
    BUSINESS_ACTIVITY_OPTIONS,
    RULE_14A_HELPER,
    RULE_14A_OPTIONS,
} from '../../../../utils/gst';

const { Title, Paragraph, Text } = Typography;

type HsnRow = { hsn_code: string; hsn_description: string };
type HsnOption = { label: string; value: string };

// Rows come as { code, description } (older doc used hsn_code/hsn_description).
const parseHsnRows = (res: unknown): HsnRow[] => {
    const inner = (res as { data?: unknown } | null)?.data;
    return (Array.isArray(inner) ? inner : [])
        .map(o => (o && typeof o === 'object' ? (o as Record<string, unknown>) : {}))
        .map(o => ({
            hsn_code: String(o.code ?? o.hsn_code ?? ''),
            hsn_description: String(o.description ?? o.hsn_description ?? ''),
        }))
        .filter(r => r.hsn_code);
};

// GST chapter 99 = services (SAC); everything else is goods (HSN). The stored
// value matches the smart form's "HSN - code - desc" / "SAC - code - desc" shape.
const toHsnOption = (r: HsnRow): HsnOption => {
    const kind = r.hsn_code.startsWith('99') ? 'SAC' : 'HSN';
    return {
        label: `${r.hsn_code} — ${r.hsn_description}`,
        value: `${kind} - ${r.hsn_code} - ${r.hsn_description}`,
    };
};

// GST Registration Smart Form — Step 3 "GST Information". Nature of business
// activity (multi-select), Rule 14A option, and the Top 5 Goods & Services
// picker, which searches the vendor /hsncode endpoint by code prefix.
const GstInformation = () => {
    const { values } = useFormikContext<Record<string, unknown>>();
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const activities = (getIn(values, 'gst.businessActivity') as string[] | undefined) || [];
    const hasOthers = activities.includes('Others');

    const [hsnOptions, setHsnOptions] = useState<HsnOption[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // The vendor /hsncode endpoint searches by code prefix and requires a non-empty
    // hsncode (there is no "list all"), so the picker is type-to-search: a debounced
    // lookup once the user has typed at least 2 characters.
    const onHsnSearch = (query: string) => {
        const q = query.trim();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 2) {
            setHsnOptions([]);
            return;
        }
        debounceRef.current = setTimeout(() => {
            searchHsnCode({ userId: Number(userId), userType: userType ?? '', hsncode: q }).then(
                res => {
                    if (res === false) {
                        dispatch(
                            showToast({
                                description: 'Could not search HSN/SAC codes',
                                variant: 'error',
                            })
                        );
                        setHsnOptions([]);
                        return;
                    }
                    setHsnOptions(parseHsnRows(res).map(toHsnOption));
                }
            );
        }, 400);
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title
                    level={3}
                    className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]"
                >
                    GST Information
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    Business activity, Rule 14A option and goods &amp; services
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6">
                <Row gutter={[16, 8]}>
                    <Col xs={24}>
                        <SelectInput
                            label="Nature of Business Activity"
                            name="gst.businessActivity"
                            mode="multiple"
                            options={BUSINESS_ACTIVITY_OPTIONS}
                            placeholder="Select one or more"
                            isRequired
                            size="large"
                        />
                    </Col>
                    {hasOthers && (
                        <Col xs={24}>
                            <TextInput
                                label="Others (specify)"
                                name="gst.businessActivityOthers"
                                type="text"
                                placeholder="Describe the activity"
                                isRequired
                                size="large"
                            />
                        </Col>
                    )}
                    <Col xs={24} md={12}>
                        <SelectInput
                            label="Option For Registration Under Rule 14A"
                            name="gst.rule14a"
                            options={RULE_14A_OPTIONS}
                            placeholder="Select"
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24}>
                        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[12px] flex gap-2 items-start px-4 py-3">
                            <ExclamationCircleOutlined
                                className="text-[#f59e0b] mt-[3px]"
                                style={{ fontSize: 16 }}
                            />
                            <Text className="!text-[13px] !text-[#475569] !leading-[20px]">
                                {RULE_14A_HELPER}
                            </Text>
                        </div>
                    </Col>
                </Row>

                <div className="mt-4 flex flex-col gap-2">
                    <Text className="!text-[15px] !font-semibold !text-[#1e293b]">
                        Top 5 - Goods &amp; Services (HSN / SAC)
                    </Text>
                    <div className="border border-dashed border-[#e4e4e7] rounded-[16px] p-4 bg-[#fafafa]">
                        <SelectInput
                            label=""
                            name="gst.hsnSac"
                            mode="multiple"
                            options={hsnOptions}
                            onSearch={onHsnSearch}
                            filterOption={false}
                            placeholder="Search by HSN / SAC code (e.g. 23)"
                            showSearch
                            size="large"
                        />
                        <Text className="!block !text-[12px] !text-[#94a3b8] !leading-[18px]">
                            Type a code to search; select up to 5 HSN and 5 SAC codes.
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GstInformation;
