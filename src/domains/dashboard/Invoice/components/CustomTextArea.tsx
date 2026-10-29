import { Flex } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

type Props = {
    name: string;
    placeholder: string;
    label: string;
    type?: string;
    isRequired?: boolean;
    maxLength?: number;
    allowNumbersOnly?: boolean;
    minLength?: number;
    needConfirm?: boolean;
    allowTwoDecimalsOnly?: boolean;
    isDisabled?: boolean;
};

const CustomTextArea = ({
    name,
    placeholder,
    label,
    type,
    isRequired,
    maxLength,
    ...rest
}: Props) => (
    <Flex className="w-full ">
        <TextInput
            formItemClass="mb-0 w-full"
            classes="py-2 px-3 border border-gray-200 rounded-xl"
            name={name}
            placeholder={placeholder}
            type={type || 'text'}
            isRequired
            maxLength={maxLength}
            {...rest}
        />
    </Flex>
);

export default CustomTextArea;
