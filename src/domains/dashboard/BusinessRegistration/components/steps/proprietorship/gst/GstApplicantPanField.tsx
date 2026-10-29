import { useEffect, useRef, useState } from 'react';

import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { getIn, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyPan } from '../../../../api';
import { PAN_REGEX, parsePanHolder } from '../../../../utils/pan';

// Proprietor PAN for the GST applicant. Verifying it auto-fills the authorized
// person name FROM the PAN holder, so the name the vendor checks (people API,
// ERR080) always matches the PAN — the name can't be typed to drift from it.
const GstApplicantPanField = () => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [verifying, setVerifying] = useState(false);

    const pan = String(getIn(values, 'gst.pan') ?? '').toUpperCase();
    const verifiedPan = String(getIn(values, 'gst.verifiedPan') ?? '').toUpperCase();
    const isVerified = Boolean(pan) && pan === verifiedPan;
    // Seed with the mount PAN so a resumed (already-verified) draft doesn't re-verify.
    const lastLookedUp = useRef(pan);

    useEffect(() => {
        if (!PAN_REGEX.test(pan)) {
            lastLookedUp.current = '';
            return undefined;
        }
        if (pan === lastLookedUp.current) return undefined;
        lastLookedUp.current = pan;
        let active = true;
        setVerifying(true);
        verifyPan({ userId: Number(userId), userType: userType ?? '', pan })
            .then(res => {
                if (!active) return;
                setVerifying(false);
                const holder = res ? parsePanHolder(res) : null;
                if (!holder?.fullName) {
                    lastLookedUp.current = '';
                    // Clear the stale name so a mismatch can't slip through unverified.
                    setFieldValue('gst.verifiedPan', '');
                    dispatch(
                        showToast({ description: 'Could not verify this PAN', variant: 'error' })
                    );
                    return;
                }
                // The people API needs the name EXACTLY as on the PAN — take it from there.
                setFieldValue('gst.authorizedPerson', holder.fullName);
                setFieldValue('gst.verifiedPan', pan);
                dispatch(
                    showToast({
                        description: `PAN verified — ${holder.fullName}`,
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
    }, [pan]);

    const renderSuffix = () => {
        if (isVerified) return <CheckCircleFilled className="text-[#52c41a]" />;
        if (verifying) return <LoadingOutlined className="text-[#ff4f4f]" />;
        return null;
    };

    return (
        <TextInput
            label="Authorised Person PAN"
            name="gst.pan"
            type="text"
            placeholder="ABCDE1234F"
            isRequired
            size="large"
            maxLength={10}
            convertToUppercase
            restrictPanGstFormat
            suffix={renderSuffix()}
        />
    );
};

export default GstApplicantPanField;
