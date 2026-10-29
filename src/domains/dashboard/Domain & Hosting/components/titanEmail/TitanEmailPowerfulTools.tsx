import { Flex, Image, Typography } from 'antd';

import autoReply from '../../assets/svg/autoReply.svg';
import blockCenter from '../../assets/svg/blockCenter.svg';
import inbuildCalender from '../../assets/svg/inbuildCalender.svg';
import multiAccountSupport from '../../assets/svg/multiAccountSupport.svg';
import oneClickImport from '../../assets/svg/oneClickImport.svg';
import sendAsAlias from '../../assets/svg/sendAsAlias.svg';

const { Text, Title } = Typography;

const TOOLS = [
    {
        icon: <Image src={oneClickImport} alt="One-click Import" width={32} height={32} preview={false} />,
        title: 'One-click Import',
        desc: "Bring your existing emails and contacts from other accounts into Titan so you don't have to keep switching between accounts.",
    },
    {
        icon: <Image src={multiAccountSupport} alt="Multi-account Support" width={32} height={32} preview={false} />,
        title: 'Multi-account Support',
        desc: 'Set up essential mailboxes such as sales@domain.com and info@domain.com, and switch between them in one interface.',
    },
    {
        icon: <Image src={inbuildCalender} alt="Inbuilt Calendar & Contacts" width={32} height={32} preview={false} />,
        title: 'Inbuilt Calendar & Contacts',
        desc: 'Share your Calendar with contacts to collaborate easily. Also store relevant details about your contacts.',
    },
    {
        icon: <Image src={autoReply} alt="Auto-reply" width={32} height={32} preview={false} />,
        title: 'Auto-reply',
        desc: 'Automatically reply to incoming emails while you are away to avoid keeping your senders waiting.',
    },
    {
        icon: <Image src={blockCenter} alt="Block Sender" width={32} height={32} preview={false} />,
        title: 'Block Sender',
        desc: 'Keep emails from unwanted senders out of your inbox. Block specific email addresses, or all emails from a certain domain.',
    },
    {
        icon: <Image src={sendAsAlias} alt="Send as Alias" width={32} height={32} preview={false} />,
        title: 'Send as Alias',
        desc: 'Send emails using your alias identity to keep your primary email address hidden.',
    },
];

const TitanEmailPowerfulTools = () => (
    <>
        <Title level={3} className="!mb-4 !mt-10 !font-bold !text-gray-900">
            Powerful Tools for Your Inbox
        </Title>
        <div className="mt-4 rounded-[20px] border border-[#EEF1F5] bg-white px-6 py-6 shadow-[0_4px_20px_rgba(15,23,42,0.07)] lg:px-8 lg:py-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {TOOLS.map((item, i) => (
                    <Flex key={i} vertical align="center" className="text-center" gap={8}>
                        <span>{item.icon}</span>
                        <Text className="text-[14px] font-semibold text-gray-900">{item.title}</Text>
                        <Text className="text-[12px] text-gray-500">{item.desc}</Text>
                    </Flex>
                ))}
            </div>
        </div>
    </>
);

export default TitanEmailPowerfulTools;
