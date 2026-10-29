import { useState } from 'react';

import { Alert, Button } from 'antd';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import GoLiveDateDrawer, { GoLiveDateFormValues } from './GoLiveDateDrawer';
import useAccountingGoLiveDate from '../hooks/useAccountingGoLiveDate';

const GoLiveBanner = () => {
    const dispatch = useAppDispatch();
    const { pathname } = useLocation();
    const { goLive, isLoading, isSaving, save } = useAccountingGoLiveDate();
    const [open, setOpen] = useState(false);

    // The dashboard carries the same thing as a card it can say more on, so the banner keeps
    // out of its way rather than saying it twice.
    const onDashboard = pathname.replace(/\/$/, '') === paths.systemUser.accounting;

    const submit = async (values: GoLiveDateFormValues) => {
        const saved = await save(values.date, values.reason);
        if (!saved) return;
        setOpen(false);
        dispatch(
            showToast({
                description: `Accounting go live date set to ${dayjs(values.date).format('DD MMM YYYY')}`,
                variant: 'success',
            })
        );
    };

    if (isLoading || !goLive || goLive.configured || onDashboard) return null;

    return (
        <>
            <Alert
                type="warning"
                showIcon
                className="!mb-5"
                message="No accounting go live date is set"
                description="Until one is set this portal counts nothing: every list is empty and every figure reads zero. Set the first day it should account for."
                action={
                    <Button size="small" type="primary" onClick={() => setOpen(true)}>
                        Set date
                    </Button>
                }
            />
            <GoLiveDateDrawer
                open={open}
                configured={false}
                initialValues={{ date: '', reason: '' }}
                isLoading={isSaving}
                onCancel={() => setOpen(false)}
                onSubmit={submit}
            />
        </>
    );
};

export default GoLiveBanner;
