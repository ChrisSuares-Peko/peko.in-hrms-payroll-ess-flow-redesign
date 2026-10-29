import { Outlet } from 'react-router-dom';

/** Layout wrapper so home, results, cart, and checkout share one Office Supplies tree. */
const OfficeSuppliesLayout = () => <Outlet />;

export default OfficeSuppliesLayout;
