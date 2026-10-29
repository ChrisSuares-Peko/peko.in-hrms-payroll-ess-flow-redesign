import React from 'react';

import { Badge, Descriptions } from 'antd';
import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';
// import { ReactSVG } from 'react-svg';


const SuccessTable = () => {
    const { complaintResponse } = useAppSelector(state => state.reducer.beneficiary);
    const formattedDate = dayjs(complaintResponse?.transactionDate).format(
        'MMMM DD YYYY hh:mm:ss A'
    );

    return (
        <>
            <Descriptions bordered size="middle" column={1} className="w-2/3 mt-3 pg-success-table">
                {/* <Descriptions.Item label="Date">10/10/2025</Descriptions.Item> */}
                <Descriptions.Item label="Type of Complaint">{formattedDate}</Descriptions.Item>
                <Descriptions.Item label="Type of Complaint">
                    {complaintResponse?.complaintData?.complaintType}
                </Descriptions.Item>

                <Descriptions.Item label="B-Connect Transaction ID">
                    {complaintResponse?.complaintData?.txnRefId}
                </Descriptions.Item>
                <Descriptions.Item label="Complaint ID">
                    {complaintResponse?.complaintId}
                </Descriptions.Item>
                <Descriptions.Item label="Complaint Assigned">
                    {complaintResponse?.complaintAssigned}
                </Descriptions.Item>
                <Descriptions.Item label="Complaint Status">
                    <Badge
                        status="warning"
                        text="Assigned"
                        className="px-2 rounded-2xl"
                        style={{
                            color: '#B78912',
                            backgroundColor: '#FFFDD4',
                            padding: '2px 7px',
                            border: '1px ',
                            borderRadius: '15px',
                        }}
                    />
                </Descriptions.Item>

                {/* <Descriptions.Item label="Expiry Date">{expires_at}</Descriptions.Item> */}
            </Descriptions>
            {/* <Flex align="center" gap={10}>
                <Text>Share payment link through </Text>
                <Button danger type="text" onClick={() => setModalVisible(true)}>
                    <ReactSVG src={email} />
                </Button>
            </Flex> */}
        </>
    );
};
export default SuccessTable;
