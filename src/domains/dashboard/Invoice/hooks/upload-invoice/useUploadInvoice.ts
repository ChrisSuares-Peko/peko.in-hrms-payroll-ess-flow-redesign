import { useEffect, useState } from 'react';

import { RcFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { RootState } from '@store/store';

import { invoice, uploadInvoiceApi } from '../../api/index';
import {
    setComments,
    setInvoiceDetails,
    setInvoiceResponse,
    setPaymentDetails,
    setPaymentMode,
    setPdfFile,
    setProductDetails,
    setRecipientDetails,
    setTermsConditions,
} from '../../slices/InvoicesSlices';
import { InvoiceResponse, ProductDetail } from '../../types/index';
import { UploadInvoiceResponse } from '../../types/uploadInvoiceType';

function validateAndSanitize(input: string | undefined) {
    if (!input) return false;
    return input.trim().replace(/[\r\n]+/g, ' ');
}

export default function useUploadInvoice() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);

    const [viewPdf, setViewPdf] = useState<any>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const invoiceDataRedux = useSelector((state: RootState) => state.reducer.invoices);

    const fileTypes = ['application/pdf'];
    const [invoiceData, setInvoiceData] = useState({
        billerName: '',
        billerEmail: '',
        billerCompanyAddress: '',
        billerPhone: '',
        billerTRNNumber: '',
        customerTRNNumber: '',
        customerName: '',
        customerEmail: '',
        customerAddress: '',
        customerPhone: '',
        invoiceNo: '',
        invoiceDate: '',
        dueDate: '',
        comments: '',
        termsConditions: '',
        billerGST: '',
        items: [{ amount: '', discount: '', item: '', price: '', quantity: '', gst: '' }],
        paymentDetails: '',
        shipping: '',
        invoiceDetails: {
            logo: '',
        },
        amountPaid: '',
        name: '',
        paymentMode: '',
    });

    const handleChange = async (selectedFile: RcFile) => {
        if (selectedFile && fileTypes.includes(selectedFile.type)) {
            setIsUploading(true);
            const response: UploadInvoiceResponse | false = await uploadInvoiceApi({
                userId: id,
                userType: role,
                file: selectedFile,
            });
            if (response) {
                const invoiceValues = response.invoiceData;
                const transformedItems = invoiceValues.invoiceItems.map(
                    ({ item, quantity, price }) => ({
                        item,
                        quantity,
                        amount: getTotalPrice(price, quantity),
                        price: price.includes('₹') ? price.replace('₹ ', '') : price,
                        discount: '0',
                        gst: '0',
                    })
                );
                const issuedDate = dayjs(invoiceValues?.issued_date, 'MMMM DD, YYYY');
                const dueDate = dayjs(invoiceValues?.invoice_due_date, 'MMMM DD, YYYY');

                const initialValues = {
                    ...invoiceData,
                    billerName: validateAndSanitize(invoiceValues?.merchant_name) || '',
                    customerName: validateAndSanitize(invoiceValues?.customer_name) || '',
                    customerAddress: validateAndSanitize(invoiceValues?.address) || '',
                    invoiceNo: validateAndSanitize(invoiceValues?.invoice_number) || '',
                    invoiceDate: issuedDate.isValid() ? issuedDate.format('YYYY-MM-DD') : '',
                    dueDate: dueDate.isValid() ? dueDate.format('YYYY-MM-DD') : '',
                    items: transformedItems,
                };
                setInvoiceData(initialValues);
                const base64File = await convertToBase64(selectedFile);
                dispatch(setPdfFile(base64File));
            }
            setIsUploading(false);
        } else {
            dispatch(
                showToast({
                    description: 'Please upload a valid PDF file',
                    variant: 'error',
                })
            );
        }
    };

    const generateInvoice = async (values: any, resetForm: any) => {
        // if (values.billerEmail === values.customerEmail) {
        //     dispatch(
        //         showToast({
        //             description: 'The biller and customer email addresses cannot be the same',
        //             variant: 'error',
        //         })
        //     );
        //     return;
        // }
        if (values.billerCompanyAddress === values.customerAddress) {
            dispatch(
                showToast({
                    description: 'The biller and customer addresses cannot be the same',
                    variant: 'error',
                })
            );
            return;
        }

        setIsLoading(true);

        const subTotal = values.items
            .reduce(
                (
                    acc: number,
                    item: {
                        price: { toString: () => string };
                        quantity: { toString: () => string };
                    }
                ) =>
                    acc +
                    (parseFloat(item.price.toString()) * parseFloat(item.quantity.toString()) || 0),
                0
            )
            .toFixed(2);
        const gst = values.items
            .reduce(
                (
                    acc: number,
                    item: {
                        gst: string;
                        price: { toString: () => string };
                        quantity: { toString: () => string };
                    }
                ) =>
                    acc +
                    ((parseFloat(item.gst) *
                        (parseFloat(item.price.toString()) * parseFloat(item.quantity.toString()) ||
                            0)) /
                        100 || 0),
                0
            )
            .toFixed(2);
        const discount = values.items
            .reduce(
                (
                    acc: number,
                    item: {
                        discount: string;
                        price: { toString: () => string };
                        quantity: { toString: () => string };
                    }
                ) =>
                    acc +
                    ((parseFloat(item.discount) *
                        (parseFloat(item.price.toString()) * parseFloat(item.quantity.toString()) ||
                            0)) /
                        100 || 0),
                0
            )
            .toFixed(2);
        const { shipping } = values;
        const { amountPaid } = values;
        const total = values.items
            .reduce(
                (acc: number, item: { amount: string }) => acc + (parseFloat(item.amount) || 0),
                0 + Number(values.shipping || 0)
            )
            .toFixed(2);

        const amountDue = values.items
            .reduce(
                (acc: number, item: { amount: string }) => acc + (parseFloat(item.amount) || 0),
                0 + Number(values.shipping || 0) - Number(values.amountPaid || 0)
            )
            .toFixed(2);

        const payload = {
            id: 0,
            invoiceId: 0,
            updatedAt: '',
            createdAt: '',
            comments: values.comments,
            termsConditions: values.termsConditions,
            paymentMode: values.paymentMode,
            paymentDetails: {
                subTotal,
                gst,
                discount,
                shipping,
                total,
                amountDue,
                amountPaid,
            },
            productDetails: values.items,
            invoiceDetails: {
                invoiceNo: values.invoiceNo,
                dueDate: values.dueDate,
                invoiceDate: values.invoiceDate,
                logo: user?.logo || '',
                invoiceName: 'Invoice',
            },
            recipientDetails: {
                billerName: values.billerName,
                billerEmail: values.billerEmail,
                billerCompanyAddress: values.billerCompanyAddress,
                billerPhone: values.billerPhone,
                billerGST: values.billerGST,
                billerTRNNumber: values.billerTRNNumber,
                customerTRNNumber: values.customerTRNNumber,
                customerName: values.customerName,
                customerAddress: values.customerAddress,
                customerEmail: values.customerEmail,
                customerPhone: values.customerPhone,
                logo: undefined,
            },
        };
        const res: InvoiceResponse | false = await invoice({
            ...payload,
            userId: id,
            userType: role,
        });
        dispatch(setRecipientDetails(payload.recipientDetails));
        dispatch(setInvoiceDetails(payload.invoiceDetails));
        dispatch(setPaymentMode(payload.paymentMode));
        dispatch(setProductDetails(payload.productDetails));
        dispatch(setComments(payload.comments));
        dispatch(setTermsConditions(payload.termsConditions));
        dispatch(setPaymentDetails(payload.paymentDetails));

        dispatch(setInvoiceResponse(res));
        if (res) {
            navigate(
                `/${paths.invoice.index}/${paths.invoice.create}/${paths.invoice.invoicedetails}`
            );
            resetForm();
            // dispatch(resetState());
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (invoiceDataRedux) {
            const {
                billerName,
                billerEmail,
                billerCompanyAddress,
                billerPhone,
                billerGST,
                billerTRNNumber,
                customerName,
                customerEmail,
                customerAddress,
                customerPhone,
                customerTRNNumber,
            } = invoiceDataRedux.recipientDetails;
            const { invoiceNo, invoiceDate, dueDate } = invoiceDataRedux.invoiceDetails;
            const { paymentMode, productDetails, comments, termsConditions, pdfFile } =
                invoiceDataRedux;
            const { shipping, amountPaid } = invoiceDataRedux.paymentDetails;
            setInvoiceData(prevData => ({
                ...prevData,
                billerName: prevData.billerName || billerName || '',
                billerEmail: prevData.billerEmail || billerEmail || '',
                billerCompanyAddress: prevData.billerCompanyAddress || billerCompanyAddress || '',
                billerPhone: prevData.billerPhone || `${billerPhone}` || '',
                billerGST: prevData.billerGST || billerGST || '',
                billerTRNNumber: prevData.billerTRNNumber || billerTRNNumber || '',
                customerName: prevData.customerName || customerName || '',
                customerEmail: prevData.customerEmail || customerEmail || '',
                customerAddress: prevData.customerAddress || customerAddress || '',
                customerPhone: prevData.customerPhone || customerPhone || '',
                customerTRNNumber: prevData.customerTRNNumber || customerTRNNumber || '',
                invoiceNo: prevData.invoiceNo || invoiceNo || '',
                invoiceDate: prevData.invoiceDate || invoiceDate || '',
                dueDate: prevData.dueDate || dueDate || '',
                paymentMode: prevData.paymentMode || paymentMode || '',
                items: findProductDetails(prevData.items, productDetails),
                comments: prevData.comments || comments || '',
                termsConditions: prevData.termsConditions || termsConditions || '',
                shipping: prevData.shipping || shipping || '',
                amountPaid: prevData.amountPaid || amountPaid || '',
            }));
            if (pdfFile) {
                setViewPdf(pdfFile);
            }
        }
    }, [invoiceDataRedux]);

    return { handleChange, viewPdf, isUploading, invoiceData, generateInvoice, isLoading };
}

const convertToBase64 = (file: RcFile): Promise<string | ArrayBuffer | null> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

const findProductDetails = (prevItem: any, reduxItem: ProductDetail[]) => {
    // prevItem has values then return prevItem else return data from redux
    if (prevItem.length) {
        const item = prevItem[0];
        if (item.amount || item.discount || item.price || item.quantity || item.gst)
            return prevItem;
    }
    return reduxItem || [];
};

const getTotalPrice = (price: string, quantity: string) => {
    const q = Number(quantity);
    if (price.includes('₹')) {
        price = price.replace('₹', '');
    }

    return `${Number(price) * Number(q)}`;
};
