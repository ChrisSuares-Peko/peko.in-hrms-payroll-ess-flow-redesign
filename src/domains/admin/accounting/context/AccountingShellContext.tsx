import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect } from 'react';

import { PillMeta } from '../utils/commission';

export type DrillTab = {
    key: string;
    label: string;
    icon: ReactNode;
};

export type DrillPanel = {
    backTo: string;
    backLabel: string;
    title: string;
    subtitle?: string;
    subtitleExpandable?: boolean;
    status?: PillMeta;
    tabs: DrillTab[];
    activeKey: string;
    onTabChange: (key: string) => void;
};

type SetDrillPanel = Dispatch<SetStateAction<DrillPanel | null>>;

const AccountingShellContext = createContext<SetDrillPanel | null>(null);

export const AccountingShellProvider = AccountingShellContext.Provider;

export const useAccountingDrillPanel = (panel: DrillPanel | null) => {
    const setPanel = useContext(AccountingShellContext);

    useEffect(() => {
        if (!setPanel) return undefined;
        setPanel(panel);
        return () => setPanel(null);
    }, [setPanel, panel]);
};
