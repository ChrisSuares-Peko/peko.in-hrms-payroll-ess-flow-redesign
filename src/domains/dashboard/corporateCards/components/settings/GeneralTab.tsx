import { Card, Col, Flex, Form, Row, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import AccountClosureCard from './AccountClosureCard';
// import { NotificationControlKey } from '../../api/admin/settingsApi';
// import { useNotificationControls } from '../../hooks/admin/useNotificationControls';
import { isAccountOwner } from '../../utils/activeRole';

const { Text, Title } = Typography;

// const NOTIFICATION_CONTROLS: { key: NotificationControlKey; label: string }[] = [
//     { key: 'requireReceipts', label: 'Require receipts on transactions over ₹5,000' },
//     { key: 'autoDeclineOverLimit', label: 'Auto-decline cards over their monthly limit' },
//     { key: 'notifyPendingKyc', label: 'Notify admins of pending KYC after 48 hours' },
//     { key: 'weeklySpendDigest', label: 'Send weekly spend digest by email' },
// ];

const GeneralTab = () => {
    const user = useAppSelector(state => state.reducer.user.user);
    const { role } = useAppSelector(state => state.reducer.auth);
    // const { controls, isLoading: controlsLoading, saving, toggle } = useNotificationControls();

    const canCloseAccount = isAccountOwner(role);

    return (
        <>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card
                        className="rounded-2xl border-borderCard"
                        styles={{ body: { padding: 24 } }}
                    >
                        <Flex vertical gap={4} className="mb-5">
                            <Title level={5} className="!mb-0 !text-textHeadings">
                                Company
                            </Title>
                            <Text className="text-xs text-textBody">
                                Information shown on cards and statements.
                            </Text>
                        </Flex>
                        <Formik
                            enableReinitialize
                            initialValues={{
                                companyName: user?.companyName ?? '',
                                billingEmail: user?.email ?? '',
                            }}
                            onSubmit={() => {}}
                        >
                            <Form layout="vertical">
                                <TextInput
                                    name="companyName"
                                    type="text"
                                    label="Company name"
                                    placeholder="Not available"
                                    formItemClass="!mb-4"
                                    isDisabled
                                />
                                <TextInput
                                    name="billingEmail"
                                    type="text"
                                    label="Billing email"
                                    placeholder="Not available"
                                    formItemClass="!mb-0"
                                    isDisabled
                                />
                            </Form>
                        </Formik>
                    </Card>
                </Col>

                {/* <Col xs={24} lg={12}>
                    <Card
                        className="rounded-2xl border-borderCard"
                        styles={{ body: { padding: 24 } }}
                    >
                        <Title level={5} className="!mb-5 !text-textHeadings">
                            Notifications &amp; controls
                        </Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={NOTIFICATION_CONTROLS}
                            renderItem={n => (
                                <List.Item key={n.key}>
                                    <Flex justify="space-between" align="center" className="w-full">
                                        <Text className="text-sm text-textBody">{n.label}</Text>
                                        <Switch
                                            checked={controls[n.key]}
                                            loading={saving === n.key}
                                            disabled={controlsLoading}
                                            onChange={next => toggle(n.key, next)}
                                            className="ml-4 shrink-0 [&.ant-switch-checked]:!bg-brandColor"
                                        />
                                    </Flex>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col> */}
            </Row>
            {canCloseAccount && (
                <AccountClosureCard companyName={user?.companyName || 'your company'} />
            )}
        </>
    );
};

export default GeneralTab;
