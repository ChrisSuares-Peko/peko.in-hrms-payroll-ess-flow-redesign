import { forwardRef, useImperativeHandle, useRef } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Flex } from 'antd';
import { Formik, FormikProps } from 'formik';

import ItemsForm from '../../forms/generateIrn/ItemsForm';
import { itemsSchema } from '../../schema/generateIrn/itemsSchema';
import { ItemsFormValues, LineItem, StepHandle } from '../../types/generateIrn';
import { calcCgst, calcIgst, calcTaxable, calcTotal } from '../../utils/generateIrnCalculations';
import { formatAmount } from '../../utils/helperFunctions';
import LabelValueRow from '../shared/LabelValueRow';

const newItem = (): LineItem => ({
    id: String(Date.now()),
    description: '',
    hsnSac: '',
    quantity: 1,
    unit: 'PCS',
    unitPrice: 0,
    discount: 0,
    gstRate: 18,
});

interface Props {
    initialValues: ItemsFormValues;
    onNext: (values: ItemsFormValues) => void;
    igstOnIntra: boolean;
}

const ItemsStep = forwardRef<StepHandle, Props>(({ initialValues, onNext, igstOnIntra }, ref) => {
    const formikRef = useRef<FormikProps<ItemsFormValues>>(null);

    useImperativeHandle(ref, () => ({
        submit: async () => {
            await formikRef.current?.submitForm();
        },
        getValues: () => formikRef.current?.values,
    }));

    return (
        <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={itemsSchema}
            onSubmit={onNext}
        >
            {({ values, setFieldValue }) => {
                const totalTaxable = values.items.reduce((sum, it) => sum + calcTaxable(it), 0);
                const totalIgst = values.items.reduce((sum, it) => sum + calcIgst(it), 0);
                const totalCgst = values.items.reduce((sum, it) => sum + calcCgst(it), 0);
                const invoiceTotal = values.items.reduce((sum, it) => sum + calcTotal(it), 0);

                return (
                    <Flex vertical gap={16}>
                        <ItemsForm igstOnIntra={igstOnIntra} />

                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => setFieldValue('items', [...values.items, newItem()])}
                            className="h-10 text-sm font-medium text-[#FF4F4F] border-[#FF4F4F] hover:!text-[#e03e3e] hover:!border-[#e03e3e]"
                        >
                            Add New Item
                        </Button>

                        {values.items.length > 0 && (
                            <Flex className="rounded-xl bg-[#F9FAFB] p-4">
                                <Flex vertical gap={8} className="w-full sm:w-auto sm:ml-auto sm:min-w-[300px]">
                                    <LabelValueRow
                                        label="Total Taxable Value"
                                        value={formatAmount(totalTaxable)}
                                    />
                                    {igstOnIntra ? (
                                        <LabelValueRow
                                            label="Total IGST"
                                            value={formatAmount(totalIgst)}
                                        />
                                    ) : (
                                        <>
                                            <LabelValueRow
                                                label="Total CGST"
                                                value={formatAmount(totalCgst)}
                                            />
                                            <LabelValueRow
                                                label="Total SGST"
                                                value={formatAmount(totalCgst)}
                                            />
                                        </>
                                    )}
                                    <Divider className="my-1" />
                                    <LabelValueRow
                                        label="Invoice Total"
                                        value={formatAmount(invoiceTotal)}
                                        bold
                                    />
                                </Flex>
                            </Flex>
                        )}
                    </Flex>
                );
            }}
        </Formik>
    );
});

ItemsStep.displayName = 'ItemsStep';

export default ItemsStep;
