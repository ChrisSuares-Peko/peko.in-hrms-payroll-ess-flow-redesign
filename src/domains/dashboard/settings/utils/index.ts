import AmericanExpressLogo from '@src/domains/dashboard/settings/assets/images/American_Express_Logo.png';
import DinersClubLogo from '@src/domains/dashboard/settings/assets/images/DINERS_CLUB.png';
import mastercardLogo from '@src/domains/dashboard/settings/assets/images/Mastercard_logo.png';
import VisaLogo from '@src/domains/dashboard/settings/assets/images/Visa_Logo.png';
import { paths } from '@src/routes/paths';

export const getCardImage = (scheme: string) => {
    switch (scheme) {
        case 'VISA':
            return VisaLogo;
        case 'MASTERCARD':
            return mastercardLogo;
        case 'AMERICAN_EXPRESS':
            return AmericanExpressLogo;
        case 'DINERS_CLUB_INTERNATIONAL':
            return DinersClubLogo;
        default:
            return mastercardLogo;
    }
};
export const packageRoutes = {
    Payroll: paths.dashboard.payroll,
    Hub: paths.dashboard.pekoCloud,
    Invoicing: paths.dashboard.invoicing,
    eSign: paths.dashboard.eSign,
    Turbo: paths.dashboard.turbo,
    'Corporate cards': `/${paths.dashboard.corporateCard}`,
};
