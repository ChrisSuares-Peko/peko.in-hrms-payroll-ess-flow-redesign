const { getInvoiceDocument, getInvoiceUrl } = require('../ondcDocuments');

const INVOICE = { url: 'https://seller-np.com/invoices/O1.pdf', label: 'Invoice' };

describe('getInvoiceDocument', () => {
  it('picks the invoice-labelled document', () => {
    const docs = [{ url: 'https://seller/other.pdf', label: 'Delivery note' }, INVOICE];

    expect(getInvoiceDocument(docs)).toEqual(INVOICE);
  });

  // Sellers are inconsistent: the spec samples say "Invoice", real BPPs also send
  // "Invoice_link" and lower case.
  it('matches the label loosely', () => {
    expect(getInvoiceDocument([{ url: 'https://s/1.pdf', label: 'invoice_link' }])?.url)
      .toBe('https://s/1.pdf');
    expect(getInvoiceDocument([{ url: 'https://s/1.pdf', label: 'Tax Invoice' }])?.url)
      .toBe('https://s/1.pdf');
  });

  // One unlabelled document means the invoice — dropping it would leave the buyer
  // with nothing.
  it('falls back to the first document carrying a url', () => {
    expect(getInvoiceDocument([{ url: 'https://s/only.pdf' }])?.url).toBe('https://s/only.pdf');
    expect(getInvoiceDocument([{ url: 'https://s/a.pdf' }, { url: 'https://s/b.pdf' }])?.url)
      .toBe('https://s/a.pdf');
  });

  // Every caller either links to it or mails it, so a url-less entry is useless.
  it('ignores documents with no usable url', () => {
    expect(getInvoiceDocument([{ label: 'Invoice' }])).toBeNull();
    expect(getInvoiceDocument([{ label: 'Invoice', url: '   ' }])).toBeNull();
    expect(getInvoiceDocument([{ label: 'Invoice' }, { url: 'https://s/b.pdf' }])?.url)
      .toBe('https://s/b.pdf');
  });

  it('returns null for an empty, missing or malformed block', () => {
    expect(getInvoiceDocument([])).toBeNull();
    expect(getInvoiceDocument(null)).toBeNull();
    expect(getInvoiceDocument(undefined)).toBeNull();
    expect(getInvoiceDocument('not an array')).toBeNull();
  });

  it('trims the url and normalises a missing label', () => {
    expect(getInvoiceDocument([{ url: '  https://s/1.pdf  ' }])).toEqual({
      url: 'https://s/1.pdf',
      label: null,
    });
  });
});

describe('getInvoiceUrl', () => {
  it('flattens to the url, or null', () => {
    expect(getInvoiceUrl([INVOICE])).toBe(INVOICE.url);
    expect(getInvoiceUrl([])).toBeNull();
    expect(getInvoiceUrl(null)).toBeNull();
  });
});
