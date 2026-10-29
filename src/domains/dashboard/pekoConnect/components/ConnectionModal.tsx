import React, { memo, useCallback, useState } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Modal, Row, Select, Tooltip, Typography } from 'antd';

import { useGetCorporates } from '../hooks/useGetCorporates';
import usePostRequest from '../hooks/usePostRequest';

interface modalProps {
    visible: boolean;
    onCancel: any;
    refresh: () => void;
}

const { Text } = Typography;
const { Item } = Form;

const ConnectionModal = ({ onCancel, visible, refresh }: modalProps) => {
    const [id, setId] = useState('');
    const [message, setMessage] = useState('');
    const { handlePostRequest, isLoading } = usePostRequest();
    const handleConnectionRequest = useCallback(async () => {
        if (!id || !message) return;
        await handlePostRequest({ receiverId: id, message });
        refresh();
        onCancel();
        setId('');
        setMessage('');
    }, [id, message, handlePostRequest, refresh, onCancel]);

    const [searchText, setSearchText] = useState('');
    const { corporates: options, isLoading: isLoadingProfiles } = useGetCorporates({ searchText });
    const validateMessage = (_: any, value: string) => {
        if (!value || value.trim() === '') {
            return Promise.reject(new Error('Please enter a message'));
        }
        return Promise.resolve();
    };
    return (
        <Modal
            open={visible}
            title="Invite a connection"
            onCancel={onCancel}
            footer={null}
            className="no-border-radius"
        >
            <Form<any> initialValues={{}}>
                <Row gutter={16} className="mt-6">
                    <Col span={24}>
                        <Text className="text-sm font-roboto">
                            Company Name or Peko ID
                            <Tooltip title="Peko ID is the Peko Account Number in the Profile">
                                <InfoCircleOutlined className="mx-1 text-gray-500" />
                            </Tooltip>
                        </Text>
                        <Item
                            name="name"
                            rules={[
                                { required: true, message: 'Please enter company name/peko ID' },
                            ]}
                        >
                            <Select
                                showSearch
                                loading={isLoadingProfiles}
                                placeholder="Enter company name or Peko ID"
                                options={options}
                                onChange={val => setId(val)}
                                filterOption={(input: string, option) =>
                                    ((option?.label ?? '') as string)
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }
                                onSearch={setSearchText}
                                notFoundContent={
                                    searchText.length > 3 && !isLoadingProfiles ? (
                                        <div>No result Found</div>
                                    ) : null
                                }
                            />
                        </Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Text className="text-sm font-roboto">Message</Text>
                        <Item
                            name="Message"
                            rules={[
                                // { required: true, message: 'Please enter a message' },
                                { validator: validateMessage },
                            ]}
                        >
                            <Input.TextArea
                                placeholder="Enter message"
                                rows={3}
                                onChange={e => setMessage(e.target.value.trim())}
                            />
                        </Item>
                    </Col>
                </Row>

                <Row justify="end">
                    <Col>
                        <Item>
                            <Button
                                loading={isLoading}
                                onClick={handleConnectionRequest}
                                type="primary"
                                htmlType="submit"
                                className="rounded-sm bg-bgOrange2"
                            >
                                Send
                            </Button>
                            <Button
                                onClick={onCancel}
                                style={{ marginLeft: 8 }}
                                className="rounded-sm"
                            >
                                Cancel
                            </Button>
                        </Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default memo(ConnectionModal);
