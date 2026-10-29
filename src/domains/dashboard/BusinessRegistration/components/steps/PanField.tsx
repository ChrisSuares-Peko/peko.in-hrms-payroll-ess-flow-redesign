import { useEffect, useRef, useState } from 'react';

import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { getIn, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyPan } from '../../api';
import { PAN_REGEX, parsePanHolder } from '../../utils/pan';

interface PanFieldProps {
    namePrefix: string;
}

// PAN input with IndiaFilings verification: a valid PAN auto-verifies and fills
// the name fields. A PAN already used by another person is never auto-filled.
const PanField = ({ namePrefix }: PanFieldProps) => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [verifying, setVerifying] = useState(false);

    const pan = String(getIn(values, `${namePrefix}.pan`) ?? '').toUpperCase();
    const verifiedPan = String(getIn(values, `${namePrefix}.verifiedPan`) ?? '').toUpperCase();
    // Editing the PAN clears the verified state (schema then blocks Next).
    const isVerified = Boolean(pan) && pan === verifiedPan;
    // Seeded with the mount PAN so a resumed draft doesn't re-verify on mount.
    const lastLookedUp = useRef(pan);

    // Every other person's PAN (director / nominee / directors[] / partners[]).
    const otherPans: string[] = [];
    const collectPan = (path: string) => {
        if (path === namePrefix) return;
        const p = String(getIn(values, `${path}.pan`) ?? '').trim().toUpperCase();
        if (p) otherPans.push(p);
    };
    const collectArray = (field: string) => {
        const arr = (getIn(values, field) as unknown[] | undefined) || [];
        for (let i = 0; i < arr.length; i += 1) collectPan(`${field}.${i}`);
    };
    collectPan('director');
    collectPan('nominee');
    collectArray('directors');
    collectArray('partners');
    const otherPansKey = otherPans.join('|');

    const set = (field: string, val?: string) => {
        if (val) setFieldValue(`${namePrefix}.${field}`, val);
    };

    useEffect(() => {
        // Auto-verify once a full valid PAN is entered (mirrors the pincode lookup).
        if (!PAN_REGEX.test(pan)) {
            lastLookedUp.current = '';
            return undefined;
        }
        if (pan === lastLookedUp.current) return undefined;
        // A duplicate PAN is never verified/auto-filled — the schema flags it.
        if (otherPans.includes(pan)) {
            lastLookedUp.current = '';
            return undefined;
        }
        lastLookedUp.current = pan;
        let active = true;
        setVerifying(true);
        verifyPan({ userId: Number(userId), userType: userType ?? '', pan })
            .then(res => {
                if (!active) return;
                setVerifying(false);
                const holder = res ? parsePanHolder(res) : null;
                if (!holder) {
                    lastLookedUp.current = '';
                    dispatch(showToast({ description: 'Could not verify this PAN', variant: 'error' }));
                    return;
                }
                set('fullName', holder.fullName);
                // No middle name on autofill — fold it into the first name (editable).
                set('firstName', [holder.firstName, holder.middleName].filter(Boolean).join(' '));
                setFieldValue(`${namePrefix}.middleName`, '');
                set('lastName', holder.lastName);
                set('fathersName', holder.fathersName);
                setFieldValue(`${namePrefix}.verifiedPan`, pan);
                dispatch(
                    showToast({
                        description: holder.fullName ? `PAN verified — ${holder.fullName}` : 'PAN verified',
                        variant: 'success',
                    })
                );
            })
            .catch(() => {
                if (active) setVerifying(false);
            });
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pan, otherPansKey]);

    // Check / spinner / none — a helper to avoid a nested ternary in the JSX.
    const renderSuffix = () => {
        if (isVerified) return <CheckCircleFilled className="text-[#52c41a]" />;
        if (verifying) return <LoadingOutlined className="text-[#ff4f4f]" />;
        return null;
    };

    return (
        <TextInput
            label="PAN"
            name={`${namePrefix}.pan`}
            type="text"
            placeholder="Enter PAN"
            isRequired
            size="large"
            maxLength={10}
            convertToUppercase
            restrictPanGstFormat
            suffix={renderSuffix()}
        />
    );
};

export default PanField;
