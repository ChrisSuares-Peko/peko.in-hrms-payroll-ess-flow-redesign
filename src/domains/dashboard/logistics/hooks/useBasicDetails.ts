import { useCallback } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useSaveAddressApi } from './useSaveAddressApi';
import { setDestinationAddress, setOriginAddress } from '../slice/logisticsSlice';
import { AddressFormValues, RecieverFormValues, SenderFormValues } from '../types/address';

export const useBasicDetails = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // const { handleSenderAddress, handleRecieverAddress } = useSaveAddressApi();
    const { handleCreateMerchantProfile } = useSaveAddressApi();

    const handleFormSubmit = useCallback(
        ({
            senderSaveAddress,
            recieverSaveAddress,
            senderEmail,
            recieverEmail,
            shipmentType,
            senderAddress,
            senderCity,
            senderName,
            senderCountry,
            senderPhone,
            senderRemark,
            senderZipCode,
            senderState,
            recieverName,
            recieverAddress,
            recieverPhone,
            recieverCity,
            recieverCountry,
            recieverZipCode,
            recieverRemark,
            recieverState,
        }: AddressFormValues) => {
            dispatch(
                setOriginAddress({
                    Line1: senderName,
                    Line2: senderAddress,
                    Line3: senderPhone.toString(),
                    City: senderCity,
                    CountryCode: senderCountry,
                    Description: senderEmail,
                    PostCode: senderZipCode,
                    Remark: senderRemark,
                    State: senderState,
                })
            );

            dispatch(
                setDestinationAddress({
                    Line1: recieverName,
                    Line2: recieverAddress,
                    Line3: recieverPhone.toString(),
                    City: recieverCity,
                    CountryCode: recieverCountry,
                    Description: recieverEmail,
                    PostCode: recieverZipCode,
                    Remark: recieverRemark,
                    State: recieverState,
                })
            );
           
            if (senderSaveAddress) {
                handleCreateMerchantProfile({
                    Line1: senderName,
                    Line2: senderAddress,
                    Line3: senderPhone,
                    City: senderCity,
                    CountryCode: senderCountry,
                    Description: senderEmail,
                    PostCode: senderZipCode,
                    State: senderState,
                });
            }
            if (recieverSaveAddress) {
                // handleRecieverAddress({
                //     Line1: recieverName,
                //     Line2: recieverAddress,
                //     Line3: recieverPhone,
                //     City: recieverCity,
                //     CountryCode: recieverCountry,
                //     Description: recieverEmail,
                //     PostCode: recieverZipCode,
                //     State: recieverState,
                // });
            }
            navigate('/logistics/details');
        },
        [dispatch, handleCreateMerchantProfile, navigate] // have to add handleRecieverAddress in case also handleSenderAddress
    );

    const handleFormRecieverSubmit = useCallback(
        (values: RecieverFormValues) =>
            new Promise((resolve, reject) => {
                try {
                    dispatch(
                        setDestinationAddress({
                            Line1: values.recieverName,
                            Line2: values.recieverAddress,
                            Line3: values.recieverPhone.toString(),
                            City: values.recieverCity,
                            CountryCode: values.recieverCountry,
                            Description: values.recieverEmail,
                            PostCode: values.recieverZipCode,
                            State: values.recieverState,
                            Remark: values.recieverRemark,
                        })
                    );

                    if (values.recieverSaveAddress) {
                        // handleRecieverAddress({
                        //     Line1: values.recieverName,
                        //     Line2: values.recieverAddress,
                        //     Line3: values.recieverPhone,
                        //     City: values.recieverCity,
                        //     CountryCode: values.recieverCountry,
                        //     Description: values.recieverEmail,
                        //     PostCode: values.recieverZipCode,
                        //     State: values.recieverState,
                        // });
                    }

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            }),
        [dispatch] // have to add handleRecieverAddress
    );

    const handleFormSenderSubmit = useCallback(
        (values: SenderFormValues) =>
            new Promise((resolve, reject) => {
                try {
                    dispatch(
                        setOriginAddress({
                            Line1: values.senderName,
                            Line2: values.senderAddress,
                            Line3: values.senderPhone.toString(),
                            City: values.senderCity,
                            CountryCode: values.senderCountry,
                            Description: values.senderEmail,
                            PostCode: values.senderZipCode,
                            State: values.senderState,
                            Remark: values.senderRemark,
                        })
                    );

                    handleCreateMerchantProfile({
                        Line1: values.senderName,
                        Line2: values.senderAddress,
                        Line3: values.senderPhone,
                        City: values.senderCity,
                        CountryCode: values.senderCountry,
                        Description: values.senderEmail,
                        PostCode: values.senderZipCode,
                        State: values.senderState,
                        saveSenderAddress: values.saveSenderAddress,
                    }).then(res => {
                        if (res) {
                            dispatch(
                                setOriginAddress({
                                    id: res,
                                })
                            );
                        }
                        return {};
                    });

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            }),
        [dispatch, handleCreateMerchantProfile]
    );

    return { handleFormSubmit, handleFormSenderSubmit, handleFormRecieverSubmit };
};
