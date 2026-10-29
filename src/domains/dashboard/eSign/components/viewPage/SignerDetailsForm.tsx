import { useEffect, useState } from 'react';

import { DeleteOutlined, RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';
import { ReactSVG } from 'react-svg';
// import INDFlag from '@assets/svg/INflag.svg';

import TextInput from '@components/atomic/inputs/TextInput';
import signVerifiedGreen from '@domains/dashboard/eSign/assets/signVerified.svg';
import signVerifiedYellow from '@domains/dashboard/eSign/assets/signVerifiedYellow.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import ResendButton from './ResendButton';
import StatusBadge from './StatusBadge';
import { useESignDocument } from '../../hooks/useESignDocument';
import { setRemoveSigner, removeSignerArray } from '../../slices/eSignDocSlice';
import { FormValues, SavedSignersTypes } from '../../types';

interface SignerDetailsFormProps {
    index: number;
    removeSigner: (index: number) => void;
    isExpanded: boolean;
    onExpand: () => void;
}

const SignerDetailsForm = ({
    index,
    removeSigner,
    isExpanded,
    onExpand,
}: SignerDetailsFormProps) => {
    const { md } = useScreenSize();
    const { isDisabled, pageNumbers, signers_info, sequentialSignature, signerCo, status } =
        useAppSelector(state => state.reducer.eSignDoc);
    const { isLoading, resendInvitation } = useESignDocument();
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        // Check if the device supports touch
        const hasTouchSupport = 'ontouchstart' in document.documentElement;
        setIsTouchDevice(hasTouchSupport);
    }, []);
    const { errors, values, validateForm } = useFormikContext<FormValues>();
    const dispatch = useAppDispatch();
    const options = [{ label: 'All', value: 'all' }];
    if (pageNumbers) {
        // eslint-disable-next-line no-plusplus
        for (let i = 1; i <= pageNumbers; i++) {
            options.push({
                label: i.toString(),
                value: i.toString(),
            });
        }
    }

    const handleResendInvitation = async (indexNo: number) => {
        try {
            const errorsRes = await validateForm();
            if (Object.keys(errorsRes).length > 0) return;

            const email = values?.signers_info?.[index]?.signer_email;
            const name = values?.signers_info?.[index]?.signer_name;
            if (!email || !name) return;

            resendInvitation(indexNo, name, email);
        } catch (err) {
            console.error(err);
        }
    };
    const handleDragStart = (e: any, signer: SavedSignersTypes) => {
        const canDrag = signer.signer_name && signer.signer_email;
        if (!canDrag) {
            e.preventDefault();
            return;
        }
        e?.dataTransfer?.setData('signer', JSON.stringify(signer));
        e?.dataTransfer?.setData('startX', e.clientX.toString());
        e?.dataTransfer?.setData('startY', e.clientY.toString());
    };
    const handleDeleteSigner = () => {
        // Dispatch the action to remove the signer by index from redux
        dispatch(setRemoveSigner(index.toString()));
        dispatch(removeSignerArray(index));
        // Removing the signer from the local UI list
        removeSigner(index);
        dispatch(
            showToast({
                description: 'Signer removed successfully.',
                variant: 'success',
            })
        );
    };

    const signerStatus = signers_info[index]?.status;
    const anySignerDeclined = signers_info.some(s => s.status === 'declined');
    let statusValue = 'PENDING';
    if (signerStatus === 'signed') {
        statusValue = 'COMPLETED';
    } else if (signerStatus === 'declined') {
        statusValue = 'DECLINED';
    }

    return (
        <Flex vertical className="w-full">
            <Flex
                className={`w-full rounded-[.4rem] border pt-3 px-5 pb-3  ${!errors.signers_info?.[index] || isDisabled ? 'border-gray-200' : 'border-[#FF3A3A]'}`}
            >
                <Flex className="flex-col w-full">
                    <Flex
                        className="w-full cursor-pointer"
                        justify="space-between"
                        align="center"
                        onClick={onExpand}
                    >
                        <Flex justify="center" align="center">
                            <Typography.Text className="font-medium">
                                Signer {index + 1}
                            </Typography.Text>
                            {isDisabled ? (
                                <StatusBadge status={statusValue} />
                            ) : (
                                !errors.signers_info?.[index] && (
                                    <Flex justify="center" align="center" className="ml-2">
                                        <ReactSVG
                                            src={
                                                (signerCo?.[index] || []).length > 0
                                                    ? signVerifiedGreen
                                                    : signVerifiedYellow
                                            }
                                        />
                                    </Flex>
                                )
                            )}
                        </Flex>
                        <RightOutlined className={`text-lg ${isExpanded ? 'rotate-90' : ''}`} />
                    </Flex>

                    {isExpanded && (
                        <Flex className="flex-col mt-3">
                            <TextInput
                                name={`signers_info[${index}].signer_name`}
                                placeholder="Enter Signer Name"
                                label="Signer Name"
                                type="text"
                                isRequired
                                isDisabled={isDisabled}
                                allowAlphabetsAndSpaceOnly
                                maxLength={50}
                            />

                            <TextInput
                                name={`signers_info[${index}].signer_email`}
                                placeholder="Enter Signer Email"
                                label="Signer Email"
                                type="text"
                                isRequired
                                isDisabled={isDisabled}
                                allowEmailsOnly
                                maxLength={50}
                                classes="scrollable-input"
                            />

                            {/* <TextInput
                                name={`signers_info[${index}].signer_mobile`}
                                placeholder="Mobile Number"
                                label="Mobile Number"
                                type="text"
                                allowNumbersOnly
                                maxLength={10}
                                isDisabled={isDisabled}
                                prefix={
                                    <Flex
                                        align="center"
                                        gap={6}
                                        className="p-[.43rem] h-full border-e me-2 cursor-not-allowed"
                                    >
                                        <img src={INDFlag} alt="" />
                                        <p>+91</p>
                                    </Flex>
                                }
                                classes=" p-0 "
                            /> */}

                            {!isDisabled &&
                                values.signers_info?.[index]?.signer_name &&
                                values.signers_info?.[index]?.signer_email && (
                                    <Flex justify="center" align="center" vertical className="">
                                        <div
                                            draggable={!errors.signers_info?.[index]}
                                            onDragStart={e => {
                                                const dragImage = document.createElement('div');
                                                dragImage.style.width = '110px';
                                                dragImage.style.height = '40px';
                                                dragImage.style.backgroundColor = 'transparent';
                                                dragImage.style.position = 'absolute';
                                                dragImage.style.top = '-9999px';
                                                dragImage.style.pointerEvents = 'none';

                                                document.body.appendChild(dragImage);
                                                e.dataTransfer.setDragImage(dragImage, 0, 0);

                                                handleDragStart(e, {
                                                    signer_index: index,
                                                    signer_name: `Signer ${index + 1}`,
                                                    signer_email:
                                                        values.signers_info?.[index]?.signer_email,
                                                    // signer_mobile:
                                                    //     values.signers_info?.[index]?.signer_mobile,
                                                });

                                                // Remove the drag image after the drag starts
                                                setTimeout(
                                                    () => document.body.removeChild(dragImage),
                                                    0
                                                );
                                            }}
                                            className={`rounded-md p-2 w-full   border-[#05BE63] bg-[#D9EECC] ${
                                                !errors.signers_info?.[index]
                                                    ? 'cursor-pointer'
                                                    : 'cursor-default'
                                            }`}
                                            style={{
                                                borderRadius: '0',
                                                borderWidth: '2px',
                                                borderStyle: 'solid',
                                                borderColor: '#05BE63',
                                            }}
                                        >
                                            <Flex justify="center" align="center">
                                                <Typography.Text className="font-medium text-[1rem] text-center">
                                                    {`Signer ${index + 1}`}
                                                </Typography.Text>
                                            </Flex>
                                            <Flex justify="center" align="center">
                                                <Typography.Text className="font-normal text-[.75rem] text-[#8E8E8E] text-center">
                                                    {isTouchDevice || !md
                                                        ? "(Double-tap the document and choose 'Signer' from the dropdown menu.)"
                                                        : '(Drag and drop to the document)'}
                                                </Typography.Text>
                                            </Flex>
                                        </div>
                                    </Flex>
                                )}
                            {!isDisabled && (
                                <Flex vertical justify="center" align="center" className="mt-3">
                                    <DeleteOutlined
                                        onClick={index === 0 ? undefined : handleDeleteSigner}
                                        className={`text-xl ${index === 0 ? 'cursor-not-allowed text-gray-400' : 'text-red-500'}`}
                                        disabled={index === 0}
                                    />
                                </Flex>
                            )}

                            {isDisabled && status !== 'COMPLETED' && !anySignerDeclined && signerStatus !== 'signed' && (
                                <Flex vertical align="start" className="mt-3">
                                    <ResendButton
                                        signers_info={signers_info}
                                        sequentialSignature={sequentialSignature}
                                        index={index}
                                        resendInvitation={handleResendInvitation}
                                        isLoading={isLoading}
                                    />
                                </Flex>
                            )}
                        </Flex>
                    )}
                </Flex>
            </Flex>
            {!isDisabled && (
                <Flex>
                    {(typeof errors.signers_info === 'string' ||
                        (Array.isArray(errors.signers_info) && errors.signers_info[index])) && (
                        <Flex justify="center" align="center" className="mt-3">
                            <Typography.Text className="text-[#ff4d4f]">
                                {typeof errors.signers_info === 'string'
                                    ? errors.signers_info
                                    : 'Please fill the signer details'}
                            </Typography.Text>
                        </Flex>
                    )}
                </Flex>
            )}
        </Flex>
    );
};

export default SignerDetailsForm;
