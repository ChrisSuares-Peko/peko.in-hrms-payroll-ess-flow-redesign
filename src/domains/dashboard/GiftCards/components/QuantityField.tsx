import { InputNumber } from 'antd';
import { Field, FieldProps } from 'formik';

interface QuantityFieldProps {
    max?: number;
}

const QuantityField = ({ max = 10 }: QuantityFieldProps) => {
    const checkInput = (value: null | number) => {
        if (typeof value === 'string' && Number.isNaN(Number(value))) {
            return '';
        }
        return value;
    };
    return (
        <Field name="quantity">
            {({ field, form }: FieldProps<number>) => (
                <InputNumber
                    min={2}
                    max={max}
                    size="large"
                    type="number"
                    defaultValue={2}
                    className="giftcard-quantity-input"
                    {...field}
                    onBlur={() => {
                        if (!form.touched.quantity) {
                            form.setFieldValue('quantity', field.value);
                            form.setFieldTouched('quantity', true);
                        }
                    }}
                    formatter={value => (value ? `${value}`.replace(/[^\d]/g, '') : '')} // Convert non-numeric characters to spaces
                    parser={value => parseInt(value?.replace(/[^\d]/g, '') || '', 10)} //
                    onChange={value => {
                        const newValue = value; // Save the value directly
                        checkInput(newValue);

                        form.setFieldValue('quantity', newValue);
                    }}
                    onKeyDown={e => {
                        const { key } = e;
                        // Prevent non-numeric input
                        if (
                            !/^\d$/.test(key) &&
                            key !== 'Backspace' &&
                            key !== 'Delete' &&
                            key !== 'ArrowLeft' &&
                            key !== 'ArrowRight'
                        ) {
                            e.preventDefault();
                        }
                    }}
                />
            )}
        </Field>
    );
};

export default QuantityField;
