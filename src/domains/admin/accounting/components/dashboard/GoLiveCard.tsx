import { useState } from 'react';

import { CalendarOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useAccountingGoLiveDate from '../../hooks/useAccountingGoLiveDate';
import GoLiveDateDrawer, { GoLiveDateFormValues } from '../GoLiveDateDrawer';

const day = (value?: string | null) => (value ? dayjs(value).format('DD MMM YYYY') : '');

const GoLiveCard = () => {
    const dispatch = useAppDispatch();
    const { goLive, isLoading, isSaving, save } = useAccountingGoLiveDate();
    const [searchParams] = useSearchParams();
    const [open, setOpen] = useState(() => searchParams.get('setGoLive') === '1');

    const submit = async (values: GoLiveDateFormValues) => {
        const saved = await save(values.date, values.reason);
        if (!saved) return;
        setOpen(false);
        dispatch(
            showToast({
                description: `Accounting go live date set to ${day(values.date)}`,
                variant: 'success',
            })
        );
    };

    const configured = Boolean(goLive?.configured);
    const setBy = goLive?.setByName;

    return (
        <>
            <Card className="w-full mb-6 border border-borderCard shadow-none rounded-xl">
                <Flex justify="space-between" align="center" gap={16} wrap="wrap">
                    <Flex gap={12} align="flex-start">
                        <CalendarOutlined className="mt-1 text-textBody" />
                        <Flex vertical gap={2}>
                            <Typography.Text className="text-[15px]">
                                {configured
                                    ? `Accounting from ${day(goLive?.date)}`
                                    : 'Accounting go live date not set'}
                            </Typography.Text>
                            <Typography.Text className="text-[13px] text-textBody">
                                {configured
                                    ? 'Nothing dated before this is counted anywhere in the portal.'
                                    : 'Until one is set every figure below reads zero and every list is empty.'}
                            </Typography.Text>
                            {configured && setBy && (
                                <Typography.Text className="text-[12px] text-textBody">
                                    Set by {setBy}
                                    {goLive?.setAt ? ` on ${day(goLive.setAt)}` : ''}
                                    {goLive?.reason ? ` — ${goLive.reason}` : ''}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Flex>
                    <Button
                        type={configured ? 'default' : 'primary'}
                        loading={isLoading}
                        onClick={() => setOpen(true)}
                    >
                        {configured ? 'Change date' : 'Set date'}
                    </Button>
                </Flex>
            </Card>
            <GoLiveDateDrawer
                open={open}
                configured={configured}
                initialValues={{ date: goLive?.date || '', reason: '' }}
                isLoading={isSaving}
                onCancel={() => setOpen(false)}
                onSubmit={submit}
            />
        </>
    );
};

export default GoLiveCard;
