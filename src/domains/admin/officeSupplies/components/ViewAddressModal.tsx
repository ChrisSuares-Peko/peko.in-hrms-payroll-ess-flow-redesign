import { Descriptions, DescriptionsProps, Flex, Typography } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import GetProducts from '@src/domains/systemUser/ecom_manager/home/utils/GetProducts';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
};

const ViewAddressModal = ({ open, handleCancel, data }: DepartmentModalProps) => {
    const orderResponse = JSON.parse(data.orderResponse);
    const items: DescriptionsProps['items'] = [
        {
            key: '1',
            label: 'Order Id',
            children: <p>{data?.corporateTxnId}</p>,
        },
        {
            key: '2',
            label: 'Customer Name',
            children: <p>{orderResponse?.address?.firstName}</p>,
        },
        {
            key: '3',
            label: 'Category',
            children: <p>Office supplies</p>,
        },
        {
            key: '4',
            label: 'Delivery Status',
            children: (
                <Typography.Text className="capitalize">
                    {data?.ecomOrderStatus.toLowerCase()}
                </Typography.Text>
            ),
        },
        {
            key: '5',
            label: 'Status',
            children: (
                <Typography.Text className="capitalize">
                    {data?.status.toLowerCase()}
                </Typography.Text>
            ),
        },
    ];

    const addressColumn: DescriptionsProps['items'] = [
        {
            key: '1',
            label: 'Address',
            children: <p>{orderResponse?.address?.address}</p>,
        },
        {
            key: '2',
            label: 'Mobile Number',
            children: <p>{orderResponse?.address?.phoneNumber}</p>,
        },
        // {
        //     key: '3',
        //     label: 'Zip Code',
        //     children: <p>Office supplies</p>,
        // },
        {
            key: '3',
            label: 'Remarks',
            children: <p>{orderResponse?.address?.remarks}</p>,
        },
    ];

    return (
        <CustomModalWithForm
            hideFooter
            modalTitle="View Address"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {}}
            initialValues={{
                corporateTxnId: data?.corporateTxnId || '',
                paymentStatus: data?.status || '',
                workspaceOrderStatus: data?.workspaceOrderStatus || '',
            }}
        >
            <Flex vertical className="w-full gap-6">
                <Descriptions bordered size="middle" items={items} column={1} />
                <Descriptions
                    bordered
                    size="middle"
                    title="Address"
                    items={addressColumn}
                    column={1}
                />
                <GetProducts orderResponse={data?.orderResponse} description />
            </Flex>
        </CustomModalWithForm>
    );
};

export default ViewAddressModal;
