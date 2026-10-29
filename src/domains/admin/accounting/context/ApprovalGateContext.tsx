import { ReactNode, createContext, useContext } from 'react';

import useApprovalGateState from '../hooks/useApprovalGate';

type ApprovalGateValue = ReturnType<typeof useApprovalGateState>;

const ApprovalGateContext = createContext<ApprovalGateValue | null>(null);

export const ApprovalGateProvider = ({ children }: { children: ReactNode }) => {
    const value = useApprovalGateState();
    return <ApprovalGateContext.Provider value={value}>{children}</ApprovalGateContext.Provider>;
};

export const useApprovalGate = () => {
    const value = useContext(ApprovalGateContext);
    if (!value) throw new Error('useApprovalGate must be used inside an ApprovalGateProvider');
    return value;
};
