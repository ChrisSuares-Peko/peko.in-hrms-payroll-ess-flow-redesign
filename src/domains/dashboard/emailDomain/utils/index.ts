import doc from '@domains/dashboard/emailDomain/assets/docs.png';
import excel from '@domains/dashboard/emailDomain/assets/excel.png';
import file from '@domains/dashboard/emailDomain/assets/file.png';
import gmail from '@domains/dashboard/emailDomain/assets/gmail.jpg';
import calendar from '@domains/dashboard/emailDomain/assets/logo31.png';
import chat from '@domains/dashboard/emailDomain/assets/logo32.png';
import meet from '@domains/dashboard/emailDomain/assets/meet.png';
import onedrive from '@domains/dashboard/emailDomain/assets/onedrive.png';
import onenote from '@domains/dashboard/emailDomain/assets/onenote.png';
import outlook from '@domains/dashboard/emailDomain/assets/outlook.png';
import powerpoint from '@domains/dashboard/emailDomain/assets/powerpoint.png';
import ppt from '@domains/dashboard/emailDomain/assets/ppt.png';
import sharepoint from '@domains/dashboard/emailDomain/assets/sharepoint.png';
import teams from '@domains/dashboard/emailDomain/assets/teams.png';
import word from '@domains/dashboard/emailDomain/assets/word.png';

export const workspace = [
    {
        image: gmail,
        name: 'Gmail',
        description: 'Professional email with your own domain name',
    },
    {
        image: meet,
        name: 'Meet',
        description: 'Powerful video conferencing tool with cutting-edge features',
    },
    {
        image: calendar,
        name: 'Calendar',
        description: 'Schedule meetings, set reminders, and manage work efficiently',
    },
    {
        image: chat,
        name: 'Chat',
        description: 'Connect, discuss, and engage in productive conversations anytime',
    },
    {
        image: doc,
        name: 'Docs',
        description: 'Create professional documents and collaborate in real-time',
    },
    {
        image: ppt,
        name: 'Sheets',
        description: 'Create detailed spreadsheets, visualize data, and perform analysis',
    },
    {
        image: file,
        name: 'Slides',
        description: 'Create impactful presentations',
    },
];

export const Microsoft365 = [
    {
        image: excel,
        name: 'Microsoft Excel',
        description:
            'Organize data, execute complex calculations, and perform advanced data analysis.',
    },
    {
        image: word,
        name: 'Microsoft Word',
        description:
            'Make your words shine with smart writing assistance, document designs, and collaboration tools.',
    },
    {
        image: powerpoint,
        name: 'Microsoft PowerPoint',
        description:
            'Design captivating presentations and collaborate in real-time from any device.',
    },
    {
        image: outlook,
        name: 'Outlook',
        description:
            'Stay on top of multiple accounts with email, calendars, and contacts in one place. Available on desktop, mobile, and web.',
    },
    {
        image: onenote,
        name: 'Microsoft OneNote',
        description:
            'Your digital notebook. One cross-functional notebook for all your notetaking needs.',
    },
    {
        image: onedrive,
        name: 'OneDrive',
        description:
            'Secure cloud-based storage service. Access, share, and collaborate on all your business files from anywhere. ',
    },
    {
        image: teams,
        name: 'Teams',
        description:
            'Transform the way you work with next-generation AI capabilities and bring together your physical and digital worlds.',
    },
    {
        image: sharepoint,
        name: 'SharePoint',
        description:
            'Your mobile, intelligent intranet. Share and manage content and applications. Collaborate across the organization with ease.',
    },
];

export const Emirates = [
    { label: 'Abu Dhabi', value: 'Abu Dhabi' },
    { label: 'Dubai', value: 'Dubai' },
    { label: 'Sharjah', value: 'Sharjah' },
    { label: 'Ajman', value: 'Ajman' },
    { label: 'Umm Al Quwain', value: 'Umm Al Quwain' },
    { label: 'Ras Al Khaimah', value: 'Ras Al Khaimah' },
    { label: 'Fujairah', value: 'Fujairah' },
];

export const emailProviders = [
    { label: 'Gmail', value: 'Gmail' },
    { label: 'Outlook', value: 'Outlook' },
    { label: 'Yahoo Mail', value: 'Yahoo Mail' },
    { label: 'Zoho Mail', value: 'Zoho Mail' },
    { label: 'Others', value: 'Others' },
    { label: 'I don’t have an email provider', value: 'I don’t have an email provider' },
];
