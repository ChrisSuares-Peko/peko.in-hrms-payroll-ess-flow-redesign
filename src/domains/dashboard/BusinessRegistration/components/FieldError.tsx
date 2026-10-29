import { Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

const { Text } = Typography;

// Inline validation message for custom (non Form.Item) fields — file uploads,
// toggle cards, the activity picker. data-form-error matches the Next-click
// scroll-to-first-error selector.
const FieldError = ({ name }: { name: string }) => {
    const { errors, touched } = useFormikContext<Record<string, unknown>>();
    const error = getIn(errors, name);
    const isTouched = getIn(touched, name);
    if (!isTouched || typeof error !== 'string') return null;
    return (
        <Text data-form-error="true" className="!text-[13px] !text-[#ff4d4f]">
            {error}
        </Text>
    );
};

export default FieldError;
