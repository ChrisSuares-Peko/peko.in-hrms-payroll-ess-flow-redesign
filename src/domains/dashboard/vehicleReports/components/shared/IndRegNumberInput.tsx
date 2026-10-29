import { Input, Typography } from 'antd';
import { useFormikContext } from 'formik';

interface Props {
    name: string;
    label?: string;
}

// Registration-number field with a non-editable `IND` country chip, per the
// vehicle-history and inspection frames. The atomic TextInput has no prefix slot,
// so this wraps a raw antd Input against Formik directly.
const IndRegNumberInput = ({ name, label = 'Registration number' }: Props) => {
    const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext<
        Record<string, string>
    >();
    const error = touched[name] ? errors[name] : undefined;

    return (
        <div className="flex flex-col gap-2">
            <Typography.Text className="text-sm text-[#475569]">{label}</Typography.Text>
            <Input
                size="large"
                value={values[name] ?? ''}
                status={error ? 'error' : undefined}
                onChange={event =>
                    setFieldValue(name, event.target.value.toUpperCase().replace(/\s/g, ''))
                }
                onBlur={() => setFieldTouched(name, true)}
                prefix={
                    <span className="-ml-[7px] mr-2 self-stretch rounded-l-lg border-r border-[#E4E4E7] bg-[#F7F8FA] px-3 py-[7px] text-sm font-medium text-[#42526D]">
                        IND
                    </span>
                }
                className="[&_.ant-input-prefix]:items-stretch"
            />
            {!!error && (
                <Typography.Text className="text-xs text-[#FF4F4F]">{error}</Typography.Text>
            )}
        </div>
    );
};

export default IndRegNumberInput;
