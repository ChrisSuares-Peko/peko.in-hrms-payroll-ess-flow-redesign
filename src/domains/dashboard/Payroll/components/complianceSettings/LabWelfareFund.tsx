import React from 'react';

import AddLabWelfare from './AddLabWelfare';

// The form is always editable — LWF contribution amounts are per-employee now (see
// AddLabWelfare's info alert), so this org-level tab only ever holds the default work
// state + registration number, with nothing worth a separate read-only summary view.
const LabWelfareFund = ({ data }: any) => <AddLabWelfare data={data} />;

export default LabWelfareFund;
