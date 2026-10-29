const QRCode = require('qrcode');

const fmt = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const TRANS_MODE_LABEL = { '1': 'Road', '2': 'Rail', '3': 'Air', '4': 'Ship' };

const STATE_CODE_TO_NAME = {
    '1': 'Jammu and Kashmir', '2': 'Himachal Pradesh', '3': 'Punjab', '4': 'Chandigarh',
    '5': 'Uttarakhand', '6': 'Haryana', '7': 'Delhi', '8': 'Rajasthan', '9': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
    '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
    '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '29': 'Karnataka',
    '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

exports.buildEInvoiceHtml = async (invoice, ackNo, ackDt, irn, signedQRCode, ewaybill = null, status = null, cancelledDate = null) => {
    let qrDataUrl = null;
    if (signedQRCode) {
        try {
            qrDataUrl = await QRCode.toDataURL(signedQRCode, { width: 300, margin: 2, errorCorrectionLevel: 'L' });
        } catch (e) {
            qrDataUrl = null;
        }
    }

    const seller = invoice.SellerDtls || {};
    const buyer  = invoice.BuyerDtls  || {};
    const items  = invoice.ItemList   || [];
    const val    = invoice.ValDtls    || {};
    const doc    = invoice.DocDtls    || {};
    const tran   = invoice.TranDtls   || {};

    const igst = parseFloat(val.IgstVal  || 0);
    const cgst = parseFloat(val.CgstVal  || 0);
    const sgst = parseFloat(val.SgstVal  || 0);
    const disc = parseFloat(val.Discount || 0);
    const oth  = parseFloat(val.OthChrg  || 0);

    const docTypeLabel = doc.Typ === 'INV' ? 'Tax Invoice'
        : doc.Typ === 'CRN' ? 'Credit Note'
        : doc.Typ === 'DBN' ? 'Debit Note'
        : doc.Typ || 'Tax Invoice';

    const rows = items.map((item, i) => `
        <tr>
            <td class="c">${i + 1}</td>
            <td>
                <span class="item-name">${item.PrdDesc || ''}</span>
                <span class="item-hsn">HSN/SAC: ${item.HsnCd || ''}</span>
            </td>
            <td class="c">${item.Unit || ''}</td>
            <td class="r">${fmt(item.Qty)}</td>
            <td class="r">&#8377;&nbsp;${fmt(item.UnitPrice)}</td>
            <td class="r">&#8377;&nbsp;${fmt(item.AssAmt)}</td>
            <td class="c">${item.GstRt || 0}%</td>
            <td class="r">${fmt(item.IgstAmt)}</td>
            <td class="r">${fmt(item.CgstAmt)}</td>
            <td class="r">${fmt(item.SgstAmt)}</td>
            <td class="r total-cell">&#8377;&nbsp;${fmt(item.TotItemVal)}</td>
        </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }

  .page {
    width: 210mm;
    padding: 10mm 12mm;
  }

  /* ── Top header bar ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 2px solid #333;
  }
  .header .company-name { font-size: 17px; font-weight: 700; letter-spacing: 0.3px; }
  .header .company-sub  { font-size: 10px; color: #555; margin-top: 3px; line-height: 1.6; }
  .header .invoice-label { text-align: right; }
  .header .invoice-label .title { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
  .header .invoice-label .doc-meta { font-size: 10px; color: #555; margin-top: 4px; line-height: 1.7; }
  .header .invoice-label .doc-meta strong { color: #1a1a1a; }

  /* ── IRN strip ── */
  .irn-strip {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 7px 10px;
    margin-bottom: 10px;
    font-size: 9.5px;
  }
  .irn-strip .irn-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
  .irn-strip .irn-label { font-weight: 700; white-space: nowrap; min-width: 30px; }
  .irn-strip .irn-value { font-family: 'Courier New', monospace; font-size: 9.5px; font-weight: 600; word-break: break-all; }
  .irn-strip .irn-meta  { display: flex; gap: 24px; flex-wrap: wrap; }
  .irn-strip .irn-meta span { color: #444; }
  .irn-strip .irn-meta strong { color: #1a1a1a; }

  /* ── Party section ── */
  .party-section {
    display: flex;
    gap: 0;
    border: 1px solid #ccc;
    border-radius: 3px;
    margin-bottom: 10px;
    overflow: hidden;
  }
  .party-box { flex: 1; padding: 9px 11px; }
  .party-box + .party-box { border-left: 1px solid #ccc; }
  .party-box .party-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #777;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #eee;
  }
  .party-box .party-name { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
  .party-box .party-gstin { font-size: 10px; font-weight: 600; margin-bottom: 5px; color: #333; }
  .party-box p { font-size: 10px; color: #444; line-height: 1.65; }

  /* ── Items table ── */
  .items-wrap { border: 1px solid #ccc; border-radius: 3px; overflow: hidden; margin-bottom: 0; }
  table.items { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.items thead tr { background: #2b2b2b; color: #fff; }
  table.items thead th { padding: 7px 5px; font-size: 9.5px; font-weight: 600; text-align: center; border-right: 1px solid #444; }
  table.items thead th:last-child { border-right: none; }
  table.items tbody td { padding: 7px 5px; border-bottom: 1px solid #e8e8e8; border-right: 1px solid #e8e8e8; vertical-align: middle; }
  table.items tbody td:last-child { border-right: none; }
  table.items tbody tr:last-child td { border-bottom: none; }
  table.items tbody tr:nth-child(even) { background: #fafafa; }
  table.items tfoot td { padding: 7px 5px; background: #f0f0f0; border-top: 2px solid #ccc; border-right: 1px solid #ccc; font-weight: 700; font-size: 10.5px; }
  table.items tfoot td:last-child { border-right: none; }
  .item-name { display: block; font-weight: 600; }
  .item-hsn  { display: block; font-size: 9px; color: #888; margin-top: 1px; }
  .c { text-align: center; }
  .r { text-align: right; }
  .total-cell { font-weight: 700; }

  /* ── Summary + QR row ── */
  .bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border: 1px solid #ccc;
    border-top: none;
    border-radius: 0 0 3px 3px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .notes-box { flex: 1; padding: 9px 11px; border-right: 1px solid #ccc; }
  .notes-box .notes-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #777; margin-bottom: 5px; }
  .notes-box p { font-size: 9.5px; color: #555; line-height: 1.7; }

  .ewb-section { margin: 12px 0; border: 1px solid #ccc; border-radius: 4px; padding: 10px 12px; }
  .ewb-section .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #777; margin-bottom: 8px; }
  .ewb-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .ewb-table td { padding: 4px 8px; border: 1px solid #e0e0e0; }
  .ewb-table td:nth-child(odd) { color: #555; font-weight: 600; width: 18%; background: #f9f9f9; }
  .ewb-table td:nth-child(even) { color: #1a1a1a; width: 32%; }

  .totals-box { width: 230px; }
  .totals-box table { width: 100%; border-collapse: collapse; }
  .totals-box td { padding: 5px 10px; font-size: 10.5px; border-bottom: 1px solid #eee; }
  .totals-box .tl { color: #555; }
  .totals-box .tr { text-align: right; font-weight: 600; }
  .totals-box .grand-row td { border-bottom: none; border-top: 2px solid #333; font-size: 12px; font-weight: 700; color: #1a1a1a; padding-top: 7px; padding-bottom: 7px; }

  /* ── Cancelled watermark ── */
  .page { position: relative; }
  .cancelled-watermark {
    position: absolute;
    top: 45%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 90px;
    font-weight: 900;
    color: rgba(220, 38, 38, 0.10);
    letter-spacing: 8px;
    text-transform: uppercase;
    white-space: nowrap;
    z-index: 0;
    pointer-events: none;
  }
  .cancelled-banner {
    background: #fef2f2;
    border: 1.5px solid #dc2626;
    border-radius: 4px;
    padding: 8px 14px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cancelled-banner .cb-label {
    font-size: 13px;
    font-weight: 700;
    color: #dc2626;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .cancelled-banner .cb-date {
    font-size: 10.5px;
    color: #555;
  }

  /* ── Footer ── */
  .page-footer {
    padding-top: 8px;
    border-top: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .page-footer .footer-note { font-size: 9px; color: #aaa; line-height: 1.6; }
  .qr-block { text-align: center; }
  .qr-block img { display: block; width: 150px; height: 150px; border: 1px solid #ddd; }
  .qr-block .qr-label { font-size: 8.5px; color: #888; margin-top: 3px; }
</style>
</head>
<body>
<div class="page">

  ${status === 'CANCELLED' ? `<div class="cancelled-watermark">CANCELLED</div>` : ''}

  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${seller.LglNm || seller.TrdNm || ''}</div>
      <div class="company-sub">
        GSTIN: ${seller.Gstin || ''}<br/>
        ${[seller.Addr1, seller.Addr2].filter(Boolean).join(', ')}<br/>
        ${[seller.Loc, STATE_CODE_TO_NAME[String(parseInt(seller.Stcd, 10))] || seller.Stcd].filter(Boolean).join(', ')}${seller.Pin ? ' &ndash; ' + seller.Pin : ''}
        ${seller.Ph ? '<br/>Phone: ' + seller.Ph : ''}
      </div>
    </div>
    <div class="invoice-label">
      <div class="title">${docTypeLabel}</div>
      <div class="doc-meta">
        Invoice No. &nbsp;<strong>${doc.No || ''}</strong><br/>
        Date &nbsp;<strong>${doc.Dt || ''}</strong><br/>
        Supply Type &nbsp;<strong>${tran.SupTyp || ''}</strong><br/>
        Reverse Charge &nbsp;<strong>${tran.RegRev === 'Y' ? 'Yes' : 'No'}</strong>
      </div>
    </div>
  </div>

  <!-- IRN -->
  <div class="irn-strip">
    <div class="irn-row">
      <span class="irn-label">IRN</span>
      <span class="irn-value">${irn || ''}</span>
    </div>
    <div class="irn-meta">
      <span>Ack No: <strong>${ackNo || ''}</strong></span>
      <span>Ack Date: <strong>${ackDt || ''}</strong></span>
    </div>
  </div>

  ${status === 'CANCELLED' ? `
  <div class="cancelled-banner">
    <span class="cb-label">&#10006; Cancelled Invoice</span>
    ${cancelledDate ? `<span class="cb-date">Cancelled on: ${new Date(cancelledDate).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>` : ''}
  </div>` : ''}

  <!-- Parties -->
  <div class="party-section">
    <div class="party-box">
      <div class="party-title">Bill From &mdash; Seller</div>
      <div class="party-name">${seller.LglNm || ''}</div>
      ${seller.TrdNm && seller.TrdNm !== seller.LglNm ? `<div class="party-gstin">${seller.TrdNm}</div>` : ''}
      <div class="party-gstin">GSTIN: ${seller.Gstin || ''}</div>
      <p>${[seller.Addr1, seller.Addr2].filter(Boolean).join(', ')}</p>
      <p>${[seller.Loc, STATE_CODE_TO_NAME[String(parseInt(seller.Stcd, 10))] || seller.Stcd].filter(Boolean).join(', ')}${seller.Pin ? ' &ndash; ' + seller.Pin : ''}</p>
      ${seller.Ph ? `<p>Phone: ${seller.Ph}</p>` : ''}
      ${seller.Em ? `<p>Email: ${seller.Em}</p>` : ''}
    </div>
    <div class="party-box">
      <div class="party-title">Bill To &mdash; Buyer</div>
      <div class="party-name">${buyer.LglNm || ''}</div>
      ${buyer.TrdNm && buyer.TrdNm !== buyer.LglNm ? `<div class="party-gstin">${buyer.TrdNm}</div>` : ''}
      <div class="party-gstin">GSTIN: ${buyer.Gstin || ''}</div>
      <p>${[buyer.Addr1, buyer.Addr2].filter(Boolean).join(', ')}</p>
      <p>${[buyer.Loc, STATE_CODE_TO_NAME[String(parseInt(buyer.Stcd, 10))] || buyer.Stcd].filter(Boolean).join(', ')}${buyer.Pin ? ' &ndash; ' + buyer.Pin : ''}</p>
      ${buyer.Ph ? `<p>Phone: ${buyer.Ph}</p>` : ''}
      ${buyer.Em ? `<p>Email: ${buyer.Em}</p>` : ''}
      <p>Place of Supply: <strong>${STATE_CODE_TO_NAME[String(parseInt(buyer.POS || buyer.Pos, 10))] || buyer.POS || buyer.Pos || ''}</strong></p>
    </div>
  </div>

  <!-- Items -->
  <div class="items-wrap">
    <table class="items">
      <thead>
        <tr>
          <th style="width:28px">#</th>
          <th style="text-align:left">Item Description</th>
          <th>Unit</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Taxable Amt</th>
          <th>GST%</th>
          <th>IGST&nbsp;(&#8377;)</th>
          <th>CGST&nbsp;(&#8377;)</th>
          <th>SGST&nbsp;(&#8377;)</th>
          <th>Total&nbsp;(&#8377;)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="5" class="r">Sub-Total</td>
          <td class="r">&#8377;&nbsp;${fmt(val.AssVal)}</td>
          <td></td>
          <td class="r">${fmt(igst)}</td>
          <td class="r">${fmt(cgst)}</td>
          <td class="r">${fmt(sgst)}</td>
          <td class="r">&#8377;&nbsp;${fmt(val.TotInvVal)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Summary + Notes -->
  <div class="bottom-row">
    <div class="notes-box">
      <div class="notes-title">Notes</div>
      <p>&bull; This is a computer-generated e-Invoice authenticated by the Government of India (NIC).</p>
      <p>&bull; The IRN is digitally signed and cannot be altered after generation.</p>
    </div>
    <div class="totals-box">
      <table>
        <tr><td class="tl">Taxable Amount</td><td class="tr">&#8377; ${fmt(val.AssVal)}</td></tr>
        ${igst > 0 ? `<tr><td class="tl">IGST</td><td class="tr">&#8377; ${fmt(val.IgstVal)}</td></tr>` : ''}
        ${cgst > 0 ? `<tr><td class="tl">CGST</td><td class="tr">&#8377; ${fmt(val.CgstVal)}</td></tr>` : ''}
        ${sgst > 0 ? `<tr><td class="tl">SGST</td><td class="tr">&#8377; ${fmt(val.SgstVal)}</td></tr>` : ''}
        ${disc > 0 ? `<tr><td class="tl">Discount</td><td class="tr">&minus; &#8377; ${fmt(val.Discount)}</td></tr>` : ''}
        ${oth  > 0 ? `<tr><td class="tl">Other Charges</td><td class="tr">&#8377; ${fmt(val.OthChrg)}</td></tr>` : ''}
        <tr class="grand-row"><td class="tl">Total Invoice Value</td><td class="tr">&#8377; ${fmt(val.TotInvVal)}</td></tr>
      </table>
    </div>
  </div>

  <!-- E-Waybill Details -->
  ${ewaybill ? `
  <div class="ewb-section">
    <div class="section-title">E-Waybill Details</div>
    <table class="ewb-table">
      <tr><td>EWB No</td><td>${ewaybill.ewbNo || ''}</td><td>EWB Date</td><td>${ewaybill.ewbDt || ''}</td></tr>
      <tr><td>Valid Till</td><td>${ewaybill.ewbValidTill || ''}</td><td>Distance (km)</td><td>${ewaybill.distance || ''}</td></tr>
      <tr><td>Trans Mode</td><td>${TRANS_MODE_LABEL[String(ewaybill.transMode)] || ewaybill.transMode || ''}</td><td>Vehicle No</td><td>${ewaybill.vehNo || ''}</td></tr>
      ${ewaybill.transId ? `<tr><td>Transporter ID</td><td>${ewaybill.transId}</td><td>Transporter Name</td><td>${ewaybill.transName || ''}</td></tr>` : ''}
      <tr><td>Status</td><td>${ewaybill.status || ''}</td><td></td><td></td></tr>
    </table>
  </div>` : ''}

  <!-- Page Footer -->
  <div class="page-footer">
    <div class="footer-note">
      Generated via Peko e-Invoice System<br/>
      IRN: ${irn || ''}<br/>
      Ack No: ${ackNo || ''}
    </div>
    ${qrDataUrl ? `
    <div class="qr-block">
      <img src="${qrDataUrl}"/>
      <div class="qr-label">Scan to Verify e-Invoice</div>
    </div>` : ''}
  </div>

</div>
</body>
</html>`;
};
