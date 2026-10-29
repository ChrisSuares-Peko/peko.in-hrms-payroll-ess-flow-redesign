import { useEffect, useState } from 'react';

import { DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { Flex, Avatar, Typography, Form } from 'antd';
import { Formik } from 'formik';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import ImageFormikSync from './ImageFormikSync';
import { setImageData } from '../../slices/employeeSlices';

interface ContactProps {
    isLoading?: boolean;
}

const Contact = ({ isLoading }: ContactProps) => {
    const [file] = useState<string>();
    const [fileFormat] = useState<string>();
    const dispatch = useAppDispatch();
    const [isHovered, setIsHovered] = useState(false);
    const screens = useScreenSize();
    const isMobile =
        (screens.xs === true || screens.sm === true) &&
        !screens.md &&
        !screens.lg &&
        !screens.xl &&
        !screens.xxl;
    const { profileImage: profImage } = useAppSelector(state => state.reducer.employeeSettings);

    useEffect(() => {
        if (file) {
            dispatch(setImageData({ base64: file, format: fileFormat || '' }));
        } else {
            dispatch(setImageData(null));
        }
    }, [file, dispatch, fileFormat]);



    return (
        <Formik
            initialValues={{ profileImage: '', format: '' }}
            onSubmit={() => { }}
            enableReinitialize
        >
            {({ handleSubmit, values,setFieldValue }) => (
                <Form onFinish={handleSubmit}>
                    <ImageFormikSync onChange={data => dispatch(setImageData(data))} />

                    <Flex align="center" vertical className="">
                        <div 
                        className="avatar-img-cover inline-block overflow-hidden relative rounded-full border border-gray-300 " style={{ position: 'relative' }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        >
                            <Avatar
                                className=""
                                size={{ xs: 80, sm: 80, md: 40, lg: 100, xl: 100, xxl: 100 }}
                                icon={<UserOutlined />}
                                src={
                                    // eslint-disable-next-line no-nested-ternary
                                    values.profileImage
                                        ? `data:image/${values.format};base64,${values.profileImage}`
                                        : profImage?.base64
                                            ? `data:image/${profImage.format};base64,${profImage.base64}`
                                            : undefined
                                }
                            />
                            <div
                                className="absolute top-1/2 left-1/2"
                                style={{
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                {(values.profileImage || profImage?.base64) && (
                                    <DeleteOutlined 
                                        style={{
                                            fontSize: '20px',
                                        }}
                                        onClick={() => {
                                            setFieldValue('profileImage', '');
                                            setFieldValue('format', '');
                                            // If you need to also clear redux store, you may dispatch(setImageData(null)) here
                                        }}
                                        className={`${isHovered || isMobile ? 'opacity-100' : 'opacity-0'} text-lg text-red-500 cursor-pointer`} 
                                    />
                                )}
                            </div>
                        </div>
                        <FileUploadInput
                            name="profileImage"
                            label=""
                            maxFileSize={10 * 1024}
                            format="format"
                        />
                        <Typography.Text
                            className="-mt-4 xs:text-[.65rem] md:text-[.75rem]"
                            type="secondary"
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            (File Formats Supported: JPG, JPEG, PNG. Max. size: 10 MB)
                        </Typography.Text>
                        <Typography.Text className="text-xl font-normal">
                            Add Profile Picture
                        </Typography.Text>
                    </Flex>
                </Form>
            )}
        </Formik>
    );
};

export default Contact;
