import { Col, Flex, Form, Input, Row } from 'antd';
import { Field, FieldProps } from 'formik';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import PriceTag from './PriceTag';
// import { price } from '../../Hotels/utils/data';

interface AmountFieldProps {
    priceType?: string;
    min_price: string | undefined;
    max_price: string | undefined;
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
    denominations?: number[];
}

const AmountField = ({
    priceType,
    min_price,
    max_price,
    setFieldValue,
    denominations,
}: AmountFieldProps) => {
    const minSellingPrice = Number(min_price) || 0;
    const maxSellingPrice = Number(max_price) || Number.MAX_SAFE_INTEGER;

    const validateAmount = (val: number): string | undefined => {
        if (
            priceType === "FIXED" &&
            denominations &&
            denominations.length > 0 &&
            !denominations.includes(val)
        ) {
            return `Please select a valid amount: ${denominations
                .slice()
                .sort((a, b) => a - b)
                .map(denomination => `  ₹ ${Number(denomination).toFixed(2)}`)
                .join(', ')}`;
        }
        if (val < minSellingPrice || val > maxSellingPrice) {
            return `Please enter a value between ₹ ${minSellingPrice.toFixed(2)} - ₹ ${maxSellingPrice.toFixed(2)}`;
        }
        return undefined;
    };

    const handleClick = (amount: number) => {
        setFieldValue('amount', amount);
    };

    // Formik's field.value is the single source of truth for the input's displayed
    // value (not local state) so it survives AmountField unmounting/remounting when
    // the buy card is collapsed and re-expanded.
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const truncatedValue = inputValue.slice(0, 5); // Truncate to 4 digits

        const parsedValue = parseFloat(truncatedValue);
        if (
            !Number.isNaN(parsedValue) &&
            parsedValue <= maxSellingPrice &&
            truncatedValue.length <= maxSellingPrice.toString().length
        ) {
            setFieldValue('amount', parsedValue);
        } else {
            setFieldValue('amount', '');
        }
    };

    return (
        <Flex className="flex-wrap" gap={8}>
           {priceType === 'FLEXI' ? (
                <Flex className="flex-wrap w-full" gap={5}>
                    <Field name="amount" validate={validateAmount}>
                        {({ field, form, meta }: FieldProps<number>) => (
                            <Form.Item
                                validateStatus={meta.touched && meta.error ? 'error' : ''}
                                help={meta.touched && meta.error ? meta.error : ''}
                                style={{ marginBottom: 0, width: '100%' }}
                            >
                                <Row gutter={[8, 8]} align="middle">
                                    <Col span={24}>
                                        <Input
                                            placeholder="Enter Amount"
                                            prefix={<span style={{ fontWeight: 700, color: '#000' }}>₹</span>}
                                            className="w-full giftcard-amount-input"
                                            style={{
                                                height: '3.25rem',
                                                borderRadius: '0.75rem',
                                                borderColor: '#d7d7d7',
                                                fontSize: '1.25rem',
                                                fontWeight: 600,
                                            }}
                                            name={field.name}
                                            onChange={handleInputChange}
                                            onBlur={() => form.setFieldTouched('amount', true)}
                                            onKeyDown={e => {
                                                // Restrict non-numeric input
                                                if (
                                                    e.key < '0' ||
                                                    (e.key > '9' && e.key !== 'Backspace')
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            value={field.value ?? ''}
                                        />
                                    </Col>
                                    {/* Min/Max helper text below the input */}
                                    {min_price && max_price && (
                                        <Col span={24} className="pt-1 mt-1">
                                            <span className="text-sm text-neutral-600">
                                                Min: ₹ {formatNumberWithLocalString(min_price)},
                                                Max: ₹ {formatNumberWithLocalString(max_price)}
                                            </span>
                                        </Col>
                                    )}
                                </Row>
                            </Form.Item>
                        )}
                    </Field>
                </Flex>
            ) : (
                // FIXED type: amount can only come from the denominations below, so show it in
                // a read-only display box (not editable) rather than a real text input.
                <Flex className="w-full" vertical gap={12}>
                    <Field name="amount" validate={validateAmount}>
                        {({ field, meta }: FieldProps<number>) => {
                            const hasError = meta.touched && meta.error;
                            // Derive selection from the Formik field value (not local state) so it
                            // survives AmountField unmounting/remounting when the card is collapsed.
                            const rawAmount = field.value as unknown;
                            const currentAmount =
                                rawAmount === '' || rawAmount === undefined || rawAmount === null
                                    ? null
                                    : Number(rawAmount);

                            return (
                                <>
                                    <div
                                        className="w-full giftcard-amount-input flex items-center"
                                        style={{
                                            height: '3.25rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid #d7d7d7',
                                            paddingLeft: '11px',
                                            paddingRight: '11px',
                                            fontSize: '1.25rem',
                                            fontWeight: 600,
                                            color: currentAmount ? '#000' : 'rgba(0, 0, 0, 0.25)',
                                        }}
                                    >
                                        {currentAmount
                                            ? `₹ ${formatNumberWithLocalString(currentAmount)}`
                                            : 'Select an amount below'}
                                    </div>
                                    {min_price && max_price && (
                                        <span className="text-sm text-neutral-600 mt-2">
                                            Min: ₹ {formatNumberWithLocalString(min_price)},
                                            Max: ₹ {formatNumberWithLocalString(max_price)}
                                        </span>
                                    )}
                                    <div className="giftcard-price-tag-grid mt-1">
                                        {denominations
                                            ?.slice()
                                            .sort((a, b) => a - b)
                                            .map((price, index) => (
                                                <PriceTag
                                                    key={index}
                                                    price={price}
                                                    onClick={() => handleClick(price)}
                                                    selected={currentAmount === price}
                                                />
                                            ))}
                                    </div>
                                    {hasError && !currentAmount && (
                                        <div style={{ color: 'red' }}>{meta.error}</div>
                                    )}
                                </>
                            );
                        }}
                    </Field>
                </Flex>
            )}
        </Flex>
    );
};

export default AmountField;
