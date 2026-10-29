import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getNeutriliseNowData } from '../api/index';
import { Project, neutrilizeResponse } from '../types/dashboard';

export default function useGetNeutriliseData(projectId: string | number | undefined) {
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [projectData, setProjectData] = useState<Project>();
    const [calculatedRate, setCalculatedRate] = useState<any>();
    const [amount, setAmount] = useState<any>();
    const [value, setValue] = useState<any>();
    const [credit, setCredit] = useState<any>();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [co2FootPrint, setCo2FootPrint] = useState<string>();
    const [conversionRate, setConversionRate] = useState<any>();
    const [click, setClick] = useState<boolean>(false);
    const [percentage, setPercentage] = useState<any>(0);
    const getData = useCallback(async () => {
        const data: neutrilizeResponse | false = await getNeutriliseNowData({
            userId: id,
            userType: role,
            projectId,
        });
        if (data && data.data) {
            setProjectData(data.data);
            setConversionRate(data.usdToInr);
            setCalculatedRate((data.calculatedRate * data.usdToInr).toFixed(2));
            setValue(data.data.rate.priceToPartner * data.usdToInr);
            setCo2FootPrint(data.co2FootPrint);
        } else
            navigate(
                `${paths.dashboard.moreServices}/${paths.zeroCarbon.index}/${paths.zeroCarbon.projectListing}`
            );
        setIsLoading(false);
    }, [role, id, projectId, navigate]);
    useEffect(() => {
        if (projectId) getData();
        else
            navigate(
                `${paths.dashboard.moreServices}/${paths.zeroCarbon.index}/${paths.zeroCarbon.projectListing}`
            );
    }, [getData, navigate, projectId]);

    const handleAmountChange = (event: any) => {
        if (selectedPackage !== null) setSelectedPackage(null);
        else if (click) setClick(false);
        let filteredValue = event.target.value;
        filteredValue = event.target.value.replace(/[^\d.]/g, '');
        if (filteredValue) setAmount(filteredValue);
        else setAmount(null);
        const creditValue = (parseFloat(filteredValue) / value).toFixed(4);
        calculatePercentage(Number.isNaN(parseFloat(creditValue)) ? 0 : creditValue, co2FootPrint);
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
        else if (click) setClick(false);
        let filteredValue = event.target.value;
        filteredValue = event.target.value.replace(/[^\d.]/g, '');
        calculatePercentage(filteredValue, co2FootPrint);
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
    function calculatePercentage(customCO2: any, baseCO2: any) {
        if (customCO2 === 0) {
            setPercentage(0);
        }
        setPercentage(((customCO2 / baseCO2) * 100).toFixed());
    }
    const handleSelectPackage = (e: any) => {
        if (amount || credit) {
            setAmount('');
            setCredit('');
        } else if (click) setClick(false);
        calculatePercentage(projectData?.packages[e.target.value].credits, co2FootPrint);
        setSelectedPackage(e.target.value);
    };
    const handleNeutrilizefull = () => {
        if (click) setClick(false);
        else if (selectedPackage !== null) setSelectedPackage(null);
        calculatePercentage(co2FootPrint, co2FootPrint);
        setCredit(Number(co2FootPrint!));
        const amountValue = (parseFloat(co2FootPrint!) * value).toFixed(2);
        if (Number.isNaN(parseFloat(amountValue))) {
            setAmount('0');
        } else {
            const parsedAmountValue = parseFloat(amountValue);
            setAmount(
                parsedAmountValue === parseInt(amountValue, 10)
                    ? parseInt(amountValue, 10).toString()
                    : parsedAmountValue.toString()
            );
        }
    };
    return {
        projectData,
        isLoading,
        calculatedRate,
        co2FootPrint,
        handleAmountChange,
        handleCreditChange,
        amount,
        credit,
        ConversionusdToInr: conversionRate,
        selectedPackage,
        handleSelectPackage,
        handleNeutrilizefull,
        click,
        percentage,
        value,
    };
}
