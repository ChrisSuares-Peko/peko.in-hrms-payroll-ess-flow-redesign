type CCNavListener = (event: { tab: string }) => void;

const listeners: CCNavListener[] = [];
const pendingSubTabs: Partial<Record<string, string>> = {};

export const subscribeCCNav = (fn: CCNavListener): (() => void) => {
    listeners.push(fn);
    return () => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
    };
};

export const emitCCNav = (tab: string, opts?: { subTab?: string }): void => {
    if (opts?.subTab) pendingSubTabs[tab] = opts.subTab;
    listeners.forEach(fn => fn({ tab }));
};

/** Reads and clears the pending subtab for a given tab key. Call on component mount. */
export const consumePendingSubTab = (tabKey: string): string | undefined => {
    const sub = pendingSubTabs[tabKey];
    delete pendingSubTabs[tabKey];
    return sub;
};
