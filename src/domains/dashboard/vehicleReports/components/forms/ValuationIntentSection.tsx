import { Flex } from 'antd';
import { useFormikContext } from 'formik';

import { ValuationFormValues } from '../../types/index';
import RadioCardGroup from '../shared/RadioCardGroup';
import ReportSectionCard from '../shared/ReportSectionCard';

const PURPOSE_OPTIONS = [
    { label: 'I want to buy', value: 'buy' },
    { label: 'I want to Sell', value: 'sell' },
];

const COUNTERPARTY_OPTIONS = [
    { label: 'From individual', value: 'individual' },
    { label: 'From dealer', value: 'dealer' },
];

// "Valuation intent" — why the user wants the valuation, which changes how Droom
// weights the valuation.
const ValuationIntentSection = () => {
    const { values, errors, touched, setFieldValue, setFieldTouched } =
        useFormikContext<ValuationFormValues>();

    return (
        <ReportSectionCard title="Valuation intent">
            <Flex gap={24} className="flex-col lg:flex-row">
                <RadioCardGroup
                    label="Purpose"
                    options={PURPOSE_OPTIONS}
                    value={values.purpose}
                    error={touched.purpose ? errors.purpose : undefined}
                    onChange={value => {
                        setFieldTouched('purpose', true);
                        setFieldValue('purpose', value);
                        // "Buying from" only applies to a purchase.
                        if (value === 'sell') setFieldValue('counterparty', '');
                    }}
                />
                {values.purpose !== 'sell' && (
                    <RadioCardGroup
                        label="Buying from"
                        options={COUNTERPARTY_OPTIONS}
                        value={values.counterparty}
                        error={touched.counterparty ? errors.counterparty : undefined}
                        onChange={value => {
                            setFieldTouched('counterparty', true);
                            setFieldValue('counterparty', value);
                        }}
                    />
                )}
            </Flex>
        </ReportSectionCard>
    );
};

export default ValuationIntentSection;
