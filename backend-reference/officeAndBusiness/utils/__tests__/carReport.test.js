const {
  isPurchasable,
  resolveReportPrice,
  missingRequiredFields,
  buildVehicleModel,
  buildValuationSpec,
  buildPaasReportRequest,
  cleanReportUrl,
  extractPaasReport,
  summariseChallans,
  buildUsedPriceRequest,
  normalisePriceBands,
  formatDroomDate,
  normaliseHistoryResult,
  joinDroomSlot,
  buildInspectionBooking,
  initialReportStatus,
  buildProgressSteps,
} = require('../carReport');

describe('resolveReportPrice', () => {
  // Both must match Peko-IN-Frontend's vehicleReports/utils/reportMeta.ts, which shows
  // these numbers on the product cards before the BE ever recomputes them.
  it('prices the flat-rate products at their catalogue prices', () => {
    expect(resolveReportPrice('valuation')).toBe(199);
    expect(resolveReportPrice('history')).toBe(129);
    expect(isPurchasable('valuation')).toBe(true);
    expect(isPurchasable('history')).toBe(true);
  });

  // Inspection is priced per package, so the report type alone is not enough. Self
  // Inspection ('basic') is the only package Droom offers today.
  it('prices an inspection from its package id, not the report type', () => {
    expect(isPurchasable('inspection')).toBe(true);
    expect(resolveReportPrice('inspection', { packageId: 'basic' })).toBe(599);
    expect(resolveReportPrice('inspection', { packageId: 'premium' })).toBeNull();
  });

  // The ₹0 Health Report is a teaser card with a "Know more" button, not a product. It
  // must stay unbuyable even if someone posts its id directly.
  it('refuses the teaser package and any unknown package id', () => {
    expect(resolveReportPrice('inspection', { packageId: 'health-report' })).toBeNull();
    expect(resolveReportPrice('inspection', { packageId: 'gold-plated' })).toBeNull();
    expect(resolveReportPrice('inspection', {})).toBeNull();
    expect(resolveReportPrice('inspection')).toBeNull();
  });

  // A copy edit to a package's display name must never change what we charge.
  it('does not price an inspection from the package display name', () => {
    expect(resolveReportPrice('inspection', { packageId: 'Self Inspection' })).toBeNull();
  });

  it('refuses an unknown report type', () => {
    expect(resolveReportPrice('teleport')).toBeNull();
    expect(resolveReportPrice(undefined)).toBeNull();
  });
});

describe('missingRequiredFields', () => {
  const valuationBody = {
    make: 'Kia',
    model: 'Seltos',
    manufacturingYear: '2021',
    variant: 'HTX',
    kilometresDriven: '48000',
    city: 'Srinagar',
    vehicleCategory: 'car',
  };

  it('accepts a complete valuation payload', () => {
    expect(missingRequiredFields('valuation', valuationBody)).toEqual([]);
  });

  it('names every missing valuation field', () => {
    expect(missingRequiredFields('valuation', { ...valuationBody, variant: '', city: '' })).toEqual([
      'variant',
      'city',
    ]);
  });

  // History's only input is the plate, which arrives under either name depending on
  // whether the vehicle came from the fleet or was typed in.
  it('accepts a history payload under either plate field name', () => {
    expect(missingRequiredFields('history', { reg_num: 'HR26DD9739' })).toEqual([]);
    expect(missingRequiredFields('history', { registrationNumber: 'HR26DD9739' })).toEqual([]);
  });

  it('rejects a history payload with no plate at all', () => {
    expect(missingRequiredFields('history', {})).toEqual(['reg_num']);
  });

  // A full vehicle spec is not enough for history — it still has to carry the plate.
  it('does not let valuation fields satisfy history', () => {
    expect(missingRequiredFields('history', valuationBody)).toEqual(['reg_num']);
  });

  it('requires nothing of an unknown report type, leaving isPurchasable to reject it', () => {
    expect(missingRequiredFields('teleport', {})).toEqual([]);
  });

  describe('inspection', () => {
    const inspectionBody = {
      reg_num: 'KA01AB1234',
      packageId: 'basic',
      make: 'Kia',
      model: 'Seltos',
      manufacturingYear: '2021',
      variant: 'HTX',
      bodyType: 'SUV',
      contactName: 'Asha Menon',
      mobileNumber: '9876543210',
      fullAddress: '221B Residency Road',
      pincode: '560001',
      city: 'Bengaluru',
      state: 'Karnataka',
      slot1Date: '2026-08-05',
      slot1Time: '02:00 PM',
    };

    it('accepts a complete booking', () => {
      expect(missingRequiredFields('inspection', inspectionBody)).toEqual([]);
    });

    // Slot 2 is a genuinely optional second preference on the form.
    it('does not require a second slot', () => {
      expect(missingRequiredFields('inspection', inspectionBody)).not.toContain('slot2Date');
    });

    // Without it we cannot price the booking at all.
    it('requires the package id', () => {
      const noPackage = { ...inspectionBody, packageId: '' };
      expect(missingRequiredFields('inspection', noPackage)).toEqual(['packageId']);
    });

    // Every one of these is something Droom needs to actually send a technician.
    it('names each missing dispatch field', () => {
      expect(
        missingRequiredFields('inspection', {
          ...inspectionBody,
          fullAddress: '',
          slot1Time: '',
        })
      ).toEqual(['fullAddress', 'slot1Time']);
    });
  });
});

describe('buildPaasReportRequest', () => {
  const form = {
    make: 'Kia',
    model: 'Seltos',
    manufacturingYear: '2021',
    variant: 'HTX',
    kilometresDriven: '48000',
    city: 'Srinagar',
    vehicleCategory: 'Car',
  };

  it('maps the valuation form onto the vendor request', () => {
    expect(buildPaasReportRequest(form, 'Asha Menon')).toEqual({
      make: 'Kia',
      model: 'Seltos',
      year: '2021',
      trim: 'HTX',
      city: 'srinagar',
      owners: 'Asha Menon',
      kmsDriven: '48000',
      category: 'car',
    });
  });

  // The vendor sample sends lowercase city/category; the form capitalises both.
  it('lowercases the vendor-cased fields', () => {
    const request = buildPaasReportRequest({ ...form, city: 'New Delhi' }, 'x');
    expect(request.city).toBe('new delhi');
    expect(request.category).toBe('car');
  });

  it('defaults the category and never sends an empty owners', () => {
    const request = buildPaasReportRequest({ ...form, vehicleCategory: '' }, '');
    expect(request.category).toBe('car');
    expect(request.owners).toBe('NA');
  });
});

describe('cleanReportUrl', () => {
  // The vendor's own status sample carries a stray %22 glued onto the URL.
  it('strips the trailing quote artifacts seen in the vendor sample', () => {
    expect(cleanReportUrl('https://img1.orangebookvalue.com/photos/x.pdf%22')).toBe(
      'https://img1.orangebookvalue.com/photos/x.pdf'
    );
    expect(cleanReportUrl('https://img1.orangebookvalue.com/photos/x.pdf"')).toBe(
      'https://img1.orangebookvalue.com/photos/x.pdf'
    );
  });

  // The URL is persisted then rendered as a download link, so nothing non-https may
  // survive into the column.
  it('refuses anything that is not https', () => {
    expect(cleanReportUrl('http://img1.orangebookvalue.com/x.pdf')).toBe('');
    expect(cleanReportUrl('javascript:alert(1)')).toBe('');
    expect(cleanReportUrl('')).toBe('');
    expect(cleanReportUrl(null)).toBe('');
  });
});

describe('extractPaasReport', () => {
  // The captured create response — order id arrives as a number here, a string on status.
  it('reads the create response', () => {
    expect(
      extractPaasReport({
        code: 'success',
        data: { order_id: 203952333, report_path: null, status: 'pending' },
      })
    ).toEqual({ orderId: '203952333', status: 'pending', reportUrl: '', reportPath: '' });
  });

  it('reads the completed status response', () => {
    expect(
      extractPaasReport({
        code: 'success',
        data: {
          order_id: '203952333',
          report_path: '/photos/premium_reports/x.pdf',
          report_url: 'https://img1.orangebookvalue.com/photos/premium_reports/x.pdf',
          status: 'completed',
        },
      })
    ).toEqual({
      orderId: '203952333',
      status: 'completed',
      reportUrl: 'https://img1.orangebookvalue.com/photos/premium_reports/x.pdf',
      reportPath: '/photos/premium_reports/x.pdf',
    });
  });

  // "Did an order id come back" is the only reliable success test — the vendor documents
  // no error contract.
  it('returns null for a failure body or one with no order id', () => {
    expect(extractPaasReport({ code: 'error', data: { order_id: 1 } })).toBeNull();
    expect(extractPaasReport({ code: 'success', data: {} })).toBeNull();
    expect(extractPaasReport({})).toBeNull();
    expect(extractPaasReport(null)).toBeNull();
    expect(extractPaasReport('nope')).toBeNull();
  });
});

describe('buildVehicleModel', () => {
  it('prefers the selected fleet vehicle', () => {
    expect(
      buildVehicleModel({ make: 'Kia', model: 'Seltos', variant: 'HTX' }, { make: 'Tata' })
    ).toBe('Kia Seltos HTX');
  });

  it('falls back to the form values for a manually entered vehicle', () => {
    expect(buildVehicleModel({}, { make: 'Tata', model: 'Nexon', variant: 'XE' })).toBe(
      'Tata Nexon XE'
    );
  });

  it('leaves no double space when the spec has no variant', () => {
    expect(buildVehicleModel({}, { make: 'Tata', model: 'Nexon' })).toBe('Tata Nexon');
  });
});

describe('buildValuationSpec', () => {
  it('pre-formats the odometer the way the result card renders it', () => {
    expect(
      buildValuationSpec({
        make: 'Kia',
        model: 'Seltos',
        variant: 'HTX',
        manufacturingYear: '2021',
        kilometresDriven: '48000',
        city: 'Srinagar',
      })
    ).toEqual({
      modelName: 'Kia Seltos HTX',
      year: '2021',
      kilometres: '48,000 km',
      city: 'Srinagar',
    });
  });

  it('leaves the odometer blank rather than printing "NaN km"', () => {
    expect(buildValuationSpec({ kilometresDriven: 'lots' }).kilometres).toBe('');
    expect(buildValuationSpec({}).kilometres).toBe('');
  });
});

// The captured 200 from DROOM_MYBIZ_API_REFERENCE.md §4, verbatim — including the
// camelCase `vehicleManufacturerName` among snake_case siblings, the unpadded
// "6-June-2026", and "NA" standing in for null.
const RC_PAYLOAD = {
  blacklisted: false,
  blacklisted_reason: 'NA',
  body_type: 'S.U.V.',
  fuel_type: 'PETROL',
  hypothecation_type: 'Yes',
  insurance_company: 'HDFC ERGO GENERAL INSURANCE COMPANY LTD',
  insurance_upto: '27-March-2027',
  owner_serial_number: '1',
  owners_name: 'KHUSHBU KUMARI',
  pucc_upto: '6-June-2026',
  registration_date: '21-April-2017',
  registration_number: 'HR26DD9739',
  rto: 'SDM GURUGRAM, HARYANA',
  vehicleManufacturerName: 'HYUNDAI MOTOR INDIA LTD',
  vehicle_model: 'CRETA VTVT 1.6 SX PLUS AUTO',
};

describe('formatDroomDate', () => {
  // Droom does not zero-pad the day; the same payload carries both forms.
  it('pads and shortens both the padded and unpadded forms', () => {
    expect(formatDroomDate('27-March-2027')).toBe('27 Mar 2027');
    expect(formatDroomDate('6-June-2026')).toBe('06 Jun 2026');
  });

  it('drops the "NA" sentinel rather than printing it', () => {
    expect(formatDroomDate('NA')).toBe('');
    expect(formatDroomDate(null)).toBe('');
    expect(formatDroomDate(undefined)).toBe('');
  });

  // A date we cannot read is still worth showing — dropping it would silently hide data
  // the customer paid for.
  it('passes an unrecognised format straight through', () => {
    expect(formatDroomDate('2027-03-27')).toBe('2027-03-27');
    expect(formatDroomDate('27-Smarch-2027')).toBe('27-Smarch-2027');
  });
});

describe('normaliseHistoryResult', () => {
  it('shapes the captured RC payload into the card fields', () => {
    expect(normaliseHistoryResult(RC_PAYLOAD)).toEqual({
      modelName: 'HYUNDAI MOTOR INDIA LTD CRETA VTVT 1.6 SX PLUS AUTO',
      registrationNumber: 'HR26DD9739',
      ownership: 'KHUSHBU KUMARI (Owner 1)',
      registration: '21 Apr 2017 · SDM GURUGRAM, HARYANA',
      insurance: 'HDFC ERGO GENERAL INSURANCE COMPANY LTD · valid to 27 Mar 2027',
      puc: 'Valid to 06 Jun 2026',
      blacklist: 'Not blacklisted',
      hypothecation: 'Yes — loan on record',
      bodyType: 'S.U.V.',
      fuelType: 'PETROL',
    });
  });

  // The only success test available — Droom documents no error contract at all, so the
  // caller decides "unresolvable plate" on this returning null.
  it('returns null when no vehicle came back', () => {
    expect(normaliseHistoryResult({ ...RC_PAYLOAD, registration_number: '' })).toBeNull();
    expect(normaliseHistoryResult({})).toBeNull();
    expect(normaliseHistoryResult(null)).toBeNull();
    expect(normaliseHistoryResult('nope')).toBeNull();
  });

  // "Blacklisted — NA" would read as a system error rather than a clean record.
  it('names the reason only when the vehicle is actually blacklisted', () => {
    expect(
      normaliseHistoryResult({ ...RC_PAYLOAD, blacklisted: true, blacklisted_reason: 'NA' })
        .blacklist
    ).toBe('Blacklisted');
    expect(
      normaliseHistoryResult({ ...RC_PAYLOAD, blacklisted: true, blacklisted_reason: 'Theft' })
        .blacklist
    ).toBe('Blacklisted — Theft');
  });

  it('reads hypothecation_type as the Yes/No flag it actually is', () => {
    expect(normaliseHistoryResult({ ...RC_PAYLOAD, hypothecation_type: 'No' }).hypothecation).toBe(
      'No — no loan on record'
    );
    expect(normaliseHistoryResult({ ...RC_PAYLOAD, hypothecation_type: 'NA' }).hypothecation).toBe(
      'Not available'
    );
  });

  // Every field is rendered verbatim, so a gap has to say so rather than come out blank.
  it('falls back to "Not available" instead of an empty cell', () => {
    const sparse = normaliseHistoryResult({ registration_number: 'HR26DD9739' });
    expect(sparse.ownership).toBe('Not available');
    expect(sparse.registration).toBe('Not available');
    expect(sparse.insurance).toBe('Not available');
    expect(sparse.puc).toBe('Not available');
    // Nothing to name the vehicle with but the plate itself.
    expect(sparse.modelName).toBe('HR26DD9739');
  });

  // The RC endpoint does not return them; an empty "Challans" cell would read as
  // "none found", which is a claim we cannot make.
  it('never invents a challans field', () => {
    expect(normaliseHistoryResult(RC_PAYLOAD)).not.toHaveProperty('challans');
  });
});

describe('summariseChallans', () => {
  const challan = (status) => ({ challan_status: status });

  it('summarises counts with the pending tally', () => {
    expect(summariseChallans({ code: 'success', data: [challan('Pending')] })).toBe(
      '1 challan record (1 pending)'
    );
    expect(
      summariseChallans({ code: 'success', data: [challan('Pending'), challan('Disposed')] })
    ).toBe('2 challan records (1 pending)');
    expect(summariseChallans({ code: 'success', data: [challan('Disposed')] })).toBe(
      '1 challan record'
    );
  });

  // A clean vehicle comes back as code "failed" / "Data not found" — that is a clean
  // record, not an error (verified against the live endpoint).
  it('reads the vendor\'s "Data not found" as a clean record', () => {
    expect(summariseChallans({ code: 'failed', data: [], message: 'Data not found' })).toBe(
      'No challan records'
    );
    expect(summariseChallans({ code: 'success', data: [] })).toBe('No challan records');
  });

  // The card renders the row on presence — a lookup failure must make no claim.
  it('returns empty for a genuine failure', () => {
    expect(summariseChallans({ code: 'failed', message: 'authorization header is mandatory' })).toBe('');
    expect(summariseChallans(null)).toBe('');
    expect(summariseChallans('nope')).toBe('');
  });
});

describe('buildUsedPriceRequest', () => {
  const form = {
    make: 'Kia',
    model: 'Seltos',
    manufacturingYear: '2021',
    variant: 'HTX',
    kilometresDriven: '48000',
    city: 'Srinagar',
    purpose: 'buy',
    counterparty: 'dealer',
  };

  it('maps the valuation form onto the vendor request', () => {
    expect(buildUsedPriceRequest(form)).toEqual({
      make: 'Kia',
      model: 'Seltos',
      year: '2021',
      trim: 'HTX',
      kmsDriven: '48000',
      city: 'srinagar',
      customerType: 'dealer',
      transactionType: 'B',
      noOfOwners: '1',
    });
  });

  // A sell-side valuation has no counterparty on the form.
  it('defaults sell-side intent to an individual counterparty', () => {
    const request = buildUsedPriceRequest({ ...form, purpose: 'sell', counterparty: '' });
    expect(request.transactionType).toBe('S');
    expect(request.customerType).toBe('individual');
  });
});

describe('normalisePriceBands', () => {
  const obv = {
    code: 'success',
    data: {
      Excellent: { range_from: 486000, range_to: 515000 },
      'Very Good': { range_from: 452000, range_to: 486000 },
      Good: { range_from: 413000, range_to: 452000 },
      Fair: { range_from: 365000, range_to: 413000 },
    },
  };

  it('orders the four grades best to worst with Peko casing', () => {
    expect(normalisePriceBands(obv)).toEqual([
      { grade: 'Excellent', min: 486000, max: 515000 },
      { grade: 'Very good', min: 452000, max: 486000 },
      { grade: 'Good', min: 413000, max: 452000 },
      { grade: 'Fair', min: 365000, max: 413000 },
    ]);
  });

  // Number(null) is 0, so a bound the vendor could not price would otherwise render as
  // a confident ₹0 to ₹0 — a partial band set is still worth showing, a zeroed one is
  // actively misleading.
  it('drops a band with a missing or non-numeric bound instead of rendering zero', () => {
    const partial = {
      code: 'success',
      data: { ...obv.data, Good: { range_from: null, range_to: 452000 } },
    };
    expect(normalisePriceBands(partial).map((b) => b.grade)).toEqual([
      'Excellent',
      'Very good',
      'Fair',
    ]);
  });

  it('returns empty for a failure body or junk', () => {
    expect(normalisePriceBands({ code: 'failed', data: [] })).toEqual([]);
    expect(normalisePriceBands({ code: 'success', data: {} })).toEqual([]);
    expect(normalisePriceBands(null)).toEqual([]);
    expect(normalisePriceBands('nope')).toEqual([]);
  });
});

describe('joinDroomSlot', () => {
  // The form stores an ISO date and a 12-hour time separately; Droom wants one combined
  // `YYYY-MM-DD HH:mm:ss`.
  it('joins the form halves into the vendor datetime', () => {
    expect(joinDroomSlot('2026-08-05', '02:00 PM')).toBe('2026-08-05 14:00:00');
    expect(joinDroomSlot('2026-08-05', '09:30 AM')).toBe('2026-08-05 09:30:00');
  });

  // The two hours every 12-hour converter gets wrong.
  it('handles the midnight and midday boundaries', () => {
    expect(joinDroomSlot('2026-08-05', '12:00 AM')).toBe('2026-08-05 00:00:00');
    expect(joinDroomSlot('2026-08-05', '12:30 PM')).toBe('2026-08-05 12:30:00');
    expect(joinDroomSlot('2026-08-05', '11:59 PM')).toBe('2026-08-05 23:59:00');
  });

  // An unpicked slot 2 must vanish rather than reach Droom as a malformed half-string —
  // postDroomForm drops empty values.
  it('returns empty when either half is missing', () => {
    expect(joinDroomSlot('2026-08-05', '')).toBe('');
    expect(joinDroomSlot('', '02:00 PM')).toBe('');
    expect(joinDroomSlot(undefined, undefined)).toBe('');
  });

  // Better to send a slot we cannot parse than to silently drop one the customer picked.
  it('passes an unrecognised time through rather than dropping the slot', () => {
    expect(joinDroomSlot('2026-08-05', '14:00')).toBe('2026-08-05 14:00');
  });
});

describe('buildInspectionBooking', () => {
  const form = {
    fullAddress: '221B Residency Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    slot1Date: '2026-08-05',
    slot1Time: '02:00 PM',
    slot2Date: '2026-08-06',
    slot2Time: '10:00 AM',
  };

  it('shapes the form into the booking card fields', () => {
    expect(buildInspectionBooking(form)).toEqual({
      slot1: '2026-08-05 14:00:00',
      slot2: '2026-08-06 10:00:00',
      address: '221B Residency Road, Bengaluru, Karnataka — 560001',
    });
  });

  // The card renders rows on presence, so an empty slot2 would show a blank "Slot 2".
  it('omits slot2 entirely when only one slot was picked', () => {
    const booking = buildInspectionBooking({ ...form, slot2Date: '', slot2Time: '' });

    expect(booking).not.toHaveProperty('slot2');
    expect(booking.slot1).toBe('2026-08-05 14:00:00');
  });

  it('leaves no dangling separators when parts of the address are missing', () => {
    expect(buildInspectionBooking({ ...form, state: '', pincode: '' }).address).toBe(
      '221B Residency Road, Bengaluru'
    );
  });
});

describe('initialReportStatus', () => {
  // The PDF is generated asynchronously by Droom after we order it, so a valuation
  // genuinely is building at this point — READY here would strand the order, since the
  // materialisation path only fires on BUILDING rows.
  it('parks a valuation at BUILDING while the vendor generates the PDF', () => {
    expect(initialReportStatus('valuation')).toBe('BUILDING');
  });

  // Load-bearing, not incidental: a history order really is unbuilt at this point. The
  // RC lookup runs on first read (controllers/corporate/carReportHistory.js), and that
  // handler only fires on BUILDING rows — returning READY here would strand the order
  // with no result, forever.
  it('parks a history order at BUILDING for the read-time lookup to pick up', () => {
    expect(initialReportStatus('history')).toBe('BUILDING');
  });

  it('parks an inspection at its own first stage', () => {
    expect(initialReportStatus('inspection')).toBe('BOOKED');
  });
});

describe('buildProgressSteps', () => {
  it('shows every step done for a ready valuation', () => {
    expect(buildProgressSteps('valuation', 'READY')).toEqual([
      { label: 'Order Placed', state: 'done' },
      { label: 'Building Report', state: 'done' },
      { label: 'Report Ready', state: 'done' },
    ]);
  });

  it('shows the build in progress while a report is still building', () => {
    expect(buildProgressSteps('history', 'BUILDING').map((s) => s.state)).toEqual([
      'done',
      'active',
      'pending',
    ]);
  });

  it('gives an inspection its own five stages', () => {
    const steps = buildProgressSteps('inspection', 'BOOKED');
    expect(steps).toHaveLength(5);
    expect(steps[0]).toEqual({ label: 'Booked', state: 'done' });
    expect(steps[1]).toEqual({ label: 'Technician Assigned', state: 'active' });
  });

  // A dead order must not show a phantom step still spinning.
  it('leaves no step active on a cancelled or failed order', () => {
    ['CANCELLED', 'FAILED'].forEach((status) => {
      const steps = buildProgressSteps('valuation', status);
      expect(steps.map((s) => s.state)).toEqual(['done', 'pending', 'pending']);
    });
  });

  it('falls back to the first stage on an unrecognised status', () => {
    expect(buildProgressSteps('valuation', 'WAT').map((s) => s.state)).toEqual([
      'done',
      'active',
      'pending',
    ]);
  });
});
