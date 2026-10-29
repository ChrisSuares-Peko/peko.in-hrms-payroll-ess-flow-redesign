import { LineItem } from '../types/generateIrn';

export const r2 = (n: number): number => Math.round(n * 100) / 100;
export const toNum = (v: number | string): number =>
    typeof v === 'string' ? parseFloat(v) || 0 : v || 0;

export const calcTaxable = (item: LineItem): number =>
    r2(Math.max(0, toNum(item.quantity) * toNum(item.unitPrice) - toNum(item.discount)));

export const calcIgst = (item: LineItem): number =>
    r2(calcTaxable(item) * (toNum(item.gstRate) / 100));

export const calcCgst = (item: LineItem): number =>
    r2(calcTaxable(item) * (toNum(item.gstRate) / 2 / 100));

export const calcTotal = (item: LineItem): number =>
    r2(calcTaxable(item) + calcIgst(item));
