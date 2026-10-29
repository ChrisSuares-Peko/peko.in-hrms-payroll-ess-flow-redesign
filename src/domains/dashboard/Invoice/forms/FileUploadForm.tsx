import React from 'react';

import { Flex, Form, Image } from 'antd';
import { Formik } from 'formik';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';

const FileUploadForm = () => (
    <Flex vertical gap={20} justify="center" align="center">
        <Formik
            initialValues={{
                profileImage: '',
                format: '',
            }}
            onSubmit={() => console.log('hi')}
        >
            {({ handleSubmit, values, resetForm }) => (
                <Form className="w-full">
                    <Flex vertical gap={20} justify="center" align="center">
                        <Image
                            src={`data:image/${values.format};base64,${values.profileImage}`}
                            preview={false}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />

                        <FileUploadInput name="profileImage" format="format" label="" />
                    </Flex>
                </Form>
            )}
        </Formik>
    </Flex>
);

export default FileUploadForm;
