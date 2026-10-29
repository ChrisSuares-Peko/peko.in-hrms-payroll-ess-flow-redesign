import { Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';

import TextInput from '@components/atomic/inputs/TextInput';

import SampleDatePicker from '../components/SampleDatePicker';

type dateProps = {
    startdate: any;
};
const { Text } = Typography;

const InvoiceDetailsForm = ({ startdate }: dateProps) => {
    const isPastDate = dayjs(startdate).isBefore(dayjs(), 'day');
    const minDueDate = isPastDate ? dayjs().add(1, 'day') : dayjs(startdate).add(1, 'day');

    return (
        <Flex vertical gap={18}>
            <Text className="text-lg font-semibold">Invoice Details:</Text>
            <Form layout="vertical" className="w-full">
                <Flex vertical>
                    <TextInput
                        name="invoiceNo"
                        placeholder="Invoice Number"
                        label="Invoice Number"
                        type="text"
                        maxLength={10}
                        isRequired
                    />
                    <SampleDatePicker
                        name="invoiceDate"
                        placeholder="Invoice Date"
                        label="Invoice Date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                    />
                    <SampleDatePicker
                        name="dueDate"
                        placeholder="Due Date"
                        label="Due Date"
                        classes="w-full"
                        needConfirm={false}
                        minDate={minDueDate}
                        isDisabled={!startdate}
                        isRequired
                    />
                </Flex>
            </Form>
        </Flex>
    );
};

export default InvoiceDetailsForm;
