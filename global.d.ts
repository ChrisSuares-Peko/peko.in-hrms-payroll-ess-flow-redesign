declare module 'react-idle-timer/legacy';
declare module 'react-pdf-viewer/thumbnail';
declare module 'react-pdf-viewer';
declare module 'pdfjs-dist';
declare module 'pdfjs-dist/build/pdf.worker.entry';
declare module 'uuid';
declare module '@cashfreepayments/cashfree-js';

// Razorpay Standard Checkout is a plain script (https://checkout.razorpay.com/v1/checkout.js)
interface Window {
    Razorpay?: any;
}
