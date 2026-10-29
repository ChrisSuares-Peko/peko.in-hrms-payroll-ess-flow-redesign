import { ApplicationPayload, EntityType } from '../types';

// Maps NIC section letter → closest main object template key
export const SECTION_TO_TEMPLATE: Record<string, string> = {
    B: 'manufacturing',
    C: 'manufacturing',
    D: 'services',
    F: 'services',
    G: 'trading',
    H: 'services',
    I: 'services',
    J: 'technology',
    K: 'services',
    L: 'services',
    M: 'consulting',
    N: 'services',
};

export const ANCILLARY_OBJECTS = [
    'To acquire, purchase, or otherwise obtain licenses, permits, and registrations necessary for the business',
    'To enter into contracts, agreements, and arrangements with any person or company for business purposes',
    'To borrow or raise money in such manner as the Company shall think fit for the purpose of the business',
    'To invest surplus funds of the Company in securities, properties, or other investments as the Board thinks fit',
    'To acquire, hold, and dispose of movable and immovable properties required for the business',
    'To import, export, buy, sell, and deal in goods, materials, and articles as required by the business',
    'To grant or acquire franchises, licenses, and distribution rights from or to any person or company',
    'To collaborate, partner, or form joint ventures with other entities for business purposes',
    'To acquire, protect, and exploit patents, trademarks, copyrights, and other intellectual property rights',
    'To undertake research and development activities related to the business of the Company',
    'To provide employee welfare, training, and development programs for the staff of the Company',
    'To undertake marketing, advertising, and promotional activities to further the business of the Company',
];

export const DEFAULT_CHECKED_ANCILLARY = [0, 1, 3, 5, 7, 11];

export const MAIN_OBJECT_PRESETS: Record<string, string> = {
    manufacturing:
        'To carry on the business of manufacturing, producing, processing, assembling, fabricating, buying, selling, importing, exporting and dealing in all kinds of goods, products, articles and merchandise of every description.',
    trading:
        'To carry on the business of trading, buying, selling, importing, exporting, distributing, and dealing in all kinds of goods, commodities, products, articles and merchandise of every description.',
    services:
        'To carry on the business of providing professional services, consulting services, management services, technical services, advisory services, and all related support services of every description.',
    technology:
        'To carry on the business of developing, designing, creating, maintaining, implementing, and licensing software, technology products, digital platforms, mobile and web applications, and to provide information technology services, cloud computing services, software-as-a-service (SaaS), and related technology solutions.',
    consulting:
        'To carry on the business of management consulting, business advisory, strategic planning, financial advisory, operational consulting, and providing expert advice and solutions to businesses and individuals across all sectors and industries.',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const ONES = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(n: number): string {
    if (n === 0) return 'Zero';
    if (n < 0) return `Minus ${numberToWords(-n)}`;

    let result = '';

    if (n >= 10000000) {
        result += `${numberToWords(Math.floor(n / 10000000))} Crore `;
        n %= 10000000;
    }
    if (n >= 100000) {
        result += `${numberToWords(Math.floor(n / 100000))} Lakh `;
        n %= 100000;
    }
    if (n >= 1000) {
        result += `${numberToWords(Math.floor(n / 1000))} Thousand `;
        n %= 1000;
    }
    if (n >= 100) {
        result += `${ONES[Math.floor(n / 100)]} Hundred `;
        n %= 100;
    }
    if (n >= 20) {
        result += `${TENS[Math.floor(n / 10)]} `;
        n %= 10;
    }
    if (n > 0) {
        result += `${ONES[n]} `;
    }

    return result.trim();
}

function entityLabel(entityType?: string): string {
    switch (entityType) {
        case EntityType.PUBLIC_LIMITED:
            return 'Limited';
        case EntityType.OPC:
            return 'Private Limited (One Person Company)';
        default:
            return 'Private Limited';
    }
}

const DIVIDER = '━'.repeat(54);
const DRAFT_NOTICE = `⚠  DRAFT — FOR LEGAL REVIEW ONLY
This document is auto-generated for internal review. It must be
reviewed and approved by a practising Company Secretary or
Chartered Accountant before submission to the MCA.`;

// ─── MOA Generator ──────────────────────────────────────────────────────────

export function generateMoaContent(values: ApplicationPayload): string {
    const companyName = values.proposedNames?.firstChoice?.trim() || '[Company Name]';
    const suffix = entityLabel(values.entityType);
    const state = values.applicantDetails?.state || '[State]';
    const authorizedCapital = values.capital?.authorizedCapital || 0;
    const faceValue = values.capital?.faceValuePerShare || 10;
    const numberOfShares = faceValue > 0 ? Math.floor(authorizedCapital / faceValue) : 0;
    const directors = values.directors || [];
    const { businessActivity } = values;

    const nicRef =
        businessActivity?.group || businessActivity?.section
            ? ` [NIC: ${[
                  businessActivity.section,
                  businessActivity.division,
                  businessActivity.group,
              ]
                  .filter(Boolean)
                  .join(' › ')}]`
            : '';

    // Same auto-detect logic as the component — ensures consistency between preview/download and backend upload
    const autoTemplate = SECTION_TO_TEMPLATE[businessActivity?.section ?? ''] ?? 'services';
    const activeTemplate = values.moaAoa?.mainObjectTemplate ?? autoTemplate;
    const mainObjectText =
        values.moaAoa?.mainObjectCustomText?.trim() ||
        MAIN_OBJECT_PRESETS[activeTemplate] ||
        (businessActivity?.group
            ? `To carry on the business activities classified under NIC Code: ${businessActivity.group}${nicRef}`
            : 'To carry on the business activities as described in the objects clause');

    const secondaryActivity = businessActivity?.secondaryActivity?.trim();

    const ancillaryIndices = values.moaAoa?.ancillaryObjects ?? DEFAULT_CHECKED_ANCILLARY;
    const ancillaryText = ANCILLARY_OBJECTS.filter((_, i) => ancillaryIndices.includes(i))
        .map((obj, i) => `    ${i + 1}. ${obj}`)
        .join('\n');

    const subscriberRows =
        directors.length > 0
            ? directors
                  .map(
                      (d, i) =>
                          `  ${i + 1}. Name          : ${d.name || '[Name]'}\n` +
                          `     Nationality   : ${d.nationality || 'Indian'}\n` +
                          `     Occupation    : ${d.occupation || '[Occupation]'}\n` +
                          `     DIN           : ${d.din || '[DIN / Applied for]'}\n` +
                          `     No. of Shares : 1 (One) Equity Share\n` +
                          `     Signature     : ___________________________`
                  )
                  .join('\n\n')
            : '  [Director / Subscriber details to be added]';

    return `MEMORANDUM OF ASSOCIATION
OF
${companyName.toUpperCase()} ${suffix.toUpperCase()}

(THE COMPANIES ACT, 2013)
(COMPANY LIMITED BY SHARES)

${DIVIDER}
${DRAFT_NOTICE}
${DIVIDER}

I.  NAME CLAUSE

    The name of the Company is "${companyName} ${suffix}."

${DIVIDER}

II. SITUATION CLAUSE

    The Registered Office of the Company will be situated
    in the State of ${state}.

${DIVIDER}

III. OBJECTS CLAUSE

    (a) The objects to be pursued by the Company on its
        incorporation are:

        1. ${mainObjectText}
${secondaryActivity ? `\n        2. ${secondaryActivity}\n` : ''}
    (b) Matters which are necessary for furtherance of the
        objects specified in clause (a) above are:

${ancillaryText}

${DIVIDER}

IV. LIABILITY CLAUSE

    The liability of the Members of the Company is limited
    and this liability is limited to the amount unpaid, if
    any, on the shares held by them.

${DIVIDER}

V.  CAPITAL CLAUSE

    The Authorised Share Capital of the Company is
    Rs. ${authorizedCapital.toLocaleString('en-IN')}/- (Rupees ${numberToWords(authorizedCapital)} Only)
    divided into ${numberOfShares.toLocaleString('en-IN')} Equity Shares of Rs. ${faceValue}/- each.

${DIVIDER}

DECLARATION / SUBSCRIBER CLAUSE

We, the several persons whose names, addresses, descriptions
and occupations are given below, are desirous of being formed
into a Company in pursuance of this Memorandum of Association,
and we respectively agree to take the number of shares in the
capital of the Company set against our respective names.

${subscriberRows}

${DIVIDER}

Place : ${state}
Date  : _____________________

(To be signed in the presence of at least one witness)

Witness Name        : _____________________
Witness Address     : _____________________
Witness Occupation  : _____________________
Witness Signature   : _____________________`;
}

// ─── AOA Generator ──────────────────────────────────────────────────────────

export function generateAoaContent(values: ApplicationPayload): string {
    const companyName = values.proposedNames?.firstChoice?.trim() || '[Company Name]';
    const suffix = entityLabel(values.entityType);
    const state = values.applicantDetails?.state || '[State]';
    const authorizedCapital = values.capital?.authorizedCapital || 0;
    const faceValue = values.capital?.faceValuePerShare || 10;
    const numberOfShares = faceValue > 0 ? Math.floor(authorizedCapital / faceValue) : 0;
    const isPrivate = values.entityType !== EntityType.PUBLIC_LIMITED;

    return `ARTICLES OF ASSOCIATION
OF
${companyName.toUpperCase()} ${suffix.toUpperCase()}

(THE COMPANIES ACT, 2013)
(COMPANY LIMITED BY SHARES)
(STANDARD TABLE F — SCHEDULE I, COMPANIES ACT 2013)

${DIVIDER}
${DRAFT_NOTICE}
${DIVIDER}

PART I — PRELIMINARY

1.  INTERPRETATION

    In these Articles, unless the context otherwise requires:

    (i)   "Act" means the Companies Act, 2013 and any statutory
          modification or re-enactment thereof for the time being
          in force.
    (ii)  "Articles" means these Articles of Association as
          originally framed or as altered from time to time.
    (iii) "Board" or "Board of Directors" means the Board of
          Directors of the Company for the time being.
    (iv)  "Company" means ${companyName} ${suffix}.
    (v)   "Director" means a director appointed pursuant to the
          provisions of the Act.
    (vi)  "Member" means the duly registered holder of the shares
          of the Company and includes the subscribers to the
          Memorandum of Association.
    (vii) "Month" means a calendar month.
    (viii)"Office" means the Registered Office of the Company.
    (ix)  "Paid-up" includes credited as paid-up.
    (x)   "Register" means the Register of Members kept pursuant
          to the Act.
    (xi)  "Seal" means the Common Seal of the Company.
    (xii) "Share" means a share in the share capital of the Company.
    (xiii) Words importing the singular number include the plural
           and vice versa.
    (xiv)  Words importing persons include corporations.
    (xv)   Words importing the masculine gender include the feminine.

${DIVIDER}

PART II — SHARE CAPITAL AND VARIATION OF RIGHTS

2.  The Authorised Share Capital of the Company is
    Rs. ${authorizedCapital.toLocaleString('en-IN')}/- (Rupees ${numberToWords(authorizedCapital)} Only)
    divided into ${numberOfShares.toLocaleString('en-IN')} Equity Shares of Rs. ${faceValue}/- each,
    with power to increase, reduce, or subdivide as permitted by the Act.

3.  Subject to the provisions of the Act and these Articles, the
    shares shall be under the control of the Directors, who may
    issue, allot, or otherwise dispose of the same to such persons,
    in such proportion and on such terms and conditions and either
    at a premium or at par and at such time as they think fit.

4.  Where the capital is divided into different classes of shares,
    the rights attached to any class may be varied with the consent
    in writing of the holders of three-fourths of the issued shares
    of that class, or with the sanction of a special resolution
    passed at a separate meeting of the holders of the shares of
    that class.

${DIVIDER}

PART III — SHARE CERTIFICATES

5.  (i)  Every person whose name is entered as a member in the
         Register shall be entitled to receive within two months
         after allotment or one month after application for
         registration of transfer, one share certificate for all
         his shares without payment or several certificates for
         one or more shares upon payment of Twenty Rupees for
         each certificate after the first.

    (ii) Every certificate shall be under the Seal and shall
         specify the shares to which it relates and the amount
         paid-up thereon.

    (iii) In respect of any shares held jointly by several persons,
          the Company shall not be bound to issue more than one
          certificate; delivery to one of the joint holders shall
          be sufficient delivery to all such holders.

${DIVIDER}

PART IV — LIEN

6.  The Company shall have a first and paramount lien on every
    share (not being a fully paid share) for all moneys called
    or payable at a fixed time in respect of that share, including
    dividends payable and bonuses declared in respect of such shares.

7.  The Company may sell, in such manner as the Board thinks fit,
    any shares on which the Company has a lien, provided that:
    (a) a sum in respect of which the lien exists is presently
        payable; and
    (b) fourteen days' notice in writing demanding payment has
        been given to the registered holder of the share.

8.  The net proceeds of any such sale shall be applied towards
    satisfaction of the debt or liability in respect of which the
    lien exists. The residue, if any, shall be paid to the person
    entitled to the shares at the date of the sale.

${DIVIDER}

PART V — CALLS ON SHARES

9.  (i)  The Board may, from time to time, make calls upon the
         members in respect of any moneys unpaid on their shares,
         whether on account of the nominal value of the shares or
         by way of premium, and not by the conditions of allotment
         made payable at fixed times.

    (ii) Each member shall, subject to receiving at least fourteen
         days' notice specifying the time(s) and place of payment,
         pay to the Company at the time(s) and place so specified
         the amount called on his shares.

10. A call shall be deemed to have been made at the time when the
    resolution of the Board authorising the call was passed and
    may be required to be paid by instalments.

11. The joint holders of a share shall be jointly and severally
    liable to pay all calls in respect thereof.

12. If a sum called in respect of a share is not paid before or on
    the day appointed for payment thereof, the person from whom the
    sum is due shall pay interest thereon from the day appointed for
    payment thereof to the time of actual payment at ten percent per
    annum or at such lower rate, if any, as the Board may determine.

${DIVIDER}

PART VI — TRANSFER AND TRANSMISSION OF SHARES${
        isPrivate
            ? `

NOTE: This is a Private Limited Company. Accordingly, the right
to transfer shares is restricted as stated below.`
            : ''
    }

13. (i)  ${
        isPrivate
            ? `The Company being a Private Limited Company, the right to
         transfer shares is restricted as follows:
         (a) A member wishing to transfer shares shall give written
             notice to the Board stating the number of shares,
             proposed transferee, and transfer consideration.
         (b) The Board shall, within thirty days of such notice,
             find a purchaser for the shares at fair value
             determined by the Auditors of the Company.
         (c) If the Board is unable to find a purchaser within
             thirty days, the member shall be free to transfer
             to the proposed transferee.
         (d) No shares shall be transferred to a person not
             approved by the Board.`
            : `Members may transfer shares subject to the provisions
         of the Act and these Articles.`
    }

    (ii) The instrument of transfer of any share in the Company
         shall be executed by or on behalf of both the transferor
         and the transferee. The transferor shall be deemed to
         remain a holder until the name of the transferee is
         entered in the Register.

14. The Board may, subject to the right of appeal conferred by
    the Act, decline to register:
    (a) the transfer of a share (not being a fully paid share)
        to a person of whom they do not approve; or
    (b) any transfer of shares on which the Company has a lien.

15. On the death of a member, the survivor or survivors where
    the member was a joint holder, and the nominee(s) or legal
    representatives where the member was a sole holder, shall be
    the only persons recognised as having title to the shares.

${DIVIDER}

PART VII — FORFEITURE OF SHARES

16. If a member fails to pay any call or instalment of a call on
    the day appointed for payment, the Board may serve a notice
    on him requiring payment of so much of the call as is unpaid,
    together with any interest which may have accrued.

17. The notice shall:
    (a) name a further day (not earlier than the expiry of
        fourteen days from the date of service) on or before
        which the payment is to be made; and
    (b) state that in the event of non-payment the shares in
        respect of which the call was made shall be liable to
        be forfeited.

18. If the requirements of any such notice are not complied with,
    any share in respect of which the notice has been given may,
    at any time thereafter, before the payment required by the
    notice has been made, be forfeited by a resolution of the Board.

19. A person whose shares have been forfeited shall cease to be a
    member in respect of the forfeited shares, but shall remain
    liable to pay to the Company all moneys which, at the date of
    forfeiture, were presently payable by him to the Company.

${DIVIDER}

PART VIII — ALTERATION OF CAPITAL

20. The Company may, by ordinary resolution:
    (a) increase its share capital by such amount as it thinks
        expedient;
    (b) consolidate and divide all or any of its share capital
        into shares of larger amount than its existing shares;
    (c) sub-divide its existing shares or any of them into shares
        of smaller amount than is fixed by the Memorandum; or
    (d) cancel any shares which, at the date of the passing of
        the resolution, have not been taken or agreed to be taken
        by any person.

${DIVIDER}

PART IX — CAPITALISATION OF PROFITS

21. The Company in general meeting may, upon the recommendation
    of the Board, resolve that it is desirable to capitalise any
    part of the amount for the time being standing to the credit
    of any of the Company's reserve accounts, or to the credit of
    the profit and loss account, or otherwise available for
    distribution. Such sum to be applied, subject to the Act, in
    paying up in full unissued shares of the Company to be
    allotted and distributed, credited as fully paid-up, to and
    amongst the members.

${DIVIDER}

PART X — GENERAL MEETINGS

22. The Company shall in each year hold a general meeting as its
    Annual General Meeting (AGM) in addition to any other meetings
    in that year. Not more than fifteen months shall elapse between
    the date of one AGM and that of the next.

23. All general meetings other than the AGM shall be called
    Extraordinary General Meetings (EGM).

24. (i)  The Board may, whenever it thinks fit, call an EGM.

    (ii) If there are not within India directors capable of acting
         who are sufficient in number to form a quorum, any director
         or any two members may call an EGM in the same manner as
         that in which such a meeting may be called by the Board.

25. (i)  At least twenty-one clear days' notice (exclusive of the
         day on which the notice is served or deemed to be served
         and of the day of the meeting) specifying the place, day
         and hour of the meeting and, in case of special business,
         the general nature of that business shall be given.

    (ii) Notwithstanding the above, a general meeting may be called
         after giving shorter notice if consent is given in writing
         or by electronic mode by not less than ninety-five percent
         of the members entitled to vote at such meeting.

26. QUORUM
    (i)  Two members personally present shall be the quorum for a
         meeting of the Company.
    (ii) If within half an hour from the time appointed, a quorum
         is not present, the meeting shall stand adjourned to the
         same day in the next week at the same time and place, or
         to such other day and at such other time and place as the
         Board may determine.

27. The Chairperson of the Board shall preside as chairperson at
    every general meeting of the Company. If there is no such
    chairperson, or if he is not present within fifteen minutes
    after the time appointed for holding the meeting, the members
    present shall elect one of their number to be the chairperson
    of the meeting.

${DIVIDER}

PART XI — VOTES OF MEMBERS

28. Subject to any rights or restrictions attached to any class
    of shares:
    (a) on a show of hands, every member present in person shall
        have one vote; and
    (b) on a poll, the voting rights of members shall be in
        proportion to his share in the paid-up equity share capital
        of the Company.

29. A member may exercise his vote at a meeting by electronic
    means in accordance with the Act and shall vote only once.

30. In the case of joint holders, the vote of the senior who
    tenders a vote, whether in person or by proxy, shall be
    accepted to the exclusion of the votes of the other joint
    holders. Seniority shall be determined by the order in which
    the names stand in the Register.

31. On a poll taken at a meeting, a member entitled to more than
    one vote need not, if he votes, use all his votes or cast all
    the votes he uses in the same way.

32. The demand for a poll may be withdrawn at any time by the
    person or persons who made the demand.

${DIVIDER}

PART XII — BOARD OF DIRECTORS

33. Unless otherwise determined by the Company in general meeting,
    the number of Directors shall not be less than two nor more
    than fifteen.

34. The remuneration of the directors shall, in so far as it
    consists of a monthly payment, be deemed to accrue from
    day-to-day.

35. In addition to the remuneration payable to them in pursuance
    of the Act, the directors may be paid all travelling, hotel
    and other expenses properly incurred by them:
    (a) in attending and returning from meetings of the Board or
        any committee thereof or general meetings of the Company;
        or
    (b) in connection with the business of the Company.

36. The Board shall have power at any time and from time to time
    to appoint any person as an additional director, provided
    the number of directors and additional directors together
    shall not at any time exceed the maximum strength fixed for
    the Board.

37. POWERS OF BOARD
    Subject to the provisions of the Act, the control of the
    Company shall be vested in the Board who shall be entitled
    to exercise all such powers and to do all such acts and things
    as the Company is authorised to exercise and do, provided that
    the Board shall not exercise any power or do any act or thing
    which is directed or required, whether by the Act or by the
    Memorandum or by these Articles or otherwise, to be exercised
    or done by the Company in general meeting.

${DIVIDER}

PART XIII — PROCEEDINGS OF THE BOARD

38. The Board may meet for the conduct of business, adjourn and
    otherwise regulate its meetings as it thinks fit. A director
    may, and the Company Secretary on the requisition of a
    director shall, at any time, summon a meeting of the Board.

39. (i)  Save as otherwise expressly provided in the Act, questions
         arising at any meeting of the Board shall be decided by a
         majority of votes.

    (ii) In case of an equality of votes, the Chairperson of the
         Board, if any, shall have a second or casting vote.

40. The quorum for a meeting of the Board shall be one-third of
    its total strength or two directors, whichever is higher.
    Participation of directors by video conferencing or other
    audio-visual means shall also be counted for the purposes
    of quorum.

41. The Board may elect a Chairperson of its meetings and
    determine the period for which he is to hold office. If no
    such Chairperson is elected, or if at any meeting the
    Chairperson is not present within five minutes after the time
    appointed, the directors present may choose one of their
    number to be Chairperson of the meeting.

${DIVIDER}

PART XIV — CEO, MANAGER, COMPANY SECRETARY, AND CFO

42. Subject to the provisions of the Act:
    (a) A chief executive officer, manager, company secretary or
        chief financial officer may be appointed by the Board for
        such term, at such remuneration and upon such conditions
        as it may think fit; and any such person so appointed may
        be removed by means of a resolution of the Board.
    (b) A director may be appointed as chief executive officer,
        manager, company secretary or chief financial officer.

${DIVIDER}

PART XV — THE SEAL

43. The Board shall provide for the safe custody of the Seal.
    The Seal of the Company shall not be affixed to any instrument
    except by the authority of a resolution of the Board or of a
    committee of the Board authorised by it in that behalf, and
    except in the presence of at least two directors and of the
    secretary or such other person as the Board may appoint for
    the purpose.

${DIVIDER}

PART XVI — DIVIDENDS AND RESERVES

44. The Company in general meeting may declare dividends, but no
    dividend shall exceed the amount recommended by the Board.

45. Subject to the provisions of the Act, the Board may from time
    to time pay to the members such interim dividends as appear to
    it to be justified by the profits of the Company.

46. The Board may, before recommending any dividend, set aside out
    of the profits of the Company such sums as it thinks fit as
    reserves which shall, at the discretion of the Board, be
    applicable for any purpose to which the profits of the Company
    may be properly applied.

47. No dividend shall be paid otherwise than out of profits of the
    financial year arrived at after providing for depreciation in
    accordance with the provisions of the Act or out of the profits
    of the Company for any previous financial year(s) arrived at
    after providing for depreciation in accordance with the
    provisions of the Act and remaining undistributed.

48. The Board may deduct from any dividend payable to any member
    all sums of money, if any, presently payable by him to the
    Company on account of calls or otherwise in relation to the
    shares of the Company.

${DIVIDER}

PART XVII — ACCOUNTS AND AUDIT

49. The Board shall from time to time determine whether and to
    what extent and at what times and places and under what
    conditions or regulations the accounts and books of the
    Company, or any of them, shall be open to the inspection of
    members not being directors.

50. No member (not being a director) shall have any right of
    inspecting any account or book or document of the Company
    except as conferred by law or authorised by the Board or by
    the Company in general meeting.

51. The Company shall in each year appoint an auditor or auditors
    to hold office from the conclusion of that Annual General
    Meeting until the conclusion of the next Annual General Meeting,
    in accordance with the provisions of the Act.

52. The auditors shall have right of access at all times to the
    books, accounts, and vouchers of the Company, whether kept at
    the registered office or elsewhere, and shall be entitled to
    require from the directors and officers such information and
    explanation as may be necessary for the performance of their duties.

53. The auditors' report shall be read before the Company in
    general meeting and shall be open to inspection by any member
    of the Company.

${DIVIDER}

PART XVIII — NOTICES AND COMMUNICATION

54. A notice may be given by the Company to any member either
    personally, by sending it by post to his registered address,
    or by transmitting it through electronic mode as approved
    under the Act and the Rules made thereunder.

55. Where a notice is sent by post, service shall be deemed to be
    effected by properly addressing, prepaying, and posting a letter
    containing the notice, and to have been effected at the expiration
    of forty-eight hours after the letter is posted.

56. A notice may be given to the joint holders of a share by
    giving the notice to the joint holder first named in the
    Register of Members in respect of the share.

${DIVIDER}

PART XIX — WINDING UP

57. Subject to the provisions of the Act and Rules made thereunder:
    (i)  If the Company shall be wound up, the liquidator may,
         with the sanction of a special resolution of the Company
         and any other sanction required by the Act, divide amongst
         the members, in specie or kind, the whole or any part of
         the assets of the Company.
    (ii) For the purpose aforesaid, the liquidator may set such
         value as he deems fair upon any property to be divided and
         may determine how such division shall be carried out as
         between the members or different classes of members.

${DIVIDER}

PART XX — INDEMNITY

58. Every officer of the Company shall be indemnified out of the
    assets of the Company against any liability incurred by him
    in defending any proceedings, whether civil or criminal, in
    which judgment is given in his favour or in which he is
    acquitted or in which relief is granted to him by the court
    or the Tribunal.

${DIVIDER}

Place : ${state}
Date  : _____________________

Signed by the subscribers to the Memorandum of Association
in the presence of:

Witness Name        : _____________________
Witness Address     : _____________________
Witness Signature   : _____________________`;
}

// ─── LLP Agreement Generator ────────────────────────────────────────────────

export function generateLlpAgreementContent(values: ApplicationPayload): string {
    const llp = values.llpAgreement;
    const companyName = values.proposedNames?.firstChoice?.trim() || '[LLP Name]';
    const state = values.applicantDetails?.state || '[State]';
    const partners = values.directors || [];
    const authorizedCapital = values.capital?.authorizedCapital || 0;
    const paidUpCapital = values.capital?.paidUpCapital || 0;
    const partnerCount = partners.length || 1;
    const perPartnerContribution = partnerCount > 0 ? Math.floor(paidUpCapital / partnerCount) : 0;
    const profitShare = partnerCount > 0 ? Math.floor(100 / partnerCount) : 0;
    const businessDesc = values.businessActivity?.description || '[Business Description]';
    const businessSubclass = values.businessActivity?.subclass || '';
    const businessDisplay = businessSubclass
        ? `${businessSubclass} – ${businessDesc}`
        : businessDesc;

    const partnerRows =
        partners.length > 0
            ? partners
                  .map(
                      (p, i) =>
                          `  ${i + 1}. Name              : ${p.name || '[Name]'}\n` +
                          `     Nationality        : ${p.nationality || 'Indian'}\n` +
                          `     DIN/DPIN           : ${p.din || '[Applied for]'}\n` +
                          `     Capital Contribution: Rs. ${perPartnerContribution.toLocaleString('en-IN')}/- (${numberToWords(perPartnerContribution)} Only)\n` +
                          `     Profit Share       : ${profitShare}%\n` +
                          `     Signature          : ___________________________`
                  )
                  .join('\n\n')
            : '  [Partner details to be added]';

    const rightLabels: Record<string, string> = {
        accessBooks: 'Right to inspect and access books of accounts of the LLP',
        receiveShares: 'Right to receive share of profits and remuneration as agreed',
        participateVotes: 'Right to participate in management and vote on decisions',
        indemnified: 'Right to be indemnified by the LLP for acts done in good faith',
        separateBusiness: 'Right to carry on separate business (subject to restrictions herein)',
    };
    const dutyLabels: Record<string, string> = {
        accountBenefits:
            'To account for and pay over any personal benefit derived from LLP business',
        indemnifyFraud: 'To indemnify the LLP for any loss caused by fraud or wilful negligence',
        renderAccounts: 'To render proper accounts and information regarding LLP affairs',
        actInBestInterest: 'To act in the best interest of the LLP at all times',
        noCompeting: 'Not to carry on any competing business without consent of other partners',
        maintainConfidentiality: 'To maintain confidentiality of LLP information and trade secrets',
    };

    const enabledRights = Object.entries(llp?.partnerRights || {})
        .filter(([, v]) => v)
        .map(([k], i) => `    ${i + 1}. ${rightLabels[k] || k}`)
        .join('\n');

    const enabledDuties = Object.entries(llp?.partnerDuties || {})
        .filter(([, v]) => v)
        .map(([k], i) => `    ${i + 1}. ${dutyLabels[k] || k}`)
        .join('\n');

    const quorum = llp?.meetingQuorum || '2';
    const voting = llp?.votingThreshold || 'Simple Majority (>50%)';
    const disputeMethod = llp?.disputeResolution?.method || 'Arbitration';
    const disputeJurisdiction = llp?.disputeResolution?.jurisdiction
        ? ` with jurisdiction in ${llp.disputeResolution.jurisdiction}`
        : '';

    return `LIMITED LIABILITY PARTNERSHIP AGREEMENT
OF
${companyName.toUpperCase()} LLP

(LIMITED LIABILITY PARTNERSHIP ACT, 2008)

${DIVIDER}
${DRAFT_NOTICE}
${DIVIDER}

THIS AGREEMENT is entered into on _____________________ by and between
the partners listed below (collectively "Partners"), to form a Limited
Liability Partnership under the Limited Liability Partnership Act, 2008.

${DIVIDER}

I.  NAME AND REGISTERED OFFICE

    Name of LLP    : ${companyName} LLP
    Registered Office: [Address], ${state}

${DIVIDER}

II. BUSINESS ACTIVITY

    The LLP is formed to carry on the following business:

    ${businessDisplay}

${DIVIDER}

III. PARTNERS AND CAPITAL CONTRIBUTION

    Total Authorised Capital : Rs. ${authorizedCapital.toLocaleString('en-IN')}/- (${numberToWords(authorizedCapital)} Only)
    Total Paid-Up Capital    : Rs. ${paidUpCapital.toLocaleString('en-IN')}/- (${numberToWords(paidUpCapital)} Only)

${partnerRows}

${DIVIDER}

IV. PROFIT AND LOSS SHARING

    Profits and losses of the LLP shall be shared equally among all
    partners (${profitShare}% each) unless unanimously agreed otherwise
    in writing.

${DIVIDER}

V.  RIGHTS OF PARTNERS

    Each Partner shall have the following rights:

${enabledRights || '    [Rights to be specified]'}

${DIVIDER}

VI. DUTIES OF PARTNERS

    Each Partner shall be bound by the following duties:

${enabledDuties || '    [Duties to be specified]'}

${DIVIDER}

VII. MEETINGS AND QUORUM

    Minimum quorum for a valid meeting of Partners: ${quorum} Partners.
    Meetings shall be convened by giving not less than 7 days' notice
    to all Partners unless waived in writing by all Partners.

${DIVIDER}

VIII. VOTING AND DECISIONS

    Voting threshold for ordinary resolutions: ${voting}
    Unanimous consent of all Partners is required for:
    (a) Admission of a new Partner
    (b) Amendment of this Agreement
    (c) Dissolution or winding up of the LLP

${DIVIDER}

IX. DISPUTE RESOLUTION

    Any dispute arising out of or in connection with this Agreement
    shall be resolved by ${disputeMethod}${disputeJurisdiction}.

${DIVIDER}

X.  DISSOLUTION

    The LLP may be dissolved by mutual written consent of all Partners
    or as provided under the Limited Liability Partnership Act, 2008.

${DIVIDER}

SIGNATURES OF DESIGNATED PARTNERS

${partners
    .map(
        (p, i) =>
            `${i + 1}. ${p.name || '[Name]'}\n   DPIN: ${p.din || '[Applied for]'}\n   Signature: ___________________________\n   Date: _____________________`
    )
    .join('\n\n')}

${DIVIDER}

Place : ${state}
Date  : _____________________

(To be signed in the presence of at least one witness)

Witness Name        : _____________________
Witness Address     : _____________________
Witness Signature   : _____________________`;
}

// ─── Word document helpers ───────────────────────────────────────────────────

// Build a Word-flavored HTML document (Microsoft Office XML namespaces +
// `application/msword` MIME) so that Word opens it as a .doc file. Used by
// `downloadAsWord` (browser download) and by the form's submit flow which
// uploads the auto-generated MOA / AOA / LLP Agreement as .doc to the vendor.
export function buildWordDocHtml(content: string, title: string): string {
    const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13.5px;
      line-height: 1.85;
      color: #111;
      background: #fff;
      padding: 72px 80px;
      max-width: 900px;
      margin: 0 auto;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: 'Times New Roman', Times, serif;
      font-size: 13.5px;
      line-height: 1.85;
    }
    @media print {
      body { padding: 20px 30px; }
    }
  </style>
</head>
<body>
  <pre>${escaped}</pre>
</body>
</html>`;
}

export function downloadAsWord(content: string, filename: string, title: string): void {
    const html = buildWordDocHtml(content, title);

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
