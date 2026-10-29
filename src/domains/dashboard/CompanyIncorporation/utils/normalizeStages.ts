import { VendorStage } from '../types';

// Pure, display-only reconciliation of the verbatim vendor stages: once a stage
// is completed, every earlier stage is shown completed too, so the vendor never
// leaves a "Pending" step sitting before a "Completed" one. Never mutates or
// persists the input.
export function normalizeStagesForDisplay(stages: VendorStage[]): VendorStage[] {
    if (!Array.isArray(stages) || stages.length === 0) return stages;

    let lastCompletedIndex = -1;
    stages.forEach((stage, index) => {
        if (stage.state === 'completed') lastCompletedIndex = index;
    });

    if (lastCompletedIndex <= 0) return stages;

    return stages.map((stage, index) =>
        index < lastCompletedIndex && stage.state !== 'completed'
            ? { ...stage, state: 'completed' as const }
            : stage,
    );
}
