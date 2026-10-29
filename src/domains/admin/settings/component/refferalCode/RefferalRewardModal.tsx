import { Flex, Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useGetRefferalRewards from '../../hooks/useGetRefferalRewards';
import referal from '../../schema/refferalReward';

type RefferalRewardModalProps = {
    open: boolean;
    handleCancel: () => void;
};

const RefferalRewardModal = ({ open, handleCancel }: RefferalRewardModalProps) => {
    const { isLoading, tableData, updateData } = useGetRefferalRewards(handleCancel);
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Referral Reward Management"
            reinitialise
            open={open}
            validationSchema={referal}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                console.log(values, '<<<<<<<');
                updateData(values);
            }}
            initialValues={{
                reward: tableData?.reward || '',
            }}
        >
            {({ values }) => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        <TextInput
                            name="reward"
                            label="Reward"
                            type="text"
                            placeholder="Please enter refferal reward"
                            isRequired
                            allowNumbersOnly
                            classes=" rounded-sm"
                            maxLength={6}
                        />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default RefferalRewardModal;
