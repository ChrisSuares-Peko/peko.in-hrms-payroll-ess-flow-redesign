import * as Yup from 'yup';

import { RequiredExpiryDateDocs } from '../../utils/employeeDetails/utils';


export const docSchema = Yup.object().shape({
    name: Yup.string()
        .required('Please enter the document name')
        .matches(/^[^\s].*$/, 'Document name cannot start with a whitespace')
        .min(3, 'Document name must be atleast 3 characters'),
    employee: Yup.string().required('Please select an employee'),
    expiryDate: Yup.string().required('Please select a expiry date'),

    url: Yup.string().required('Please upload a document'),
});

export const employeeDocSchema = Yup.object().shape({
    name: Yup.string()
        .required('Please select the document'),

    expiryDate: Yup.string().test('expiryDate', 'Please select a expiry date', (value,context) => {
      const { name } = context.parent;
        if (RequiredExpiryDateDocs.includes(name) && !value) {
            return false;
        }
        return true;
    }),

    url: Yup.string().required('Please upload a document'),
});



export const assetSchema = Yup.object().shape({
  assetType: Yup.string()
    .required('Please enter the asset type')
    .matches(/^[^\s]/, 'Asset type cannot start with a whitespace')
    .matches(/[^\s]$/, 'Asset type cannot end with a whitespace')
    .matches(/^(?!.*\s{2})/, 'Asset type cannot contain consecutive whitespaces')
    .min(3, 'Asset type must be at least 3 characters'),

  assetName: Yup.string()
    .required('Please enter the asset name')
    .matches(/^[^\s]/, 'Asset name cannot start with a whitespace')
    .matches(/[^\s]$/, 'Asset name cannot end with a whitespace')
    .matches(/^(?!.*\s{2})/, 'Asset name cannot contain consecutive whitespaces')
    .min(3, 'Asset name must be at least 3 characters'),

  assetId: Yup.string()
    .required('Please enter the asset ID')
    .matches(/^[^\s]/, 'Asset ID cannot start with a whitespace')
    .matches(/[^\s]$/, 'Asset ID cannot end with a whitespace')
    .matches(/^(?!.*\s{2})/, 'Asset ID cannot contain consecutive whitespaces')
    .min(3, 'Asset ID must be at least 3 characters'),

  batchNo: Yup.string()
    .required('Please enter the batch number')
    .matches(/^[^\s]/, 'Batch number cannot start with a whitespace')
    .matches(/[^\s]$/, 'Batch number cannot end with a whitespace')
    .matches(/^(?!.*\s{2})/, 'Batch number cannot contain consecutive whitespaces')
    .min(3, 'Batch number must be at least 3 characters'),

  purchasedDate: Yup.string().required('Please select the purchased date'),
  employee: Yup.string().required('Please select a user'),
  status: Yup.string().required('Please select the status'),
});

