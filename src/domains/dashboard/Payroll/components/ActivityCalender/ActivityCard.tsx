import React,{useState} from 'react';

import { Button, Col, Divider, Flex, Row, Tag, Typography, Skeleton } from 'antd';
import { useDispatch } from 'react-redux';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { showToast } from '@src/slices/apiSlice';

import { useSendEmail } from '../../hooks/dashboardHooks/useEmailSendApi';


type Props = {
    data: any;
    setRefresh: (value: any) => void;
    isLoading: boolean;
};

const ActivityCard = ({ data, setRefresh, isLoading }: Props) => {
    const dispatch = useDispatch();
    const [sendEmailModal,setSendEmailModal] = useState<false | string>(false)
    const { sendEmails, isLoading: emailLoading } = useSendEmail();
    const handleSubmit = async () => {
        const res = await sendEmails(sendEmailModal as string);
        if (res === true) {
            setRefresh(true);
            setSendEmailModal(false)
            dispatch(
                showToast({
                    description: 'Email sent to employees',
                    variant: 'success',
                })
            );
        }
    };
    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 12 }} />;
    }

    return (
        <>
            {data?.map((item: any, i: any) => (
                <>
                    <Row key={item.id} className="px-5" gutter={[20, 20]} align="bottom">
                        <Col>
                            <Flex vertical gap={10}>
                                <Typography.Text>{item.title}</Typography.Text>
                                <Typography.Text className="text-iconRed ">
                                    {item.start.substring(0, 10)}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={8} md={20} xl={12} xxl={10}>
                            {!item.isEmailSent &&
                                !item.sendPriorEmail &&
                                item.activityType === 'HOLIDAY' && (
                                    <Button
                                        className="w-42 max-w-42"
                                        type="default"
                                        size="small"
                                        loading={emailLoading}
                                        danger
                                        onClick={() => setSendEmailModal(item.id)}
                                    >
                                        <Typography.Text className="text-[0.8rem] text-textRed">
                                            Send mail to employees
                                        </Typography.Text>
                                    </Button>
                                )}
                            {item.isEmailSent && item.activityType === 'HOLIDAY' && (
                                <Tag
                                    className="w-32"
                                    style={{
                                        cursor: 'default',
                                        pointerEvents: 'none',
                                        color: '#b10000',
                                    }}
                                >
                                    <Typography.Text className="text-[0.8rem] text-textRed">
                                        Email has been sent
                                    </Typography.Text>
                                </Tag>
                            )}
                        </Col>
                    </Row>
                    {i < data.length - 1 && <Divider />}
                    <ConfirmationModal isLoading={emailLoading} handleSubmit={handleSubmit}  handleCancel={()=>setSendEmailModal(false)} isOpen={Boolean(sendEmailModal)} title='Do you want to notify all employees of this holiday?'/>
                </>
            ))}
        </>
    );
};

export default ActivityCard;
