import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const Payment = () => (
    <>
        <p>payment page -- Common component</p>
        <br />
        <Link to={`/${paths.logistics.index}/${paths.logistics.paymentStatus}`}>
            next page click here
        </Link>
    </>
);

export default Payment;
