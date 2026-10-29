import { CtcDeductionComponent, CtcEarningComponent } from './types';

// Converts whatever the org's real global Salary/Deduction Components currently look like
// (as already fetched via getCurrentSalaryComponent / getDeductionComponent, or the
// per-employee equivalents) into the calculator's working arrays. calculatedAmount is
// reset to 0 here — calculateCtcBreakdown fills it in. This is the calculator's starting
// structure; it is never a hardcoded template, per design.

// Neither entity enforces a uniqueness constraint on the display name for every case
// (DeductionComponent has none at all), so an org's list can end up with two components
// sharing a name (e.g. two "Provident Fund (PF)" rows) — that would double-count in the
// breakdown and get persisted twice on hire. Keep only the first ACTIVE occurrence of
// each name so the calculator stays correct even when the org's underlying data isn't.
const dedupeByName = <T>(items: T[], nameOf: (item: T) => string | undefined): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        const name = (nameOf(item) || '').trim().toLowerCase();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
    });
};

export const mapSalaryComponentsToEarnings = (components: any[] = []): CtcEarningComponent[] =>
    dedupeByName(
        (components || []).filter(component => component.status === 'ACTIVE'),
        component => component.componentName
    ).map(component => ({
        id: component.id || component._id,
        componentName: component.componentName,
        calculationType: component.calculationType,
        calculationBasis: component.calculationBasis || 'COMPONENT',
        calculationBasedOn: component.calculationBasedOn,
        amountPercentage: component.amountPercentage != null ? Number(component.amountPercentage) : undefined,
        calculatedAmount: 0,
        isGlobal: component.isGlobal,
    }));

export const mapDeductionComponentsToDeductions = (components: any[] = []): CtcDeductionComponent[] =>
    dedupeByName(
        (components || []).filter(component => component.status === 'ACTIVE'),
        component => component.deductionName
    ).map(component => ({
        id: component.id || component._id,
        deductionName: component.deductionName,
        calculationType: component.calculationType,
        salaryDeductionType: component.salaryDeductionType,
        amountPercentage: component.amountPercentage != null ? Number(component.amountPercentage) : undefined,
        calculatedAmount: 0,
        isGlobal: component.isGlobal,
    }));
