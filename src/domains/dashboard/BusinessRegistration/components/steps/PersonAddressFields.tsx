import { useEffect, useRef, useState } from 'react';

import { Col, Row, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { locationLookup } from '../../api';
import { COUNTRIES } from '../../utils/countries';
import { cityFromPincode } from '../../utils/data';

const { Text } = Typography;

interface LocationData {
    state?: string;
    district?: string;
    city?: string;
    area?: string[];
}

const parseLocation = (res: unknown): LocationData | null => {
    const data = (res as { data?: LocationData } | null)?.data ?? (res as LocationData | null);
    return data && typeof data === 'object' && data.state ? data : null;
};

// Residential address of a director / partner / nominee (vendor doc §14 address
// block) — feeds the vendor people record, smart form 2 partner & promoter
// details and the MOA subscriber address. An Indian 6-digit pincode auto-fills
// area/city/district/state via the vendor lookup; foreign nationals type freely.
// `limitLines` keeps the 25-char cap on address line 1 & 2 (used only for the
// Nominee); promoters pass it false so their address lines are uncapped.
const PersonAddressFields = ({
    namePrefix,
    limitLines = false,
}: {
    namePrefix: string;
    limitLines?: boolean;
}) => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const n = (field: string) => `${namePrefix}.address.${field}`;
    // Address behaviour is driven by RESIDENCY (where the person lives), not
    // nationality (which drives the identity proof). An Indian citizen living
    // abroad types the address freely; a foreign citizen residing in India gets
    // the pincode lookup. Empty (legacy drafts) is treated as India.
    const residency = String(getIn(values, `${namePrefix}.residency`) || 'INDIA');
    const foreign = residency !== 'INDIA';
    const pincode = String(getIn(values, n('pincode')) ?? '');
    // Seeded with the mount-time pincode: the lookup fires only when the USER
    // changes it — a resumed draft must not refetch on mount and overwrite the
    // saved city/state edits.
    const lastLookedUp = useRef(pincode);
    // Area/locality options returned by the PIN lookup (vendor: Area is a
    // dropdown for India). Kept in a superset with the current value so a
    // resumed draft's saved area still shows before any re-lookup.
    const [areaOptions, setAreaOptions] = useState<string[]>([]);
    const currentArea = String(getIn(values, n('area')) ?? '');
    const areaSelectOptions = Array.from(
        new Set([...areaOptions, currentArea].filter(Boolean))
    ).map(a => ({ label: a, value: a }));

    useEffect(() => {
        // Foreign nationals type the address freely — no India pincode lookup.
        if (foreign) return undefined;
        // Cleared/incomplete pincode — unlatch so completing it again (even the
        // same value the user just cleared) re-triggers the lookup.
        if (!/^[1-9]\d{5}$/.test(pincode)) {
            lastLookedUp.current = '';
            return undefined;
        }
        if (pincode === lastLookedUp.current) return undefined;
        lastLookedUp.current = pincode;
        let active = true;
        locationLookup({ userId: Number(userId), userType: userType ?? '', pincode }).then(res => {
            if (!active) return;
            const loc = parseLocation(res);
            if (!loc) {
                // Failed/unknown pincode — unlatch so re-entering it retries.
                lastLookedUp.current = '';
                return;
            }
            setFieldValue(n('city'), cityFromPincode(loc));
            setFieldValue(n('district'), loc.district ?? '');
            setFieldValue(n('state'), loc.state ?? '');
            if (Array.isArray(loc.area) && loc.area.length) {
                setAreaOptions(loc.area.map(String));
                setFieldValue(n('area'), String(loc.area[0]));
            }
        });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pincode, foreign]);

    return (
        <div className="flex flex-col gap-1 mt-2">
            <Text className="!text-[15px] !font-semibold !text-[#1e293b]">Residential Address</Text>
            <Text className="!text-[13px] !text-[#6a7282]">Fill as per the bank statement proof.</Text>
            <Row gutter={[16, 0]} className="mt-2">
                <Col xs={24} md={12}>
                    {/* Residency drives the whole address block: India = pincode lookup,
                        any other country = free-text manual entry. */}
                    <SelectInput label="Country of Residence" name={`${namePrefix}.residency`} options={COUNTRIES} placeholder="Select country of residence" showSearch isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="Address line 1" name={n('line1')} type="text" placeholder="Flat / house number" maxLength={limitLines ? 25 : undefined} isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="Address line 2" name={n('line2')} type="text" placeholder="Street / locality" maxLength={limitLines ? 25 : undefined} size="large" />
                </Col>
                <Col xs={24} md={12}>
                    {foreign ? (
                        <TextInput label="Postal code" name={n('pincode')} type="text" placeholder="Postal / ZIP code" maxLength={10} isRequired size="large" />
                    ) : (
                        <TextInput label="Pincode" name={n('pincode')} type="text" placeholder="6-digit pincode" maxLength={6} allowNumbersOnly isRequired size="large" />
                    )}
                </Col>
                <Col xs={24} md={12}>
                    {foreign ? (
                        <TextInput label="Area / locality" name={n('area')} type="text" placeholder="Area" size="large" />
                    ) : (
                        <SelectInput label="Area / locality" name={n('area')} options={areaSelectOptions} placeholder="Select after entering pincode" showSearch size="large" />
                    )}
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="City" name={n('city')} type="text" placeholder={foreign ? 'City' : 'Auto-filled from pincode'} isRequired size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="District" name={n('district')} type="text" placeholder={foreign ? 'District / county' : 'Auto-filled from pincode'} size="large" />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput label="State" name={n('state')} type="text" placeholder={foreign ? 'State / province' : 'Auto-filled from pincode'} isRequired size="large" />
                </Col>
                <Col xs={12} md={6}>
                    <TextInput label="Years at address" name={n('durationYears')} type="text" placeholder="e.g. 3" maxLength={2} allowNumbersOnly isRequired size="large" />
                </Col>
                <Col xs={12} md={6}>
                    <TextInput label="Months" name={n('durationMonths')} type="text" placeholder="e.g. 5" maxLength={2} allowNumbersOnly isRequired size="large" />
                </Col>
            </Row>
        </div>
    );
};

export default PersonAddressFields;
