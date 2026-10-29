const {
  ISSUE_STATUS,
  ISSUE_LEVEL,
  TERMINAL_ISSUE_STATUSES,
  isTerminalIssueStatus,
  isEscalatedLevel,
  toWireIssueLevel,
  mapWireActionToStatus,
  mapStatusToWireAction,
  mapStatusToWireStatus,
} = require('../ondcIgmStatus');

describe('mapWireActionToStatus', () => {
  // The bug this module exists to kill: the previous substring matcher tested
  // code.includes("RESOLV"), and "RESOLUTION_PROPOSED" contains it — so a merely
  // PROPOSED resolution was recorded as RESOLVED, which is terminal, which
  // blocked the buyer from accepting or rejecting the offer they'd just been made.
  it('keeps a proposed resolution distinct from a resolved one', () => {
    expect(mapWireActionToStatus('RESOLUTION_PROPOSED')).toBe(ISSUE_STATUS.RESOLUTION_PROPOSED);
    expect(mapWireActionToStatus('RESOLUTION_PROPOSED')).not.toBe(ISSUE_STATUS.RESOLVED);
  });

  it('does not let any resolution-negotiation code become terminal', () => {
    for (const code of ['RESOLUTION_PROPOSED', 'RESOLUTION_ACCEPTED', 'RESOLUTION_REJECTED']) {
      expect(isTerminalIssueStatus(mapWireActionToStatus(code))).toBe(false);
    }
  });

  // RESOLUTION_REJECTED used to hit the RESOLV branch before the REJECT branch
  // and land on RESOLVED. Both readings were terminal; neither was right.
  it('maps a rejected resolution to its own non-terminal status', () => {
    expect(mapWireActionToStatus('RESOLUTION_REJECTED')).toBe(ISSUE_STATUS.RESOLUTION_REJECTED);
  });

  it('maps the genuinely terminal codes', () => {
    expect(mapWireActionToStatus('RESOLVED')).toBe(ISSUE_STATUS.RESOLVED);
    expect(mapWireActionToStatus('CLOSED')).toBe(ISSUE_STATUS.CLOSED);
    expect(isTerminalIssueStatus(ISSUE_STATUS.RESOLVED)).toBe(true);
    expect(isTerminalIssueStatus(ISSUE_STATUS.CLOSED)).toBe(true);
  });

  it('maps the IGM 2.0 information-exchange codes', () => {
    expect(mapWireActionToStatus('INFO_REQUESTED')).toBe(ISSUE_STATUS.INFO_REQUESTED);
    expect(mapWireActionToStatus('INFO_PROVIDED')).toBe(ISSUE_STATUS.RESPONSE_RECEIVED);
    expect(mapWireActionToStatus('INFO_NOT_AVAILABLE')).toBe(ISSUE_STATUS.ACKNOWLEDGED);
  });

  it('maps ESCALATED, which no code path could previously produce', () => {
    expect(mapWireActionToStatus('ESCALATED')).toBe(ISSUE_STATUS.ESCALATED);
    expect(isTerminalIssueStatus(ISSUE_STATUS.ESCALATED)).toBe(false);
  });

  it('still understands the IGM 1.0 vocabulary', () => {
    expect(mapWireActionToStatus('NEED-MORE-INFO')).toBe(ISSUE_STATUS.INFO_REQUESTED);
    expect(mapWireActionToStatus('CLOSE')).toBe(ISSUE_STATUS.CLOSED);
    expect(mapWireActionToStatus('REJECT')).toBe(ISSUE_STATUS.REJECTED);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(mapWireActionToStatus('  resolution_proposed ')).toBe(ISSUE_STATUS.RESOLUTION_PROPOSED);
  });

  // An unfamiliar code must surface to the buyer as "being worked on" — never be
  // guessed into a terminal status, which is what the substring version did.
  it('falls back to ACKNOWLEDGED for anything unrecognised, never to a terminal', () => {
    for (const code of ['SOMETHING_NEW', '', null, undefined, 'RESOLUTION_TELEPORTED']) {
      const mapped = mapWireActionToStatus(code);
      expect(mapped).toBe(ISSUE_STATUS.ACKNOWLEDGED);
      expect(isTerminalIssueStatus(mapped)).toBe(false);
    }
  });
});

describe('mapStatusToWireAction', () => {
  // The outbound payload replays the whole history, and we used to echo internal
  // names like ACKNOWLEDGED and RESPONSE_RECEIVED, which are not IGM codes.
  const IGM_2_ACTION_CODES = [
    'OPEN', 'PROCESSING', 'CLOSED', 'CASCADED',
    'INFO_REQUESTED', 'INFO_PROCESSING', 'INFO_PROVIDED', 'INFO_NOT_AVAILABLE',
    'RESOLUTION_PROPOSED', 'RESOLUTION_FORWARDED', 'RESOLUTION_PROCESSING',
    'RESOLUTION_CASCADED', 'RESOLUTION_ACCEPTED', 'RESOLUTION_REJECTED',
    'RESOLVED', 'ESCALATED',
  ];

  it('emits only codes in the IGM 2.0 enum, for every internal status', () => {
    for (const status of Object.values(ISSUE_STATUS)) {
      expect(IGM_2_ACTION_CODES).toContain(mapStatusToWireAction(status));
    }
  });

  it('never leaks an internal-only name onto the wire', () => {
    expect(mapStatusToWireAction(ISSUE_STATUS.ACKNOWLEDGED)).toBe('PROCESSING');
    expect(mapStatusToWireAction(ISSUE_STATUS.RESPONSE_RECEIVED)).toBe('INFO_PROVIDED');
  });

  it('round-trips the codes that have an exact internal counterpart', () => {
    for (const code of ['OPEN', 'RESOLVED', 'CLOSED', 'ESCALATED', 'INFO_REQUESTED',
      'RESOLUTION_PROPOSED', 'RESOLUTION_ACCEPTED', 'RESOLUTION_REJECTED']) {
      expect(mapStatusToWireAction(mapWireActionToStatus(code))).toBe(code);
    }
  });
});

describe('mapStatusToWireStatus', () => {
  // The wire status is a much smaller set than the action code: a proposed
  // resolution is an *action*, but the issue itself is still just PROCESSING.
  it('reports a negotiation in progress as PROCESSING', () => {
    expect(mapStatusToWireStatus(ISSUE_STATUS.RESOLUTION_PROPOSED)).toBe('PROCESSING');
    expect(mapStatusToWireStatus(ISSUE_STATUS.RESOLUTION_ACCEPTED)).toBe('PROCESSING');
    expect(mapStatusToWireStatus(ISSUE_STATUS.ACKNOWLEDGED)).toBe('PROCESSING');
  });

  it('reports an escalation as OPEN — escalation reopens at the next level', () => {
    expect(mapStatusToWireStatus(ISSUE_STATUS.ESCALATED)).toBe('OPEN');
  });

  it('reports the terminal states', () => {
    expect(mapStatusToWireStatus(ISSUE_STATUS.RESOLVED)).toBe('RESOLVED');
    expect(mapStatusToWireStatus(ISSUE_STATUS.CLOSED)).toBe('CLOSED');
  });

  it('only ever emits a status the validator accepts', () => {
    const ALLOWED = ['OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED'];
    for (const status of Object.values(ISSUE_STATUS)) {
      expect(ALLOWED).toContain(mapStatusToWireStatus(status));
    }
  });
});

describe('level', () => {
  // The deployed Workbench validator enums level as ISSUE | GREVIENCE | DISPUTE
  // — misspelled — and rejects the spec-correct GRIEVANCE.
  it('sends the spelling the Workbench validator accepts', () => {
    expect(['ISSUE', 'GREVIENCE', 'DISPUTE']).toContain(ISSUE_LEVEL.GRIEVANCE);
  });

  it('coerces any session value onto the Workbench enum', () => {
    expect(toWireIssueLevel(undefined)).toBe('ISSUE');
    expect(toWireIssueLevel('')).toBe('ISSUE');
    expect(toWireIssueLevel('GRIEVANCE')).toBe('GREVIENCE');
    expect(toWireIssueLevel('grevience')).toBe('GREVIENCE');
    expect(toWireIssueLevel(['ISSUE'])).toBe('ISSUE');
    expect(toWireIssueLevel('DISPUTE')).toBe('DISPUTE');
    expect(toWireIssueLevel('ITEM')).toBe('ISSUE');
  });

  it('recognises an escalation whichever spelling the counterparty uses', () => {
    expect(isEscalatedLevel('GRIEVANCE')).toBe(true);
    expect(isEscalatedLevel('GREVIENCE')).toBe(true);
    expect(isEscalatedLevel('ISSUE')).toBe(false);
    expect(isEscalatedLevel(undefined)).toBe(false);
  });
});

describe('TERMINAL_ISSUE_STATUSES', () => {
  // Previously copy-pasted into three controllers and kept in sync by comment.
  it('is exactly the three states nothing moves out of', () => {
    expect([...TERMINAL_ISSUE_STATUSES].sort()).toEqual(['CLOSED', 'REJECTED', 'RESOLVED']);
  });
});
