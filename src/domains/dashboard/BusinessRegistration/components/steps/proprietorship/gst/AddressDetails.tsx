import { useEffect, useRef, useState } from 'react';

import { Col, Row, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { jurisdictionLookup } from '../../../../api';
import { cityFromPincode, INDIA_STATES, matchIndiaState } from '../../../../utils/data';
import { ELECTRICITY_BOARD_OPTIONS, isMaharashtra } from '../../../../utils/gst';

const { Title, Paragraph } = Typography;

const parseLocation = (res: unknown) => {
    const data =
        (res as { data?: Record<string, unknown> } | null)?.data ??
        (res as Record<string, unknown> | null);
    return data && typeof data === 'object' && data.state ? data : null;
};

type JEntry = { id: string; name: string };
type JKey = 'circle' | 'commissionerate' | 'division' | 'range';
const J_KEYS: JKey[] = ['circle', 'commissionerate', 'division', 'range'];
const J_LABELS: Record<JKey, string> = {
    circle: 'Circle',
    commissionerate: 'Commissionerate',
    division: 'Division',
    range: 'Range',
};

// The /pincode lookup with type 'gst' nests the GST jurisdiction under
// data.gst_jurisdiction: { circle, commissionerate, division, range } — each an
// array of { id, name } (a pincode can return several). Normalise to clean lists.
const toEntries = (arr: unknown): JEntry[] =>
    (Array.isArray(arr) ? arr : [])
        .map(o => (o && typeof o === 'object' ? (o as Record<string, unknown>) : {}))
        .map(o => ({ id: String(o.id ?? ''), name: String(o.name ?? '') }))
        .filter(e => e.name);

const parseJurisdiction = (res: unknown): Record<JKey, JEntry[]> | null => {
    const data =
        (res as { data?: Record<string, unknown> } | null)?.data ??
        (res as Record<string, unknown> | null);
    const j =
        data && typeof data === 'object'
            ? (data.gst_jurisdiction as Record<string, unknown> | undefined)
            : undefined;
    if (!j || typeof j !== 'object') return null;
    return {
        circle: toEntries(j.circle),
        commissionerate: toEntries(j.commissionerate),
        division: toEntries(j.division),
        range: toEntries(j.range),
    };
};

// GST Registration Smart Form — Step 2 "Address Details" (PPOB). A 6-digit pincode
// auto-fills state/district and the GST jurisdiction dropdowns (Circle / Commissionerate
// / Division / Range) from the /pincode lookup with type 'gst' — a pincode can return
// several options per field, so each is a dropdown the user can pick from.
const AddressDetails = () => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const pincode = String(getIn(values, 'gst.pincode') ?? '');
    const state = String(getIn(values, 'gst.state') ?? '');
    const lastLookedUp = useRef(pincode);
    const [jur, setJur] = useState<Record<JKey, JEntry[]>>({
        circle: [],
        commissionerate: [],
        division: [],
        range: [],
    });

    // Options for a jurisdiction select: the fetched list, or the saved value as a
    // lone option (so a resumed draft shows its selection before the re-lookup).
    const jOptions = (key: JKey) => {
        if (jur[key].length) return jur[key].map(e => ({ label: e.name, value: e.name }));
        const current = String(getIn(values, `gst.${key}`) ?? '');
        return current ? [{ label: current, value: current }] : [];
    };
    const onPickJur = (key: JKey) => (name: string) => {
        setFieldValue(`gst.${key}`, name);
        setFieldValue(`gst.${key}Id`, jur[key].find(e => e.name === name)?.id ?? '');
    };

    useEffect(() => {
        if (!/^[1-9]\d{5}$/.test(pincode)) {
            lastLookedUp.current = '';
            return undefined;
        }
        if (pincode === lastLookedUp.current) return undefined;
        lastLookedUp.current = pincode;
        let active = true;
        const auth = { userId: Number(userId), userType: userType ?? '', pincode };
        // One /pincode call with type 'gst' returns location + GST jurisdiction.
        jurisdictionLookup(auth).then(res => {
            if (!active) return;
            const loc = parseLocation(res);
            if (loc) {
                setFieldValue('gst.state', matchIndiaState(loc.state));
                setFieldValue('gst.district', loc.district ?? '');
                setFieldValue('gst.city', cityFromPincode(loc));
            } else {
                lastLookedUp.current = '';
            }
            // Populate the jurisdiction dropdowns and pre-select the first of each
            // (single-value pincodes just work; multi-value lets the user pick).
            const j = parseJurisdiction(res);
            if (!j) return;
            setJur(j);
            J_KEYS.forEach(key => {
                const first = j[key][0];
                if (first) {
                    setFieldValue(`gst.${key}`, first.name);
                    setFieldValue(`gst.${key}Id`, first.id);
                }
            });
        });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pincode]);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title
                    level={3}
                    className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]"
                >
                    Address Details
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    GST jurisdiction and Principal Place of Business address
                </Paragraph>
            </div>

            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6">
                <Row gutter={[16, 8]}>
                    <Col xs={24} md={12}>
                        <TextInput
                            label="Pincode"
                            name="gst.pincode"
                            type="text"
                            placeholder="6-digit pincode"
                            maxLength={6}
                            allowNumbersOnly
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <SelectInput
                            label="GST Applying State"
                            name="gst.state"
                            options={INDIA_STATES}
                            placeholder="Select state"
                            showSearch
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput
                            label="District"
                            name="gst.district"
                            type="text"
                            placeholder="Auto-filled from pincode"
                            isRequired
                            size="large"
                        />
                    </Col>
                    {J_KEYS.map(key => (
                        <Col xs={24} md={12} key={key}>
                            <SelectInput
                                label={J_LABELS[key]}
                                name={`gst.${key}`}
                                options={jOptions(key)}
                                handleChange={onPickJur(key)}
                                placeholder="Auto-filled from pincode"
                                showSearch
                                isRequired
                                size="large"
                            />
                        </Col>
                    ))}
                    <Col xs={24}>
                        <TextInput
                            label="Address"
                            name="gst.address"
                            type="text"
                            placeholder="Principal Place of Business address"
                            isRequired
                            size="large"
                        />
                    </Col>

                    {isMaharashtra(state) && (
                        <>
                            <Col xs={24} md={12}>
                                <SelectInput
                                    label="Electricity Board"
                                    name="gst.electricityBoard"
                                    options={ELECTRICITY_BOARD_OPTIONS}
                                    placeholder="Select board"
                                    isRequired
                                    size="large"
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <TextInput
                                    label="CA Number / Electricity Consumer Number"
                                    name="gst.caNumber"
                                    type="text"
                                    placeholder="Enter number"
                                    isRequired
                                    size="large"
                                />
                            </Col>
                        </>
                    )}
                </Row>
            </div>
        </div>
    );
};

export default AddressDetails;
