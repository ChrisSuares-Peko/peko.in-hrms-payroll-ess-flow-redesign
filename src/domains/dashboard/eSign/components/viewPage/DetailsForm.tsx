import { useEffect, type FC } from 'react';

import { Button, Flex, Typography } from 'antd';
import { FormikErrors } from 'formik';
import { useNavigate } from 'react-router-dom';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import AdditionalDetailsForm from './AdditionalDetailsForm';
import { setLoading, hideLoader } from '../../../../../slices/loaderSlice';
import { useESignDocument } from '../../hooks/useESignDocument';
import FindError from '../../utils/FindError';

interface DetailsFormProps {
    errors: FormikErrors<any>;
    setExpandedIndex: (index: number | null) => void;
    signersLength: number;
}

const DetailsForm: FC<DetailsFormProps> = ({ errors, setExpandedIndex, signersLength }) => {
    const { isLoading } = useESignDocument();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setLoading({ isLoading }));
        return () => {
            dispatch(hideLoader());
        };
    }, [isLoading, dispatch]);
    const { isDisabled } = useAppSelector(state => state.reducer.eSignDoc);
    return (
        <Flex vertical className="w-full ">
            <AdditionalDetailsForm signersLength={signersLength} />

            <CheckboxInput name="termsofUse" disabled={isDisabled} isRequired>
                By clicking on this, you agree to be bound by our trusted partner’s{' '}
                <Typography.Link href="https://authbridge.com/terms-use/?ref_page=privacy-policy-2" target="_blank">
                    terms of use
                </Typography.Link>{' '}
                and{' '}
                <Typography.Link href="https://authbridge.com/privacy-policy-2/?ref_page=privacy-policy-2" target="_blank">
                    privacy policy
                </Typography.Link>{' '}
                for use of electronic signatures.
            </CheckboxInput>
            {!isDisabled && (
                <Flex gap={10} justify="start" className="w-full md:max-w-5xl">
                    <Button
                        type="primary"
                        htmlType="submit"
                        danger
                        className="mt-5"
                        loading={isLoading}
                        onClick={() => {
                            const firstErrorKey = FindError(errors);
                            if (firstErrorKey && firstErrorKey.startsWith('signers_info')) {
                                const match = firstErrorKey.match(
                                    /signers_info(?:\.|\[)(\d+)(?:\]|\.)?/
                                );
                                if (match && match[1]) {
                                    const signerIndex = parseInt(match[1], 10);
                                    setExpandedIndex(signerIndex);
                                    setTimeout(() => FindError(errors), 200);
                                }
                            }
                        }}
                    >
                        Send Document
                    </Button>
                    <Button
                        type="default"
                        danger
                        className="mt-5"
                        onClick={() => navigate(paths.dashboard.eSign)}
                    >
                        Cancel
                    </Button>
                </Flex>
            )}
        </Flex>
    );
};

export default DetailsForm;
