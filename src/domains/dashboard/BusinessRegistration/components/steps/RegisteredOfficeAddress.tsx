import { useEffect, useRef, useState } from 'react';

import { Col, Row, Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { locationLookup } from '../../api';
import { cityFromPincode } from '../../utils/data';

const { Text } = Typography;

interface LocationData {
    state?: string;
    district?: string;
    city?: string;
    // The pincode's localities — a list; elements may be strings or objects.
    area?: unknown;
    latitude?: string;
    longitude?: string;
    indiafilings?: string;
}

const parseLocation = (res: unknown): LocationData | null => {
    const data = (res as { data?: LocationData } | null)?.data ?? (res as LocationData | null);
    return data && typeof data === 'object' && data.state ? data : null;
};

// `area` comes back as the list of localities under a pincode — elements are
// plain strings or objects depending on the record; normalise to unique names.
const normalizeAreas = (area: unknown): string[] => {
    if (!Array.isArray(area)) return [];
    const names = area
        .map(a => {
            if (typeof a === 'string') return a.trim();
            const o = a as Record<string, unknown>;
            return String(o?.name ?? o?.area ?? o?.label ?? o?.value ?? '').trim();
        })
        .filter(Boolean);
    return Array.from(new Set(names));
};

// Registered Office Address — shown only for "Yes, I have a registered office".
// Entering the 6-digit pincode auto-fills city/district/state, loads the area
// dropdown, and stores the latitude/longitude straight from the lookup — the
// filing uses those coordinates directly (no map / manual pin).
const RegisteredOfficeAddress = () => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [areas, setAreas] = useState<string[]>([]);

    const pincode = String(getIn(values, 'registeredOfficeAddress.pincode') ?? '');
    const savedArea = String(getIn(values, 'registeredOfficeAddress.area') ?? '');
    // Seeded with the mount-time pincode: the lookup fires only when the USER
    // changes it — a resumed draft must not refetch on mount or overwrite saved
    // city/state edits.
    const lastLookedUp = useRef(pincode);

    // On resume the lookup doesn't refire, so `areas` is empty — keep the saved
    // area selectable by folding it into the options.
    const areaOptions = Array.from(new Set([...(savedArea ? [savedArea] : []), ...areas])).map(a => ({
        label: a,
        value: a,
    }));

    useEffect(() => {
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
            setFieldValue('registeredOfficeAddress.city', cityFromPincode(loc));
            setFieldValue('registeredOfficeAddress.district', loc.district ?? '');
            setFieldValue('registeredOfficeAddress.state', loc.state ?? '');
            setFieldValue('registeredOfficeAddress.latitude', loc.latitude ?? '');
            setFieldValue('registeredOfficeAddress.longitude', loc.longitude ?? '');
            const list = normalizeAreas(loc.area);
            setAreas(list);
            // A stale area from a previous pincode is no longer valid — clear it.
            if (savedArea && !list.includes(savedArea)) {
                setFieldValue('registeredOfficeAddress.area', '');
            }
        });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pincode]);

    // On resume the main lookup doesn't refire (it must not clobber saved
    // city/state edits), so fetch the area list once on mount for a pre-filled
    // pincode — options only, no field writes.
    useEffect(() => {
        if (!/^[1-9]\d{5}$/.test(pincode) || areas.length) return undefined;
        let active = true;
        locationLookup({ userId: Number(userId), userType: userType ?? '', pincode }).then(res => {
            if (active) {
                const loc = parseLocation(res);
                if (loc) setAreas(normalizeAreas(loc.area));
            }
        });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Business mobile/email default from the primary contact (Basic Info); the
    // user can override them. Seeded once on mount when still empty so a resumed
    // draft's edits are never clobbered.
    useEffect(() => {
        const pc = (values.primaryContact as { mobile?: string; email?: string }) || {};
        if (!getIn(values, 'registeredOfficeAddress.businessMobile') && pc.mobile) {
            setFieldValue('registeredOfficeAddress.businessMobile', pc.mobile);
        }
        if (!getIn(values, 'registeredOfficeAddress.businessEmail') && pc.email) {
            setFieldValue('registeredOfficeAddress.businessEmail', pc.email);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col gap-3">
            <Text className="!text-[18px] !font-semibold !text-[#1e293b] !leading-[26px]">
                Registered Office Address
            </Text>
            <Text className="!text-[13px] !text-[#6a7282]">Fill address as per the Utility Bill proof.</Text>
            <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-1">
                {/* Vertical gutter: these stack on mobile and ran together at 0. */}
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <TextInput label="Address line 1" name="registeredOfficeAddress.line1" type="text" placeholder="Building / street" maxLength={25} isRequired size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="Address line 2" name="registeredOfficeAddress.line2" type="text" placeholder="Optional" maxLength={25} size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="Pincode" name="registeredOfficeAddress.pincode" type="text" placeholder="6-digit pincode" maxLength={6} allowNumbersOnly isRequired size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <SelectInput
                            label="Area / locality"
                            name="registeredOfficeAddress.area"
                            options={areaOptions}
                            placeholder={areaOptions.length ? 'Select area' : 'Enter pincode first'}
                            isDisabled={!areaOptions.length}
                            showSearch
                            isRequired
                            size="large"
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="City" name="registeredOfficeAddress.city" type="text" placeholder="Auto-filled from pincode" isRequired size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="District" name="registeredOfficeAddress.district" type="text" placeholder="Auto-filled from pincode" size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="State" name="registeredOfficeAddress.state" type="text" placeholder="Auto-filled from pincode" isRequired size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="Landlord name" name="registeredOfficeAddress.landlordName" type="text" placeholder="Owner of the premises" isRequired size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="Business mobile" name="registeredOfficeAddress.businessMobile" type="text" placeholder="Office contact number" maxLength={10} allowNumbersOnly size="large" />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextInput label="Business email" name="registeredOfficeAddress.businessEmail" type="text" placeholder="Office email address" size="large" />
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default RegisteredOfficeAddress;
