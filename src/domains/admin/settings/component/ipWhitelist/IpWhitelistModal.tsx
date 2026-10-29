import React, { useState } from 'react';

import { Flex, Form, Skeleton } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useUpdateIpWhitelisting from '../../hooks/useUpdateIpWhitelisting';
import ipWhitelistSchema from '../../schema/ipWhitelisting';
import { refresh } from '../../types/ipWhitelist';

type IpWhitelistModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
};
const IpWhitelistModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: IpWhitelistModalProps & refresh) => {
    const [searchPartner, setSearchPartner] = useState<string>('');
    const { createDoc, isLoading, updateDoc, partnerDatas } =
        useUpdateIpWhitelisting(searchPartner);

    return (
        <CustomModalWithForm
            isLoading={isLoading} // Use combined loading from hooks
            modalTitle="IP Management"
            open={open}
            validationSchema={ipWhitelistSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async (values: any) => {
                let res;
                if (data) res = await updateDoc(values);
                else res = createDoc(values);
                if (res) {
                    setRefresh(true);
                    handleCancel();
                }
            }}
            initialValues={{
                id: data?.id || '',
                ip: data?.ip || '',
                partnerId: data?.partnerId || '',
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <TextInput
                        name="ip"
                        label="IP"
                        type="text"
                        placeholder="Please enter the ip"
                        isRequired
                        maxLength={50}
                        classes="rounded-sm"
                        allowNumbersAndDots
                    />
                    {partnerDatas ? (
                        <SelectInput
                            filterOption={false}
                            allowClear
                            onSearch={setSearchPartner}
                            showSearch
                            isRequired
                            name="partnerId"
                            options={partnerDatas}
                            placeholder="Please select a partner "
                            label="Select Partner"
                        />
                    ) : (
                        <Skeleton.Input active block className="my-2" />
                    )}
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default IpWhitelistModal;
