import { type FC } from 'react';

import { Button, Flex, Typography, Image } from 'antd'; // Image was missing in your imports
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import pdfFailure from '@domains/dashboard/eSign/assets/PdfFailure.svg';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import fileExpired from '../../assets/file-expired.png';

const PdfUploadFailure: FC = () => {
    const navigate = useNavigate();
    const { expiry_date } = useAppSelector(state => state.reducer.eSignDoc);

    const today = new Date();
    const expiryDate = new Date(expiry_date ?? '');

    return (
        <>
            {expiryDate < today ? (
                <Flex
                    justify="center"
                    align="center"
                    style={{
                        overflowY: 'auto',
                        height: '600px',
                        backgroundColor: '#F9FAFC',
                        padding: 0,
                    }}
                    vertical
                >
                    <Image
                        height={160}
                        width={170}
                        src={fileExpired}
                        alt="File Expired"
                        preview={false}
                    />
                    <Typography.Text className="text-xs mt-2">File Expired</Typography.Text>
                </Flex>
            ) : (
                <Flex vertical className="w-full h-96" align="center" justify="center">
                    <Flex justify="center" align="center">
                        <ReactSVG src={pdfFailure} />
                    </Flex>

                    <Flex justify="center" align="center" className="mt-4">
                        <Typography.Text style={{ fontSize: '24px', color: '#000' }}>
                            Document Could Not Be Opened
                        </Typography.Text>
                    </Flex>

                    <Flex justify="center" align="center" className="mt-4 w-1/2">
                        <Typography.Text className="text-textGreyLight text-center">
                            The document you uploaded appears to be corrupted or damaged and cannot
                            be viewed. Please check the file and try uploading a new version.
                        </Typography.Text>
                    </Flex>

                    <Flex gap={10} justify="center" className="w-full">
                        <Button
                            type="primary"
                            danger
                            className="mt-6"
                            onClick={() => navigate(paths.dashboard.eSign)}
                        >
                            Try Again
                        </Button>
                    </Flex>
                </Flex>
            )}
        </>
    );
};

export default PdfUploadFailure;
