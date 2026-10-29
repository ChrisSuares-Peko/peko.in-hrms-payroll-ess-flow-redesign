import { useState } from 'react';

import { Avatar, Flex, Form, Typography, theme } from 'antd';
import { FormikProps, useFormikContext } from 'formik';

// import ProfileImage from '@assets/ProfileRectangle.png';
import IndianFlag from '@assets/svg/indianFlag.svg';
import CityAutoCompleteInput from '@components/atomic/inputs/CityAutoCompleteInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import ImageCropModal from '@components/molecular/modals/ImageCropModal';
import { useAppSelector } from '@src/hooks/store';

import CustomImageUploadInput from '../CustomImageUploadInput';

interface FormValues {
    authorisedPersonName: string;
    phoneNumber: string;
    personalEmail: string;
    designation: string;
    OfficeEmail: string;
    country: string | undefined;
    companySize: string | undefined;
    landline: '';
    profileImageBase: any;
}

interface BasicInfoFormProps {
    statesList: any[];
    companySizesList: any[];
}

const BasicInfoForm = ({ statesList, companySizesList }: BasicInfoFormProps) => {
    const { data } = useAppSelector(state => state.reducer.basicInfo);

    const { values, setFieldValue }: FormikProps<FormValues> = useFormikContext() ?? {};
    const [file, setFile] = useState<any>(
        values.profileImageBase !== '' ? values.profileImageBase : null
    );
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleImage = (base64: string, image: string) => {
        setFile(image);
        setFieldValue('profileImageBase', base64);
    };
    const clearFilePreview = () => {
        setFile(null);
    };
    const [isCropModalVisible, setIsCropModalVisible] = useState(false);

    const showCropModal = () => setIsCropModalVisible(true);
    const hideCropModal = () => setIsCropModalVisible(false);
    return (
        <>
            <Form layout="vertical">
                <Flex align="center " gap={30}>
                    <Avatar
                        src={file}
                        alt="Profile"
                        shape="square"
                        size={64}
                        draggable={false}
                        className="bg-[#ffeeee]"
                    >
                        {!file && (
                            <Typography.Text
                                style={{ color: colorPrimary }}
                                className="text-4xl font-bold"
                            >
                                {data?.name?.slice(0, 1).toUpperCase()}
                            </Typography.Text>
                        )}
                    </Avatar>
                    <Flex align="center" className="mt-5">
                        <CustomImageUploadInput
                            label=""
                            name="profileImageBase"
                            setFile={setSelectedImage}
                            format="profileImageFormat"
                            isImageCrop
                            handleChange={showCropModal}
                            clearFilePreview={clearFilePreview} // Pass the new prop
                        />
                    </Flex>
                </Flex>
                <Flex>
                    <Typography.Text className="text-gray-500 text-xs">
                        (File Formats Supported: JPG, JPEG, PNG. Max. size: 200 KB)
                    </Typography.Text>
                </Flex>
                <Flex vertical className="w-full mt-6">
                    <TextInput
                        name="name"
                        label="Company Name"
                        type="text"
                        placeholder="Enter  Company Name"
                        classes=" rounded-sm "
                        showToolTip
                        tooltipText=" Please get in touch with our customer service representative to update your company name."
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                        isDisabled
                    />
                    <TextInput
                        name="mobileNo"
                        label="Mobile Number"
                        type="text"
                        placeholder="Enter Mobile Number"
                        classes=" p-0"
                        isDisabled
                        allowNumbersOnly
                        showToolTip
                        tooltipText=" Please get in touch with our customer service representative to update your mobile number."
                        maxLength={10}
                        prefix={
                            <Flex
                                align="center"
                                gap={6}
                                className="p-2 h-full border-e me-2 cursor-not-allowed"
                            >
                                <img src={IndianFlag} alt="" />
                                <p>+91</p>
                            </Flex>
                        }
                    />

                    <TextInput
                        name="email"
                        label="Business Email"
                        type="email"
                        placeholder="Enter business Email"
                        classes=" rounded-sm "
                        tooltipText="Please get in touch with our customer service representative to update your business email."
                        showToolTip
                        isDisabled
                    />
                    <TextInput
                        name="accountNumber"
                        label="Peko Account Number"
                        type="email"
                        placeholder="Enter Peko Account Number"
                        tooltipText="Please get in touch with our customer service representative to update your peko account number."
                        showToolTip
                        isDisabled
                    />
                    <TextInput
                        name="contactPersonName"
                        label="Full Name"
                        type="text"
                        placeholder="Enter Full Name"
                        classes=" rounded-sm "
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                        isRequired
                    />
                    <TextInput
                        name="designation"
                        label="Designation"
                        type="text"
                        placeholder="Enter Designation"
                        classes=" rounded-sm"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                        isRequired
                    />
                    <SelectInputWithSearch
                        name="state"
                        options={statesList || []}
                        placeholder="Select State"
                        label="State"
                        isRequired
                        classes=" rounded-sm "
                    />
                    <CityAutoCompleteInput
                        name="city"
                        stateFieldName="state"
                        label="City"
                        placeholder="Enter City"
                        isRequired
                        classes=" rounded-sm"
                    />
                    <SelectInput
                        name="companySize"
                        label="Company Size"
                        placeholder="Select Size"
                        classes=" rounded-sm "
                        options={companySizesList}
                        // isRequired
                    />
                    <TextInput
                        name="landlineNo"
                        label="Landline Number"
                        type="text"
                        placeholder="Enter Landline Number"
                        classes=" rounded-sm"
                        allowNumbersOnly
                        maxLength={10}
                    />
                </Flex>
            </Form>
            <ImageCropModal
                isVisible={isCropModalVisible}
                onClose={hideCropModal}
                handleImage={handleImage}
                imgSrc={selectedImage ? selectedImage.toString() : ''}
            />
        </>
    );
};

export default BasicInfoForm;
