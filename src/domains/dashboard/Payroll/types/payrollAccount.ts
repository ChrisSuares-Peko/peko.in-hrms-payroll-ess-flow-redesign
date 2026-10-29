import { BankAccountRecord } from './bankAccount';
import { VirtualAccountRecord } from './virtualAccount';

export type PayrollAccountStatus =
    | { type: 'virtual'; record: VirtualAccountRecord }
    | { type: 'bank'; record: BankAccountRecord };
