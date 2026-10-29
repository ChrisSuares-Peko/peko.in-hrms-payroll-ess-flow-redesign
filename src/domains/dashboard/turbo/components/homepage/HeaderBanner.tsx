import { useState } from 'react';

import { Alert, Button, DatePicker, Flex, Image, Input, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import SwitchPlanWeb from './SwitchWeb';
import bannerDriver from '../../assets/bannerimg.png';
import banner from '../../assets/Truck.svg';
import { useTurboQuota } from '../../hooks/useTurboQuota';
import useVerify from '../../hooks/useVerifyApi';
import { resetRcResponse, resetResponse, setInputParams } from '../../slices/turboSlice';

// import { paths } from '@src/routes/paths';

const HeaderBanner = ({ inputParams, verifyRcResponse, verifyResponse }: any) => {
  

    const { sm } = useScreenSize();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { verifyApi, loading } = useVerify();
    const { exhausted: quotaExhausted, message: quotaMessage } = useTurboQuota();

    const [identityNo, setIdentityNo] = useState(inputParams?.doc_identity_no || '');
    const [dob, setDob] = useState<any>(inputParams?.dob ? dayjs(inputParams.dob) : null);

    let docType: any;
 

    if (verifyResponse !== null && verifyResponse !== undefined) {
        docType = 'DL';
    } else {
        docType = 'RC';
    }
    const [selectedTab, setSelectedTab] = useState<'RC' | 'DL'>(docType);

    const handleClick = () => {
        const trimmedIdentity = identityNo.trim().toUpperCase();
        const payload = {
            doc_identity_no: identityNo.trim(),
            type: selectedTab.toLowerCase(),
            dob,
        };

        if (selectedTab === 'RC') {
            const rcPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/i;
            if (!trimmedIdentity || !rcPattern.test(trimmedIdentity)) {
                dispatch(
                    showToast({
                        description: `Please enter a valid registration number`,
                        variant: 'error',
                    })
                );
                return;
            }
        } else {
            // Backend expects: 2 uppercase letters + 2 digits + 4 digits (year) + 7 digits = 15 chars
            // e.g. KA0120198900984
            const dlPattern = /^[A-Z]{2}\d{2}\d{4}\d{7}$/;
            if (!trimmedIdentity) {
                dispatch(
                    showToast({
                        description: 'Please enter a valid driving license number',
                        variant: 'error',
                    })
                );
                return;
            }

            if (!dob) {
                dispatch(
                    showToast({
                        description: 'Please select the date of birth',
                        variant: 'error',
                    })
                );
                return;
            }

            if (!dlPattern.test(trimmedIdentity)) {
                dispatch(
                    showToast({
                        description: 'Please enter a valid driving license number.',
                        variant: 'error',
                    })
                );
                return;
            }
        }

        dispatch(setInputParams(payload));
        if (selectedTab === 'RC' && payload.doc_identity_no !== '') {
            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event('vehicle_search_initiated', {
                    vehicle_number: trimmedIdentity,
                });
            }
            dispatch(resetRcResponse());
            verifyApi({
                doc_identity_no: identityNo.trim(),
                type: 'rc',
            }).then(res => {
                if (verifyRcResponse === null || (verifyRcResponse === undefined && res)) {
                    navigate(paths.turbo.addVehicle); // { state: { key: "turbo" } }
                }
            });
        } else {
            dispatch(resetResponse());
            verifyApi({
                doc_identity_no: identityNo.trim(),
                type: 'dl',
                dob: dob.format('YYYY-MM-DD'), // Passing DOB in 'YYYY-MM-DD' format
            }).then(res => {
                if (verifyResponse === null || (verifyResponse === undefined && res)) {
                    navigate(paths.turbo.addDriver);
                }
            });
        }
    };

    return (
        <Flex vertical className="mt-7 ">
            <Flex
                className="px-4 py-4 mb-5 sm:px-8 md:px-14 lg:px-16 sm:py-5 md:py-7 verification-gradient rounded-2xl"
                justify="space-between"
            >
                <Flex vertical className="w-full py-3 sm:w-3/4 lg:w-2/3 xl:w-3/5">
                    <>
                        <Typography.Text className="-mt-2 text-2xl font-medium ">
                            {selectedTab === 'RC' ? 'Search Vehicle' : 'Search Driver'}
                        </Typography.Text>
                        <Typography.Text
                            className="mt-1 text-base "
                            style={{ opacity: selectedTab === 'RC' ? 0 : 1, userSelect: selectedTab === 'RC' ? 'none' : 'auto' }}
                        >
                            Manage your vehicles and assign drivers
                        </Typography.Text>
                    </>
                    {(verifyRcResponse === null || verifyRcResponse === undefined) &&
                        (verifyResponse === null || verifyResponse === undefined) && (
                            <SwitchPlanWeb
                                selectedType={selectedTab}
                                handleChange={setSelectedTab}
                                setIdentityNo={setIdentityNo}
                            />
                        )}

                    {quotaExhausted && (
                        <Alert
                            type="warning"
                            showIcon
                            message={quotaMessage}
                            className="mt-3 hidden"
                        />
                    )}

                    <Flex className="flex-col gap-5 md:flex-row ">
                        <Flex vertical className="w-full">
                            <Typography.Text className="xs:mt-4 md:mt-5">
                                {selectedTab === 'DL'
                                    ? 'Driving License Number'
                                    : 'Registration Number'}
                            </Typography.Text>
                            <Input
                                type="text"
                                placeholder={
                                    selectedTab === 'DL'
                                        ? 'Enter Driving License Number'
                                        : 'Enter Registration Number'
                                }
                                value={identityNo}
                                className="h-10 mt-2 text-black rounded-lg"
                                onChange={e => {
                                    // Strip spaces/symbols first, then cap the length — a browser maxLength
                                    // would count the spaces and cut "HJ 01 ME 5678" down to "HJ01ME5".
                                    const filteredValue = e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/g, '')
                                        .slice(0, selectedTab === 'DL' ? 15 : 10);
                                    setIdentityNo(filteredValue);
                                }}
                                allowClear
                            />
                        </Flex>

                        {selectedTab === 'DL' && (
                            <Flex vertical className="w-full">
                                <Typography.Text className="xs:mt-1 md:mt-5">
                                    Select Date of Birth
                                </Typography.Text>
                                <DatePicker
                                    placeholder="Date of Birth (YYYY-MM-DD)"
                                    format="YYYY-MM-DD"
                                    value={dob}
                                    onChange={date => setDob(date)}
                                    className="w-full h-10 mt-2 sm:w-auto"
                                    inputReadOnly
                                    getPopupContainer={() =>
                                        document.getElementById('datepicker-wrapper')!
                                    }
                                    popupStyle={{ width: '100%', maxWidth: '285px' }}
                                    maxDate={dayjs().subtract(18, 'years')}
                                />
                            </Flex>
                        )}

                        <Tooltip title={quotaExhausted ? quotaMessage : ''} placement="top">
                            <Button
                                type="primary"
                                danger
                                size={sm ? 'middle' : 'small'}
                                onClick={handleClick}
                                loading={loading}
                                disabled={loading || quotaExhausted}
                                className={`text-xs md:px-5 md:text-sm h-10 w-32
        ${selectedTab === 'DL' ? 'xs:mt-3 sm:mt-3 md:mt-[3rem] lg:mt-[3rem] xl:mt-[3.1rem]' : 'xs:mt-3 sm:mt-3 md:mt-[3.1rem]'}
    `}
                            >
                                Search
                            </Button>
                        </Tooltip>
                    </Flex>
                </Flex>
                {selectedTab === 'RC' ? (
                    <Image
                        src={banner}
                        preview={false}
                        className="hidden w-full h-auto mt-2 sm:block sm:w-auto sm:max-h-28 md:max-h-32 xl:max-h-44"
                    />
                ) : (
                    <Image
                        src={bannerDriver}
                        preview={false}
                        className="hidden w-full h-auto mt-2 sm:block sm:w-auto sm:max-h-28 md:max-h-32 xl:max-h-44"
                    />
                )}
            </Flex>
        </Flex>
    );
};

export default HeaderBanner;
