import { Flex, Form, Skeleton } from 'antd';
import { Field, FieldProps } from 'formik';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import BannerDescriptionEditor from './BannerDescriptionEditor';
import usePartnersForCorporate from '../../hooks/usePartnersForCorporate';
import useUpdateBanner from '../../hooks/useUpdateBanner';
import bannerSchema from '../../schema/banner';
import { Banner, refresh } from '../../types/banners';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Banner;
};

const BannersModal = ({ open, handleCancel, data, setRefresh }: ModalProps & refresh) => {
    const { categoryDatas: partnerData } = usePartnersForCorporate('');
    const { createNewBanner, isLoading, updateCurrentBanner, categoryData } = useUpdateBanner();
    const dispatch = useAppDispatch();
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Banner Management"
            open={open}
            validationSchema={bannerSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: boolean;
                if (data) {
                    res = await updateCurrentBanner({
                        ...values,
                        id: data.id,
                    });
                } else {
                    res = await createNewBanner({
                        ...values,
                    });
                }

                if (res === true) {
                    setRefresh(true);
                    if (data)
                        dispatch(
                            showToast({
                                description: `Banner updated successfully `,
                                variant: 'success',
                            })
                        );
                    else
                        dispatch(
                            showToast({
                                description: `Banner added successfully`,
                                variant: 'success',
                            })
                        );
                    handleCancel();
                }
                // if (res === false) {
                //     dispatch(
                //         showToast({
                //             description: `Something went wrong ,please try again later`,
                //             variant: 'error',
                //         })
                //     );
                // }
            }}
            initialValues={{
                bannerLink: data?.bannerLink || '',
                bannerImage: data?.bannerImage || '',
                deviceType:
                    data?.deviceType ||
                    (categoryData && categoryData.length > 0 && categoryData[0]?.value) ||
                    '',
                partnerId: Number(data?.partnerId) || '',
                position: data?.position || '',
                bannerTitle: data?.bannerTitle || '',
                description: data?.description || '',
                buttonText: data?.buttonText || '',
                status: data?.status !== undefined ? data.status === 1 : true,
                bannerType: data?.bannerType || 'OTHER',
            }}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    {categoryData ? (
                        <SelectInput
                            filterOption={false}
                            isRequired
                            name="deviceType"
                            options={categoryData}
                            placeholder="Please select a category"
                            label="Select Category"
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}
                    <TextInput
                        name="bannerTitle"
                        label="Banner Title"
                        type="text"
                        placeholder="Please enter banner title "
                        classes=" rounded-sm"
                    />
                    <Field name="description">
                        {({ field, form }: FieldProps) => (
                            <Form.Item label="Banner Description">
                                <BannerDescriptionEditor
                                    value={field.value}
                                    onChange={value => {
                                        form.setFieldValue(field.name, value);
                                    }}
                                />
                            </Form.Item>
                        )}
                    </Field>
                    <TextInput
                        name="buttonText"
                        label="Button Text"
                        type="text"
                        placeholder="Please enter button text"
                        classes="rounded-sm"
                    />
                    <TextInput
                        name="bannerLink"
                        label="Banner Link"
                        type="text"
                        placeholder="Please enter banner link "
                        classes=" rounded-sm"
                        isRequired
                    />
                    <SelectInput
                        filterOption={false}
                        name="position"
                        options={[
                            {
                                value: 'TOP',
                                label: 'TOP',
                            },
                            {
                                value: 'BOTTOM',
                                label: 'BOTTOM',
                            },
                        ]}
                        placeholder="Please select a position"
                        label="Select Position"
                        isRequired
                    />

                    <SelectInput
                        filterOption={false}
                        name="bannerType"
                        options={[
                            {
                                value: 'OTHER',
                                label: 'Other',
                            },
                            {
                                value: 'SUBSCRIPTION',
                                label: 'Subscription',
                            },
                        ]}
                        placeholder="Please select a type"
                        label="Select Banner Type"
                        isRequired
                    />

                    {partnerData ? (
                        <SelectInput
                            filterOption={false}
                            name="partnerId"
                            options={(partnerData || []).map(d => ({
                                value: d.id,
                                label: d.name,
                            }))}
                            placeholder="Please select a partner"
                            label="Select Partner"
                            allowClear
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}

                    <CustomFileUploadInput
                        isRequired
                        existingFileUrl={data?.bannerImage}
                        label="Upload Image"
                        name="bannerImage"
                        format="bannerFormat"
                        showNotification
                        showFileName
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default BannersModal;
