import Computers from '@domains/dashboard/officeSupplies/assets/icons/Computers.svg';
import Desktop from '@domains/dashboard/officeSupplies/assets/icons/Desktop.svg';
import Electronics from '@domains/dashboard/officeSupplies/assets/icons/Electronics.svg';
import Essentials from '@domains/dashboard/officeSupplies/assets/icons/Essentials.svg';
import Printers from '@domains/dashboard/officeSupplies/assets/icons/Printers.svg';
import Renewable from '@domains/dashboard/officeSupplies/assets/icons/Renewable.svg';
import Stamps from '@domains/dashboard/officeSupplies/assets/icons/Stamps.svg';
import Stationary from '@domains/dashboard/officeSupplies/assets/icons/Stationary.svg';
import Toner from '@domains/dashboard/officeSupplies/assets/icons/Toner & Ink.svg';

export const categoryIcons = {
    Computers,
    Electronics,
    Desktop,
    Essentials,
    Printers,
    'Toner & Ink': Toner,
    Stationary,
    Stamps,
    Renewable,
};
export const officeSuppliesFilterOptions = [
    {
        value: 'all',
        label: 'All',
    },
    {
        value: 'popular',
        label: 'Popular',
    },
    {
        value: 'recent',
        label: 'Recent',
    },
    {
        value: 'name',
        label: 'Name',
    },
];

export const orderCancellationReasons = [
    'Order Created By Mistake',
    'Item(s) Would Not Arrive on Time',
    'Shipping Cost Too High',
    'Item Price Too High',
    'Found Cheaper Somewhere Else',
    'Need to Change Shipping Address',
    'Need to Change Shipping Speed',
    'Need to Change Billing Address',
    'Need to change Payment Method',
    'Other',
];
export const productReturnReasons = [
    'Wrong size or fit',
    'Defective or damaged product',
    'Changed mind',
    'Received the wrong item',
    'Quality concerns',
    'Unsatisfactory performance',
    'Duplicate or accidental purchase',
    'Not as described',
    'Late delivery',
    'Gift return',
    'Other',
];

export const categories = [
    {
        id: 2,
        categoryName: 'Electronics',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699283583694.png?alt=media&token=cf1fea39-4cfa-4ec8-bebd-40819b437b97',
        categoryStatus: true,
        createdAt: '2023-02-22T01:43:57.000Z',
        updatedAt: '2023-11-06T15:13:04.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 3,
        categoryName: 'Stationary',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699339999670.png?alt=media&token=82887f58-53ca-4ab9-9237-27efb19a379d',
        categoryStatus: true,
        createdAt: '2023-02-22T01:44:24.000Z',
        updatedAt: '2023-11-07T06:53:20.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 36,
        categoryName: 'Computers',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699283504669.png?alt=media&token=a32cbd5f-ffdb-4432-9c5f-075fce7230c8',
        categoryStatus: true,
        createdAt: '2023-11-06T15:11:45.000Z',
        updatedAt: '2023-11-06T15:11:45.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 37,
        categoryName: 'Desktop',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699284266748.png?alt=media&token=30b468f7-a4b4-4291-8bcc-893c67fda2c7',
        categoryStatus: true,
        createdAt: '2023-11-06T15:24:29.000Z',
        updatedAt: '2023-11-07T07:58:32.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 38,
        categoryName: 'Stamps',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699284308919.png?alt=media&token=d213d8fa-112e-435a-a68f-e30fca509fa3',
        categoryStatus: true,
        createdAt: '2023-11-06T15:25:09.000Z',
        updatedAt: '2023-11-06T15:25:09.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 39,
        categoryName: 'Toner & Ink',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699284352200.png?alt=media&token=4d94356a-a2ac-4da4-9c10-9ddaf7b78f3d',
        categoryStatus: true,
        createdAt: '2023-11-06T15:25:53.000Z',
        updatedAt: '2023-11-06T15:25:53.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 40,
        categoryName: 'Printers',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699292825459.png?alt=media&token=de6df60f-be3a-406a-98ca-7ec69c1a8411',
        categoryStatus: true,
        createdAt: '2023-11-06T15:26:15.000Z',
        updatedAt: '2023-11-06T17:47:07.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 41,
        categoryName: 'Essentials',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1699344672524.png?alt=media&token=c1456cfe-73cd-4eed-988e-17a9f09fda80',
        categoryStatus: true,
        createdAt: '2023-11-06T17:47:45.000Z',
        updatedAt: '2023-11-10T06:02:50.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
    {
        id: 43,
        categoryName: 'Renewable',
        categoryImage:
            'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1700556976450.png?alt=media&token=d1ce168b-2d65-447a-8b47-0dbb8d437e19',
        categoryStatus: true,
        createdAt: '2023-11-21T08:52:29.000Z',
        updatedAt: '2023-11-22T04:38:00.000Z',
        vendorId: 6,
        vendor: {
            id: 6,
            vendorName: 'Ecom',
        },
    },
];
