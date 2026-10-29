import { MOA_FIELD_SPECS } from '../MoaAoa/constants';

// Data fields the OPC MOA & AOA component manages. The vendor registry wires the
// exact same specs as the MOA & AOA component (`fields: MOA_FIELD_SPECS`) for
// `opc_moa`, so they are re-exported under an OPC name here — the registry entry
// reads clearly and the specs can diverge later without touching MoaAoa.
export const OPC_FIELD_SPECS = MOA_FIELD_SPECS;
