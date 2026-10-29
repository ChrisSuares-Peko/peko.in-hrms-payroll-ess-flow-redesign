import { paths } from '@src/routes/paths';

interface IContactUsData {
    text: string;
    link: string;
}

const faqPageLink = `${paths.dashboard.needHelp}/${paths.needHelp.faq}`;

export const contactUsData: IContactUsData[] = [
    'Mobile Recharge',
    'Bill Payments',
    'Corporate Travel',
    'Verification Suite',
    'WhatsApp for Business',
    'Turbo',
    'eSign',
    'Payroll',
    'eSIM',
    'General',
].map(text => ({ text, link: faqPageLink }));

export const faqText: string = `
Betterment makes money in four simple ways:

Our flat management fee for investing and advice—$4 per month or 0.25% for most customers (depending on your balance and recurring deposit settings), 
0.40% for our Premium advice plan. Our over-the-phone advice packages, which cost between $299 and $399 per package.

Payments from Cash Reserve program banks, which Betterment expects will result in annualized revenue of more than 0% but less than 0.50% of the average, 
aggregate balance of the daily program deposits at program banks.

Finally, for Checking, Betterment Financial LLC receives a portion of interchange fees from merchants whenever you use your debit card (just like any bank or credit union), 
and a small portion of the net interest margin from deposits in your account.

We don't earn revenue from any funds we've selected for your portfolio. We also don't make money in our trading practices. 
That's all because we're built to align Betterment's interests with your own.
`;
export const faqTitle: string = `How does Betterment make money?`;
