import { Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';

import CustomTextArea from '../CustomTextArea';
import SampleDatePicker from '../SampleDatePicker';

type dateProps = {
    startdate: any;
};

const { Text } = Typography;

const InvoiceDetailsFormCreate = ({ startdate }: dateProps) => {
    const isPastDate = dayjs(startdate).isBefore(dayjs(), 'day');
    const minDueDate = isPastDate ? dayjs().add(1, 'day') : dayjs(startdate).add(1, 'day');

    return (
        <Flex vertical gap={18} className="w-full">
            <Text className="font-semibold">Invoice Details</Text>
            <Form className="w-full">
                <Flex vertical className="flex flex-col w-full gap-4">
                    <CustomTextArea
                        name="invoiceNo"
                        placeholder="Enter Invoice Number"
                        label="Invoice Number"
                        type="text"
                        maxLength={10}
                        isRequired
                    />
                    <SampleDatePicker
                        name="invoiceDate"
                        placeholder="Invoice Date"
                        classes="py-2 px-3 border border-gray-200 rounded-xl w-full mb-0"
                        needConfirm={false}
                        isRequired
                        fromItemClasses="mb-0"
                    />
                    <SampleDatePicker
                        name="dueDate"
                        placeholder="Due Date"
                        classes="py-2 px-3 border border-gray-200 rounded-xl w-full"
                        needConfirm={false}
                        minDate={minDueDate}
                        isDisabled={!startdate}
                        isRequired
                        fromItemClasses="mb-0"
                    />
                </Flex>
            </Form>
        </Flex>
    );
};

export default InvoiceDetailsFormCreate;
