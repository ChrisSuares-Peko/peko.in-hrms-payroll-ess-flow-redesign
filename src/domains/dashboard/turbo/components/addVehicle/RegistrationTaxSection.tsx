import { EditOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import LabelValue from './LabelValue';
import { capitalizeFirstLetter } from './vehicleDetailsHelpers';

const RegistrationTaxSection = ({ verifyRcResponse, registrationAndTaxDetails, onEdit }: any) => (
    <>
        <Divider />
        <Flex justify="space-between" align="center" className="w-full px-2">
            <Typography.Text className="text-sm font-semibold">Registration & Tax</Typography.Text>
            <Button
                size="small"
                danger
                icon={<EditOutlined />}
                onClick={onEdit}
                className="mb-2"
            >
                Edit
            </Button>
        </Flex>
        {/* Single grid so both rows share the same columns */}
        <div className="grid w-full grid-cols-2 px-2 mt-1 md:grid-cols-4 gap-x-2 gap-y-4">
            {registrationAndTaxDetails.map((item: any, index: number) => (
                <LabelValue key={index} label={item.label} value={item.value} />
            ))}
            <LabelValue
                label="RTO / Authority"
                value={capitalizeFirstLetter(verifyRcResponse?.regAuthority)}
            />
            <LabelValue
                label="Last Service Date"
                value={
                    verifyRcResponse?.lastServiceDate
                        ? dayjs(verifyRcResponse.lastServiceDate).format('DD MMM YYYY')
                        : 'N/A'
                }
            />
            <LabelValue
                label="Next Service Due"
                value={
                    verifyRcResponse?.nextServiceDue
                        ? dayjs(verifyRcResponse.nextServiceDue).format('DD MMM YYYY')
                        : 'N/A'
                }
            />
        </div>
    </>
);

export default RegistrationTaxSection;
