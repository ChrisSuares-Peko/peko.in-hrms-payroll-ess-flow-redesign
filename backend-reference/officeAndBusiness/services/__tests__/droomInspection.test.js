const { postDroomForm } = require('../droomClient');

jest.mock('../droomClient', () => ({
  postDroomForm: jest.fn(),
}));

const { bookInspection } = require('../droomInspection');

describe('droomInspection.bookInspection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    postDroomForm.mockResolvedValue({ code: 'success' });
  });

  const booking = {
    proposalNumber: '1785737000175',
    make: 'Kia',
    model: 'Seltos',
    year: '2021',
    trim: 'HTX',
    customerName: 'Asha Menon',
    customerEmail: 'asha@peko.one',
    customerAddress: '221B Residency Road',
    customerCity: 'Bengaluru',
    customerState: 'Karnataka',
    customerPincode: '560001',
    customerPhone: '9876543210',
    slot1: '2026-08-05 14:00:00',
    slot2: '2026-08-06 10:00:00',
    registrationNumber: 'KA01AB1234',
    clientName: 'Peko',
    clientSpocName: 'Asha Menon',
    clientSpocMobile: '9876543210',
    clientSpocEmail: 'asha@peko.one',
    inspectionCityName: 'Bengaluru',
    vehicleType: 'SUV',
    productCode: 'self_inspection_tkm_insurance_ai',
  };

  // Endpoint is SINGULAR — the plural 404s on our account.
  it('posts to the eco-order endpoint with the vendor field names', async () => {
    await bookInspection(booking, 'trace-1');

    expect(postDroomForm).toHaveBeenCalledWith(
      '/dss/enterprise-eco-order',
      expect.objectContaining({
        proposal_number: '1785737000175',
        make: 'Kia',
        model: 'Seltos',
        year: '2021',
        trim: 'HTX',
        customer_name: 'Asha Menon',
        customer_email: 'asha@peko.one',
        customer_address: '221B Residency Road',
        customer_city: 'Bengaluru',
        customer_state: 'Karnataka',
        customer_pincode: '560001',
        customer_phone: '9876543210',
        slot1: '2026-08-05 14:00:00',
        slot2: '2026-08-06 10:00:00',
        registration_number: 'KA01AB1234',
        client_name: 'Peko',
        client_spoc_name: 'Asha Menon',
        client_spoc_mobile: '9876543210',
        client_spoc_email: 'asha@peko.one',
        inspection_cityname: 'Bengaluru',
        vehicle_type: 'SUV',
        product_code: 'self_inspection_tkm_insurance_ai',
      }),
      'trace-1'
    );
  });

  // The reference annotates these as "likely populated by Droom on confirmation, not sent
  // by Peko at booking time (verify)".
  it('does not send the technician assignment fields', async () => {
    await bookInspection(booking);

    const [, fields] = postDroomForm.mock.calls[0];
    expect(fields).not.toHaveProperty('field_person');
    expect(fields).not.toHaveProperty('field_contact');
  });

  it('returns the vendor body untouched for the controller to interpret', async () => {
    const body = { code: 'success', data: { order_id: 'ECO-1' } };
    postDroomForm.mockResolvedValueOnce(body);

    await expect(bookInspection(booking)).resolves.toBe(body);
  });
});
