import { useState } from 'react';

import { Alert, Button, Col, Descriptions, Flex, Modal, Row, Typography } from 'antd';
import { Form, Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import usePartnersForCorporate from '../../../users/hooks/usePartnersForCorporate';
import useClonePartnerPermission from '../../hooks/useClonePartnerPermission';
import { clonePermissionSchema } from '../../schema/clonePermissionSchema';
import {
    ClonePermissionPayload,
    ClonePermissionResult,
    CopyIconsResult,
    refresh,
} from '../../types/partnerPermission';

type Props = {
    open: boolean;
    handleCancel: () => void;
};

type ResultState =
    | { kind: 'clone'; data: ClonePermissionResult }
    | { kind: 'icons'; data: CopyIconsResult }
    | null;

const ClonePermissionModal = ({ open, handleCancel, setRefresh }: Props & refresh) => {
    const dispatch = useAppDispatch();
    const { categoryDatas, partnerData } = usePartnersForCorporate('');
    const { clonePermission, copyIcons, isCloning, isCopyingIcons } = useClonePartnerPermission();

    const [confirmPayload, setConfirmPayload] = useState<ClonePermissionPayload | null>(null);
    const [result, setResult] = useState<ResultState>(null);

    const targetOptions = (categoryDatas || []).map(partner => ({
        value: partner.id,
        label: partner.name,
    }));

    const notify = (response: any, fallback: string) => {
        if (response && response.status === true) {
            dispatch(showToast({ variant: 'success', description: response.message || fallback }));
            setRefresh(true);
            return true;
        }
        dispatch(
            showToast({
                variant: 'error',
                description:
                    response && response.message
                        ? response.message
                        : 'Something went wrong. If the issue persists, please contact support at reach@peko.one',
            })
        );
        return false;
    };

    const runClone = async (payload: ClonePermissionPayload) => {
        const response: any = await clonePermission(payload);
        setConfirmPayload(null);
        if (notify(response, 'Partner permission cloned successfully')) {
            setResult({ kind: 'clone', data: response.data });
        }
    };

    const runCopyIcons = async (payload: ClonePermissionPayload) => {
        const response: any = await copyIcons(payload);
        if (notify(response, 'Icons copied successfully')) {
            setResult({ kind: 'icons', data: response.data });
        }
    };

    const close = () => {
        setResult(null);
        setConfirmPayload(null);
        handleCancel();
    };

    return (
        <Formik
            initialValues={{ fromPartnerId: 'default' as number | 'default', toPartnerId: '' }}
            validationSchema={clonePermissionSchema}
            onSubmit={() => undefined}
            validateOnMount
        >
            {({ values, isValid, validateForm, setTouched }) => {
                const payload = (): ClonePermissionPayload => ({
                    fromPartnerId: values.fromPartnerId,
                    toPartnerId: Number(values.toPartnerId),
                });

                const guard = async (action: (p: ClonePermissionPayload) => void) => {
                    const errors = await validateForm();
                    if (Object.keys(errors).length > 0) {
                        setTouched({ fromPartnerId: true, toPartnerId: true });
                        return;
                    }
                    action(payload());
                };

                return (
                    <>
                        <Modal
                            width={640}
                            centered
                            title="Clone Partner Permission"
                            open={open}
                            onCancel={close}
                            footer={[
                                <Flex className="w-full" justify="flex-end" gap={10} key="actions">
                                    <Button
                                        onClick={() => guard(runCopyIcons)}
                                        loading={isCopyingIcons}
                                        disabled={!isValid || isCloning}
                                        className="px-5"
                                    >
                                        Copy Icons Only
                                    </Button>
                                    <Button
                                        type="primary"
                                        danger
                                        onClick={() => guard(p => setConfirmPayload(p))}
                                        loading={isCloning}
                                        disabled={!isValid || isCopyingIcons}
                                        className="px-5"
                                    >
                                        Clone Permission
                                    </Button>
                                    <Button onClick={close} className="px-5">
                                        Close
                                    </Button>
                                </Flex>,
                            ]}
                        >
                            <Form>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12}>
                                        <SelectInput
                                            name="fromPartnerId"
                                            options={partnerData}
                                            placeholder="Select From Partner"
                                            label="From Partner"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} sm={12}>
                                        <SelectInput
                                            name="toPartnerId"
                                            options={targetOptions}
                                            placeholder="Select To Partner"
                                            label="To Partner"
                                            isRequired
                                        />
                                    </Col>
                                </Row>

                                <Alert
                                    type="warning"
                                    showIcon
                                    className="mt-2"
                                    message="Clone Permission replaces the target partner's entire tree"
                                    description="Order, access flags, icons and sub-services are copied from the source. The target partner's existing permissions are overwritten. Copy Icons Only leaves access flags untouched."
                                />

                                {result && (
                                    <Descriptions
                                        size="small"
                                        column={1}
                                        bordered
                                        className="mt-4"
                                        title={
                                            result.kind === 'clone'
                                                ? `Cloned (${result.data.action.toLowerCase()})`
                                                : 'Icons copied'
                                        }
                                    >
                                        {result.kind === 'clone' ? (
                                            <>
                                                <Descriptions.Item label="Services">
                                                    {result.data.cloned.services}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Sub-services">
                                                    {result.data.cloned.subServices}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Icons">
                                                    {result.data.cloned.icons}
                                                </Descriptions.Item>
                                                {result.data.replaced && (
                                                    <Descriptions.Item label="Replaced">
                                                        {result.data.replaced.services} services,{' '}
                                                        {result.data.replaced.subServices}{' '}
                                                        sub-services
                                                    </Descriptions.Item>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Descriptions.Item label="Icons in source">
                                                    {result.data.sourceIconCount}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Copied">
                                                    {result.data.copied}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Already matching">
                                                    {result.data.unchanged}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="Unmatched">
                                                    {result.data.unmatched}
                                                </Descriptions.Item>
                                            </>
                                        )}
                                    </Descriptions>
                                )}

                                {result && result.kind === 'icons' && result.data.copied === 0 && (
                                    <Typography.Text type="secondary">
                                        No icons were copied — the source partner&apos;s tree has
                                        none to give.
                                    </Typography.Text>
                                )}
                            </Form>
                        </Modal>

                        <ConfirmationModal
                            isOpen={confirmPayload !== null}
                            title="Replace this partner's permissions?"
                            description="The target partner's existing permission tree will be overwritten with the source tree, including access flags. This cannot be undone."
                            isLoading={isCloning}
                            handleSubmit={() => confirmPayload && runClone(confirmPayload)}
                            handleCancel={() => setConfirmPayload(null)}
                        />
                    </>
                );
            }}
        </Formik>
    );
};

export default ClonePermissionModal;
