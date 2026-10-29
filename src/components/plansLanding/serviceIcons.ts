import esign from '@domains/dashboard/MoreServices/assets/icons/moreServices/eSign.svg';
import turbo from '@domains/dashboard/MoreServices/assets/icons/moreServices/Turbo.svg';
import type { PlanIconKey } from '@utils/plansLandingData';

import invoicing from './assets/invoicing.svg';
import payroll from './assets/payroll.png';
import procure from './assets/procure.png';
import salesx from './assets/salesx.png';

export const serviceIcons: Record<PlanIconKey, string> = {
    payroll,
    procure,
    salesx,
    esign,
    turbo,
    invoicing,
};
