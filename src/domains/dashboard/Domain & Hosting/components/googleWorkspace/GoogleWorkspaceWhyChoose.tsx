import { Flex, Image, Typography } from 'antd';
import { SiGoogledocs, SiGooglesheets } from 'react-icons/si';

import tbCloud from '../../assets/svg/5TBCloud.svg';
import advAdminControl from '../../assets/svg/advAdminControl.svg';
import deviceManagement from '../../assets/svg/deviceManagement.svg';
import gemini from '../../assets/svg/gemini.svg';
import gmail2 from '../../assets/svg/gmail2.svg';
import googleCalender from '../../assets/svg/googleCalender.svg';
import googleMeet from '../../assets/svg/googleMeet.svg';
import storage from '../../assets/svg/storage.svg';

const { Text } = Typography;

const ROWS = [
    [
        { icon: <Image src={storage} alt="storage" width={40} height={40} preview={false} />, title: 'Google Drive', desc: 'Store and organise files effortlessly over the cloud' },
        { icon: <SiGoogledocs size={40} color="#4285F4" />, title: 'Google Docs', desc: 'Create, edit and share documents on the go' },
        { icon: <Image src={gemini} alt="gemini" width={40} height={40} preview={false} />, title: 'Gemini AI', desc: 'Use Gemini AI in google workspace apps' },
        { icon: <SiGooglesheets size={40} color="#0F9D58" />, title: 'Google Sheets', desc: 'Build, edit and review spreadsheets online' },
        { icon: <Image src={googleMeet} alt="google meet" width={40} height={40} preview={false} />, title: 'Google Meet and Google Chat', desc: 'Real time remote collaboration via Chat, and HD video calls' },
    ],
    [
        { icon: <Image src={tbCloud} alt="5TB Cloud Storage" width={40} height={40} preview={false} />, title: '5TB Cloud Storage', desc: '5TB Storage to cater to all your needs' },
        { icon: <Image src={gmail2} alt="gmail" width={40} height={40} preview={false} />, title: 'Gmail', desc: 'Your professional email on Google with your company domain name' },
        { icon: <Image src={deviceManagement} alt="Device Management" width={40} height={40} preview={false} />, title: 'Device Management', desc: 'Sync across all devices with Google Workspace' },
        { icon: <Image src={googleCalender} alt="calender" width={40} height={40} preview={false} />, title: 'Google Calendar', desc: 'Schedule meetings and manage your time with ease' },
        { icon: <Image src={advAdminControl} alt="Advanced Admin Controls" width={40} height={40} preview={false} />, title: 'Advanced Admin Controls', desc: 'Easy management of users and groups.' },
    ],
];

const GoogleWorkspaceWhyChoose = () => (
    <>
        <Typography.Title className="!mb-5 !mt-0 !text-[28px] !font-semibold !leading-[38px] !text-[#1e293b]">
            Why choose Google Workspace
        </Typography.Title>
        <div className="rounded-[28px] bg-white px-6 py-8 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)] lg:px-[50px] lg:py-[60px]">
            <div className="flex flex-col gap-10">
                {ROWS.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                        {row.map((item, i) => (
                            <Flex key={i} vertical align="center" className="px-2 text-center" gap={12}>
                                <span className="flex h-12 w-12 items-center justify-center">{item.icon}</span>
                                <Flex vertical gap={6} align="center" className="w-full">
                                    <Text className="w-full text-[15px] font-semibold leading-[22px] text-[#1e293b]">
                                        {item.title}
                                    </Text>
                                    <Text className="mx-auto max-w-[160px] text-[13px] font-normal leading-[20px] text-[#6f6c8f]">
                                        {item.desc}
                                    </Text>
                                </Flex>
                            </Flex>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </>
);

export default GoogleWorkspaceWhyChoose;
