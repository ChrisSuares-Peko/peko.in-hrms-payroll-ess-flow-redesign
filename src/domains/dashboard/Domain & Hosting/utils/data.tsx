import {
    AppstoreAddOutlined,
    CodeOutlined,
    DashboardOutlined,
    GlobalOutlined,
    MailOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { Flex } from 'antd';

import Support24x7Icon from '@src/assets/icons/24x7 support.svg';
import AspNetIcon from '@src/assets/icons/Build in ASP  .NET.svg';
import BuiltInPhpMySQLIcon from '@src/assets/icons/BuiltInPhpMySQL.svg';
import EasyInstallerIcon from '@src/assets/icons/Easy 1-click-installer.svg';
import EasySSLIcon from '@src/assets/icons/Easy SSL Installation.svg';
import EnhancedSecurityIcon from '@src/assets/icons/Enhanced Security.svg';
import FreeCpanelIcon from '@src/assets/icons/Free cPanel.svg';
import FreeWebsiteMigrationsIcon from '@src/assets/icons/Free Website Migrations.svg';
import HighPerformanceIcon from '@src/assets/icons/High Performance.svg';
import InstantUpgradesIcon from '@src/assets/icons/Instant Upgrades.svg';
import LightningFastIcon from '@src/assets/icons/Lightning Fast Websites.svg';
import MaxSecurityIcon from '@src/assets/icons/Maximum Security.svg';
import MoneyBackIcon from '@src/assets/icons/Money Back Guarante.svg';
import ParallelsIcon from '@src/assets/icons/Parallels Panel.svg';
import PhpMysqlRubyIcon from '@src/assets/icons/PHP, MySQL, Ruby & more.svg';
import PleskIcon from '@src/assets/icons/Plesk Onyx Panel.svg';
import SecureShellAccessIcon from '@src/assets/icons/Secure Shell Access.svg';
import SecureWebmailIcon from '@src/assets/icons/Secure Webmail.svg';
import SniEnabledIcon from '@src/assets/icons/SNI enabled.svg';
import { paths } from '@src/routes/paths';

import CodeImg from '../assets/img/code.png';
import FlashImg from '../assets/img/flash.png';
import GlobalImg from '../assets/img/global.png';
import SettingsImg from '../assets/img/setting.png';
import SmsImg from '../assets/img/sms.png';
import EasyUpgradesIcon from '../assets/svg/CloudUpload.svg';
import cPanelSM from '../assets/svg/cpanel.svg';
import GoogleWorkspaceIcon from '../assets/svg/googleWorkspace.svg';
import HostingIcon from '../assets/svg/hosting.svg';
import ScrollImg from '../assets/svg/scroll.svg';
import SharedHostingIcon from '../assets/svg/sharedHosting.svg';
import SshImg from '../assets/svg/ssh.svg';
import TitanEmailIcon from '../assets/svg/titanEmail.svg';

export const services = [
    {
        planType: 'vps_server',
        title: 'VPS Server',
        icon: (
            <Flex align="center" justify="center" className="w-24 h-24">
                <img src={HostingIcon} className="w-full h-full object-contain" alt="VPS Server" />
            </Flex>
        ),
        description:
            'Reliable VPS server solutions to keep your website fast, secure, and always online.',
        path: paths.domainHosting.vpsServer,
        infoPath: paths.domainHosting.vpsServerDetail,
    },
    {
        planType: 'shared_hosting',
        title: 'Shared Hosting',
        icon: (
            <Flex align="center" justify="center" className="w-24 h-24">
                <img
                    src={SharedHostingIcon}
                    className="w-full h-full object-contain"
                    alt="Shared Hosting"
                />
            </Flex>
        ),
        description:
            'Affordable hosting where multiple websites share server resources—ideal for small businesses and startups.',
        path: paths.domainHosting.sharedHosting,
        infoPath: paths.domainHosting.sharedHostingDetail,
    },
    {
        planType: 'titan_email',
        title: 'Titan Email',
        icon: (
            <Flex align="center" justify="center" className="w-24 h-24">
                <img
                    src={TitanEmailIcon}
                    className="w-full h-full object-contain"
                    alt="Titan Email"
                />
            </Flex>
        ),
        description: 'Professional business email with your domain name for trusted communication.',
        path: paths.domainHosting.titanEmail,
        infoPath: paths.domainHosting.titanEmailDetail,
    },
    {
        planType: 'google_workspace',
        title: 'Google Workspace',
        icon: (
            <Flex align="center" justify="center" className="w-24 h-24">
                <img
                    src={GoogleWorkspaceIcon}
                    className="w-full h-full object-contain"
                    alt="Google Workspace"
                />
            </Flex>
        ),
        description:
            'All-in-one productivity suite with Gmail, Drive, Docs, and collaboration tools for teams',
        path: paths.domainHosting.googleWorkspace,
        infoPath: paths.domainHosting.googleWorkspaceDetail,
    },
];

export const hostingPlans = [
    {
        name: 'Essential',
        price: '1349',
        duration: '3 Years',
        features: [
            '40 GB SSD Disk Space',
            '800 GB Data Transfer',
            'Unlimited Websites',
            '25 Email Accounts',
            'Unlimited Email',
            'Free SSL Certificate',
        ],
    },
    {
        name: 'Essential',
        price: '1349',
        duration: '3 Years',
        features: [
            '40 GB SSD Disk Space',
            '800 GB Data Transfer',
            'Unlimited Websites',
            '25 Email Accounts',
            'Unlimited Email',
            'Free SSL Certificate',
        ],
    },
    {
        name: 'Essential',
        price: '1349',
        duration: '3 Years',
        features: [
            '40 GB SSD Disk Space',
            '800 GB Data Transfer',
            'Unlimited Websites',
            '25 Email Accounts',
            'Unlimited Email',
            'Free SSL Certificate',
        ],
    },
    {
        name: 'Essential',
        price: '1349',
        duration: '3 Years',
        features: [
            '40 GB SSD Disk Space',
            '800 GB Data Transfer',
            'Unlimited Websites',
            '25 Email Accounts',
            'Unlimited Email',
            'Free SSL Certificate',
        ],
    },
];

export const sharedHostingPlans = [
    {
        name: 'Personal',
        price: '1349',
        duration: '3 Years',
        features: [
            '40 GB SSD Disk Space',
            '800 GB Data Transfer',
            'Unlimited Websites',
            '25 Email Accounts',
            'Unlimited Email',
            'Free SSL Certificate',
        ],
    },
    {
        name: 'Personal',
        price: '1349',
        duration: '3 Years',
        features: [
            '40 GB SSD Disk Space',
            '800 GB Data Transfer',
            'Unlimited Websites',
            '25 Email Accounts',
            'Unlimited Email',
            'Free SSL Certificate',
        ],
    },
    {
        name: 'Personal',
        price: '1349',
        duration: '3 Years',
        features: [
            '40 GB SSD Disk Space',
            '800 GB Data Transfer',
            'Unlimited Websites',
            '25 Email Accounts',
            'Unlimited Email',
            'Free SSL Certificate',
        ],
    },
];

export const basicFeatures = [
    'Email Storage (per email account)',
    'Rich Web mail, and native apps for iOS and Android',
    'Inbuilt Calendar and Contacts',
    'Advanced Anti-virus',
    'Advanced Anti-spam',
];

export const advancedFeatures = [
    'Multi-account Support',
    'External Forwarders',
    'Read Receipts',
    'Email Templates',
    'Contact Groups',
    'Send Later',
    'Priority Inbox',
    'Grammar and Spell Check',
    'Follow-up Reminders',
    'Turbo Search',
    'HTML in Composer',
    'Send as Alias',
    'Two-Factor Authentication',
    'Undo Send',
    'Block Sender',
    'Allowlist',
];

// Shared Hosting - Why Choose Section
export const linuxHostingBenefits = [
    {
        icon: (
            <img
                src={LightningFastIcon}
                alt="Lightning Fast Websites"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Lightning Fast Websites',
        description: 'Optimized servers for superior website speed and performance',
    },
    {
        icon: (
            <img
                src={FreeCpanelIcon}
                alt="Free cPanel"
                style={{ width: '100px', height: '28px' }}
            />
        ),
        title: 'Free cPanel',
        description: 'User-friendly control panel for easy website management',
    },
    {
        icon: (
            <img
                src={SniEnabledIcon}
                alt="SNI Enabled"
                style={{ width: '100px', height: '28px' }}
            />
        ),
        title: 'SNI Enabled',
        description: 'Host multiple SSL certificates on a single IP address',
    },
    {
        icon: (
            <img
                src={Support24x7Icon}
                alt="24x7 Support"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: '24x7 Support',
        description: 'Round-the-clock expert support for all your hosting needs',
    },
    {
        icon: (
            <img
                src={EasyInstallerIcon}
                alt="Easy 1-click Installer"
                style={{ width: '100px', height: '28px' }}
            />
        ),
        title: 'Easy 1-click Installer',
        description: 'Install WordPress, Joomla & more apps in one click',
    },
    {
        icon: (
            <img
                src={EnhancedSecurityIcon}
                alt="Enhanced Security"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Enhanced Security',
        description: 'Advanced security tools to keep your website safe',
    },
    {
        icon: (
            <img
                src={EasyUpgradesIcon}
                alt="Easy Upgrades"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Easy Upgrades',
        description: 'Seamlessly scale your hosting plan as your business grows',
    },
    {
        icon: (
            <img
                src={SecureShellAccessIcon}
                alt="Secure Shell Access"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Secure Shell Access',
        description: 'SSH access for advanced server management and control',
    },
    {
        icon: (
            <img
                src={PhpMysqlRubyIcon}
                alt="PHP, MySQL, Ruby & more"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'PHP, MySQL, Ruby & more',
        description: 'Support for all popular languages and databases',
    },
    {
        icon: (
            <img
                src={FreeWebsiteMigrationsIcon}
                alt="Free Website Migrations"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Free Website Migrations',
        description: 'Expert team migrates your existing website for free',
    },
];

export const windowsHostingBenefits = [
    {
        icon: (
            <img
                src={HighPerformanceIcon}
                alt="High Performance"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'High Performance',
        description: 'Minimal page load time, maximum delight',
    },
    {
        icon: (
            <img
                src={EasySSLIcon}
                alt="Easy SSL Installation"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Easy SSL Installation',
        description: 'Server Name Identification (SNI) available for SSL',
    },
    {
        icon: (
            <img src={PleskIcon} alt="Plesk Onyx Panel" style={{ width: '56px', height: '56px' }} />
        ),
        title: 'Plesk Onyx Panel',
        description: 'Intuitive & Feature rich panel for your convenience',
    },
    {
        icon: (
            <img
                src={Support24x7Icon}
                alt="24x7 Support"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: '24x7 Support',
        description: 'Your websites are our priority, we are here to serve you',
    },
    {
        icon: (
            <img
                src={InstantUpgradesIcon}
                alt="Instant Upgrades"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Instant Upgrades',
        description: 'Change to any Windows Shared Hosting plans when needed',
    },
    {
        icon: (
            <img
                src={MaxSecurityIcon}
                alt="Maximum Security"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Maximum Security',
        description: 'Infrastructure & Monitoring to protect your website',
    },
    {
        icon: (
            <img
                src={ParallelsIcon}
                alt="Parallels Panel"
                style={{ width: '100px', height: '56px' }}
            />
        ),
        title: 'Parallels Panel',
        description: '1-Click App Installer',
    },
    {
        icon: (
            <img
                src={MoneyBackIcon}
                alt="Money Back Guarantee"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Money Back Guarantee',
        description: 'Refunds - No questions asked within first 30 days',
    },
    {
        icon: (
            <img
                src={SecureWebmailIcon}
                alt="Secure Webmail"
                style={{ width: '28px', height: '28px' }}
            />
        ),
        title: 'Secure Webmail',
        description: 'Fast, Secure email included',
    },
    {
        icon: (
            <img
                src={AspNetIcon}
                alt="Built in ASP / .NET"
                style={{ width: '56px', height: '56px' }}
            />
        ),
        title: 'Built in ASP / .NET',
        description: 'Perfect for ASP.NET, PHP & MS SQL web development?',
    },
];

// Shared Hosting - Technical Specifications
export const linuxHostingSpecs = {
    columns: ['Software', 'Databases', 'Additional Software', 'Security'],
    rows: [
        {
            Software: ['Softaculous', 'Perl', 'Python 2.7 and 3.6', 'PHP 8.3, 8.2 & 8.1'],
            Databases: [
                'MySQL Client',
                'phpMyAdmin 5.2.1',
                'MySQL admin tools',
                'MSSQL Stored Procedures',
            ],
            'Additional Software': [
                'Zend Engine',
                'Zend Optimizer',
                'Zend Guard Loader',
                'ionCube Loader',
            ],
            Security: ['Password protected folders', 'Hotlink Protection', 'Leech Protection'],
        },
    ],
};

export const windowsHostingSpecs = {
    columns: ['Software', 'Databases', 'Additional Software', 'Security'],
    rows: [
        {
            Software: [
                'Windows 2022 (Standard) 64 bit',
                'Plesk Obsidian 18.x',
                'ASP.NET MVC 5.10.1',
                'phpMyAdmin 5',
            ],
            Databases: [
                'Microsoft SQL Server 2016 and 2017',
                'myLittleAdmin 3.8',
                'MS Server Management Studio',
                'MySQL Client 5.1',
            ],
            'Additional Software': [
                'ASP mail scripts',
                'SilverLight',
                'Zend Engine',
                'ionCube Loader',
            ],
            Security: ['Password protected folders', 'Hotlink Protection', 'Leech Protection'],
        },
    ],
};

// Shared Hosting - Features
const featureIconClass = 'text-lightRed text-[28px]';

export const linuxHostingFeatures = [
    {
        icon: (
            <img
                src={cPanelSM}
                alt="Free cPanel"
                style={{ width: '70px', height: '40px', objectFit: 'contain' }}
            />
        ),
        title: 'Free cPanel',
        cardTitle: 'Shared Web Hosting with Free cPanel',
        cardDescription:
            'All Linux Shared Hosting Plans come with cPanel, to make hosting easy for everyone. Setting-up addon domains, Emails, FTP and Databases is convenient with our FREE cPanel.',
        cardImage: FreeCpanelIcon,
    },
    {
        icon: <AppstoreAddOutlined className={featureIconClass} />,
        title: '400+ Apps',
        cardTitle: '400+ Apps on your Linux Hosting',
        cardDescription:
            'Installing, updating or even rolling back changes to your blog, website or E-commerce site was never this easy! Our Linux Shared web hosting comes installed with Softaculus that powers 1-click install of over 400 applications. Here are some of our popular CMS platforms: WordPress, Joomla, Drupal.',
        cardImage: CodeImg,
    },
    {
        icon: <GlobalOutlined className={featureIconClass} />,
        title: 'Free website transfer',
        cardTitle: 'Free Website Transfers',
        cardDescription:
            'Moving your website from another Web Host? Chat with us and our Account Manager will do the cPanel to cPanel website migration for you, completely Free of charge! Also, you can upgrade between plans on Linux Shared Hosting by yourself from your panel.',
        cardImage: GlobalImg,
    },
    {
        icon: <MailOutlined className={featureIconClass} />,
        title: 'Email hosting included',
        cardTitle: 'Free email with Linux Shared Hosting',
        cardDescription:
            'Access your emails from anywhere as it comes with POP3 and IMAP support along with a sleek webmail interface on all our Linux Shared Hosting plans. Our email hosting is compatible with all desktop clients.',
        cardImage: SmsImg,
    },
    {
        icon: <DashboardOutlined className={featureIconClass} />,
        title: 'Boost website speed',
        cardTitle: 'Boost website speed',
        cardDescription:
            'Make your website up to 1000% faster with Varnish Caching. Varnish gives your website a performance boost using state-of-the-art caching layer for static websites. With Varnish caching enabled on our Linux Hosting Plans, you can Increase the chances of your website moving up in ranking on search engines due to faster load times.',
        cardImage: FlashImg,
    },
    {
        icon: <img src={BuiltInPhpMySQLIcon} alt="Built in PHP/MySQL" style={{ width: 28, height: 28, objectFit: 'contain' }} />,
        title: 'Built in PHP/MySQL',
        cardTitle: 'Build in PHP/MySQL',
        cardDescription:
            'Code in a wide array of languages like PHP, Ruby, PERL, Python, MySQL and more to build your websites. Our Linux Shared Web hosting enables you to build scalable, powerful applications that delight your audience. If you are looking to code in Windows OS, you can also choose our Windows Shared Hosting plans.',
        cardImage: ScrollImg,
    },
];

export const windowsHostingFeatures = [
    {
        icon: <SettingOutlined className={featureIconClass} />,
        title: 'Easy Management',
        cardTitle: 'Easy Management',
        cardDescription:
            'You can manage our Windows Shared Hosting with the new Plesk Onyx panel that allows you to manage files, sub-domains, create archives and access your email. You can also use the powerful 1-click install through Parallels Panel for installation of a range of Tools, Forums and Collaboration Apps.',
        cardImage: SettingsImg,
    },
    {
        icon: <DashboardOutlined className={featureIconClass} />,
        title: 'Boost website speed',
        cardTitle: 'Boost website speed',
        cardDescription:
            "Each Windows Shared Hosting plan is optimised to provide maximum performance for your website. You can also make your website up to 1000% faster with CloudFlare's widely distributed and highly available edge locations to cache your website content and serve faster pages to your global audience.",
        cardImage: FlashImg,
    },
    {
        icon: <AppstoreAddOutlined className={featureIconClass} />,
        title: 'Easy app installer',
        cardTitle: 'Windows Hosting with Easy App Installer',
        cardDescription:
            'We offer Parallels Panel as part of our Windows Web Hosting plans which enables easy 1-click installation of CMSs, Scripts and tools including WordPress, Drupal and a variety of applications to simplify your website building process.',
        cardImage: CodeImg,
    },
    {
        icon: <GlobalOutlined className={featureIconClass} />,
        title: 'Secure Shell Access',
        cardTitle: 'Secure Shell Access',
        cardDescription:
            'Our Windows Shared Hosting plans allows SSH access enabling you to execute commands, manage files and reliably operate your web hosting from a remote computer over an encrypted channel. Enabling SSH on ResellerClub Windows Hosting is a simple process and one that we strongly recommend!',
        cardImage: SshImg,
    },
    {
        icon: <CodeOutlined className={featureIconClass} />,
        title: 'Developers welcome',
        cardTitle: 'Flexibility to code on Windows Hosting',
        cardDescription:
            'Our 1-click installer allows you to use WordPress and other originally PHP based tools on all our Windows Web Hosting plans. Our Windows hosting packages support languages including ASP, ASP.NET as well as PHP and can connect to MSSQL as well as MYSQL databases giving you complete freedom to code in any language that you are comfortable in!',
        cardImage: ScrollImg,
    },
    {
        icon: <MailOutlined className={featureIconClass} />,
        title: 'Email hosting',
        cardTitle: 'Free email with Windows Web Hosting',
        cardDescription:
            'Our Windows Shared Hosting plans include a fully-featured email solution that allows unlimited number of email accounts with POP3 and IMAP support as well as an intuitive webmail interface. Email storage on the package is limited to 10GB across all email accounts, but you could always opt for Business Email which offers you 5 GB per inbox.',
        cardImage: SmsImg,
    },
];

// Shared Hosting - FAQs
export const linuxHostingFaqs = [
    {
        question: 'What is Shared Hosting?',
        answer: "Shared Hosting is a web hosting model where multiple websites share server resources (like CPU, RAM, and disk space) on a single physical server. It's the most affordable hosting option, ideal for small businesses and personal websites.",
    },
    {
        question: 'Is purchase of a new domain necessary to buy a Linux Shared Hosting Plan?',
        answer: "No, you do not need to purchase a new domain. You can use your existing domain with our Linux Shared Hosting plans by simply updating your domain's nameservers.",
    },
    {
        question:
            "How to manage my Databases and Websites on ResellerClub's Linux Web Hosting Plan?",
        answer: 'You can manage your databases and websites easily through the cPanel control panel included with every Linux Shared Hosting plan. cPanel provides intuitive tools for file management, database administration, and more.',
    },
    {
        question: 'What are the number of websites that I can host on a Shared Hosting Plan?',
        answer: 'The number of websites you can host depends on the plan you choose. Our higher-tier plans support unlimited websites, while entry-level plans may have a limit. Check your plan details for specifics.',
    },
    {
        question: 'Is there any money back guarantee with the Linux Web Hosting services?',
        answer: 'Yes, we offer a 30-day money-back guarantee on all our Linux Web Hosting plans. If you are not satisfied, you can request a full refund within the first 30 days, no questions asked.',
    },
    {
        question: 'Is an upgrade possible from my current Linux Shared Hosting Plan?',
        answer: 'Yes, you can upgrade your Linux Shared Hosting plan at any time from your account dashboard. Upgrades are seamless and your website will experience minimal to no downtime.',
    },
    {
        question: 'Do you also offer Windows Shared Web Hosting?',
        answer: 'Yes, we also offer Windows Shared Web Hosting plans that support ASP.NET, MS SQL Server, and other Microsoft technologies. You can switch to Windows hosting from the hosting section of your dashboard.',
    },
    {
        question: 'Is the subdivision of my Linux Hosting package possible for reselling it?',
        answer: 'Linux Shared Hosting plans are not designed for reselling. If you wish to resell hosting, please consider our Reseller Hosting plans which are specifically built for that purpose.',
    },
];

export const windowsHostingFaqs = [
    {
        question: 'What is Windows Shared Hosting?',
        answer: 'Windows Shared Hosting is a hosting solution for websites built on Microsoft technologies like ASP.NET and MS SQL. It is a cost-effective option for businesses getting started online using Windows-based applications.',
    },
    {
        question: 'Is there a Database that can be used on Windows Web Hosting?',
        answer: 'Yes, our Windows Shared Hosting plans support MS SQL Server, MySQL, and phpMyAdmin. You can manage your databases easily through the Plesk control panel.',
    },
    {
        question: 'What version of the Operating System on Windows Server Hosting is used?',
        answer: 'We use the latest stable versions of Windows Server to ensure optimal performance, compatibility, and security for your hosted applications.',
    },
    {
        question: 'Is an upgrade possible from my current Windows Hosting Plan?',
        answer: 'Yes, you can upgrade your Windows Shared Hosting plan at any time directly from your account dashboard. The upgrade process is seamless with minimal downtime.',
    },
    {
        question:
            'What are the number of websites that one can host on a Windows Shared Hosting Plan?',
        answer: 'The number of websites you can host depends on the plan you choose. Our higher-tier plans support hosting multiple domains under a single account. Please check individual plan details for exact limits.',
    },
    {
        question: 'Is Email Hosting included with the Windows Shared Hosting Plans?',
        answer: 'Yes, email hosting is included with all our Windows Shared Hosting plans. You can create professional email addresses with your domain name and manage them through webmail or any email client.',
    },
    {
        question: 'Do you also offer Linux Web Hosting?',
        answer: 'Yes, we also offer Linux Shared Hosting plans with cPanel, PHP, MySQL, and other Linux-based technologies for those who prefer an open-source hosting environment.',
    },
    {
        question:
            'Is the subdivision of my Windows Shared Hosting package possible for reselling it?',
        answer: 'Windows Shared Hosting plans are not designed for reselling. If you wish to resell hosting services, we recommend our Reseller Hosting plans which are specifically built for that purpose.',
    },
    {
        question: 'How can I install my Free SSL certificate?',
        answer: 'You can install your free SSL certificate directly from the Plesk control panel. Simply navigate to the SSL/TLS section, select your domain, and follow the guided steps to activate HTTPS for your website.',
    },
];
