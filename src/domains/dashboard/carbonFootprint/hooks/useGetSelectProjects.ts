import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getNeutriliseNowData, getSelectProjects } from '../api/index';
import {
    Project,
    neutrilizeResponse,
    projectOptions,
    selectProjectResponse,
} from '../types/dashboard';

export default function useGetSelectProjects() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selected, setSelected] = useState<number | undefined | string>();
    const [loader, setLoader] = useState(true);
    const [selectData, setSelectData] = useState<projectOptions[]>();
    const [projectData, setProjectData] = useState<Project>();
    const [amount, setAmount] = useState<any>();
    const [value, setValue] = useState<any>();
    const [credit, setCredit] = useState<any>();
    const [conversionRate, setConversionRate] = useState<any>();
    const getData = useCallback(async () => {
        const data: selectProjectResponse | false = await getSelectProjects({
            userId: id,
            userType: role,
        });
        if (data && data.projectOptions) {
            setSelectData(data.projectOptions);
            setSelected(data.projectOptions[0].id);
        }
    }, [role, id]);
    const getProjectDataByID = useCallback(
        async (projectId: string | number | undefined) => {
            const data: neutrilizeResponse | false = await getNeutriliseNowData({
                userId: id,
                userType: role,
                projectId,
            });
            if (data && data.data) {
                setProjectData(data.data);
                setConversionRate(data.usdToInr);
                setValue(data.data.rate.priceToPartner * Number(data.usdToInr));
            }
            setTimeout(() => setLoader(false), 1000);
        },
        [role, id]
    );
    const changeSelectedOption = (e: any) => {
        setSelected(e);
        setLoader(true);
    };
    const handleAmountChange = (event: any) => {
        if (selectedPackage !== null) setSelectedPackage(null);
        let filteredValue = event.target.value;
        filteredValue = event.target.value.replace(/[^\d.]/g, '');
        if (filteredValue) setAmount(filteredValue);
        else setAmount(null);
        const creditValue = (parseFloat(filteredValue) / value).toFixed(4);
        if (Number.isNaN(parseFloat(creditValue))) {
            setCredit(null);
        } else {
            const parsedCreditValue = parseFloat(creditValue);
            setCredit(
                parsedCreditValue === parseInt(creditValue, 10)
                    ? parseInt(creditValue, 10).toString()
                    : parsedCreditValue.toString()
            );
        }
    };
    const handleCreditChange = (event: any) => {
        if (selectedPackage !== null) setSelectedPackage(null);
        let filteredValue = event.target.value;
        filteredValue = event.target.value.replace(/[^\d.]/g, '');
        if (filteredValue) setCredit(filteredValue);
        else setCredit(null);
        const amountValue = (parseFloat(filteredValue) * value).toFixed(2);
        if (Number.isNaN(parseFloat(amountValue))) {
            setAmount(null);
        } else {
            const parsedAmountValue = parseFloat(amountValue);
            setAmount(
                parsedAmountValue === parseInt(amountValue, 10)
                    ? parseInt(amountValue, 10).toString()
                    : parsedAmountValue.toString()
            );
        }
    };
    const handleSelectPackage = (e: any) => {
        if (amount || credit) {
            setAmount('');
            setCredit('');
        }
        setSelectedPackage(e.target.value);
    };
    useEffect(() => {
        getData();
    }, [getData]);
    useEffect(() => {
        getProjectDataByID(selected);
        setAmount('');
        setCredit('');
        setSelectedPackage(null);
    }, [selected, getProjectDataByID]);

    return {
        selectData,
        loading: loader,
        selected,
        changeSelectedOption,
        projectData,
        amount,
        credit,
        ConversionUsdToInr: conversionRate,
        handleAmountChange,
        handleCreditChange,
        value,
        selectedPackage,
        handleSelectPackage,
    };
}
