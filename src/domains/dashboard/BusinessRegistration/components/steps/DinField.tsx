import { useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button } from 'antd';
import { getIn, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyDin } from '../../api';

interface DinFieldProps {
    namePrefix: string;
}

// DIN is 8 digits.
const DIN_REGEX = /^\d{8}$/;

interface DirectorInfo {
    name?: string;
    status?: string;
}

// Best-effort parse of the MCA director response (shape per vendor doc v1.1 §13).
const parseDirectorInfo = (res: unknown): DirectorInfo | null => {
    const info = (res as { director_info?: DirectorInfo } | null)?.director_info;
    return info && typeof info === 'object' ? info : null;
};

// DIN input with MCA validation (mirrors PanField). On "Verify" the director's
// approval status is checked against MCA records before adding them.
const DinField = ({ namePrefix }: DinFieldProps) => {
    const { values } = useFormikContext<Record<string, unknown>>();
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);

    const din = String(getIn(values, `${namePrefix}.din`) ?? '').trim();

    const handleVerify = async () => {
        if (!DIN_REGEX.test(din)) {
            dispatch(showToast({ description: 'Enter a valid 8-digit DIN', variant: 'error' }));
            return;
        }
        setVerifying(true);
        const res = await verifyDin({ userId: Number(userId), userType: userType ?? '', din });
        setVerifying(false);
        const info = res ? parseDirectorInfo(res) : null;
        if (!info) {
            setVerified(false);
            dispatch(showToast({ description: 'Could not verify this DIN', variant: 'error' }));
            return;
        }
        setVerified(true);
        dispatch(
            showToast({
                description: [info.name, info.status && `(${info.status})`].filter(Boolean).join(' ') || 'DIN verified',
                variant: 'success',
            })
        );
    };

    return (
        <TextInput
            label="DIN (optional)"
            name={`${namePrefix}.din`}
            type="text"
            placeholder="Enter DIN"
            size="large"
            maxLength={8}
            allowNumbersOnly
            suffix={verified ? <CheckCircleFilled className="text-[#52c41a]" /> : null}
            addonAfter={
                <Button
                    type="text"
                    size="small"
                    loading={verifying}
                    onClick={handleVerify}
                    className="!text-[#ff4f4f] !font-medium !px-2"
                >
                    Verify
                </Button>
            }
        />
    );
};

export default DinField;
