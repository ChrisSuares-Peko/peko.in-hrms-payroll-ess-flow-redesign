import React from 'react';

import { Button, Flex, Typography } from 'antd';
import { FieldArray } from 'formik';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import SignerDetailsForm from './SignerDetailsForm';
import { addSigner } from '../../slices/eSignDocSlice';
import { SignerDetailsTypes } from '../../types';

type SignerDetailsProps = {
    values: SignerDetailsTypes[];
    expandedIndex: number | null;
    setExpandedIndex: (index: number | null) => void;
};

const SignerDetails: React.FC<SignerDetailsProps> = ({
    values,
    expandedIndex,
    setExpandedIndex,
}) => {
    const dispatch = useAppDispatch();
    const { isDisabled } = useAppSelector(state => state.reducer.eSignDoc);
    const handleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };
    const handleAddSigner = (push: (value: any) => void) => {
        const newIndex = values.length;
        push({
            sequence: newIndex + 1,
            signer_index: newIndex,
            signer_name: '',
            signer_email: '',
            // signer_mobile: '',
            signingPolicy: 'QUICKSIGN',
        });
        setExpandedIndex(newIndex);
        dispatch(addSigner());
    };
    const handleRemoveSigner = (remove: (index: number) => void, index: number) => {
        remove(index);
        const newExpandedIndex = index > 0 ? index - 1 : 0;
        setExpandedIndex(newExpandedIndex);
    };
    return (
        <Flex vertical className="w-full mt-5 md:mt-0" gap={20}>
            <Flex justify="space-between" align="center" className="w-full">
                {!isDisabled ? (
                    <>
                        <Typography.Text className="text-lg font-medium">
                            Add Signers
                        </Typography.Text>
                        <FieldArray name="signers_info">
                            {({ push }) =>
                                values.length < 8 && (
                                    <Button
                                        danger
                                        disabled={isDisabled}
                                        onClick={() => handleAddSigner(push)}
                                    >
                                        Add New Signer
                                    </Button>
                                )
                            }
                        </FieldArray>
                    </>
                ) : (
                    <Flex justify="space-between" align="center" className="w-full">
                        <Typography.Text className="text-lg font-medium">Signers</Typography.Text>
                        {/* <Typography.Text className="text-neutral-400 text-sm font-normal">
                            {signers_info.length} Added
                        </Typography.Text> */}
                    </Flex>
                )}
            </Flex>

            <FieldArray name="signers_info">
                {({ remove }) => (
                    <>
                        {values.map((_, index) => (
                            <Flex key={index} justify="space-between" align="center">
                                <SignerDetailsForm
                                    index={index}
                                    removeSigner={() => handleRemoveSigner(remove, index)}
                                    isExpanded={expandedIndex === index}
                                    onExpand={() => handleExpand(index)}
                                />
                            </Flex>
                        ))}
                    </>
                )}
            </FieldArray>
        </Flex>
    );
};

export default SignerDetails;
