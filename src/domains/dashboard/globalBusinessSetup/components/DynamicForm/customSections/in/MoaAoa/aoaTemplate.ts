import { BLANK, escapeHtml, pick } from '../../htmlDoc';

type Data = Record<string, unknown>;

/**
 * Standard Table F (Schedule I, Companies Act 2013) Articles of Association (draft).
 * Mostly static legal text; only the company name, capital figures and the place
 * (state) are injected from the form data.
 */
export const buildAoaHtml = (data: Data): string => {
    const name = escapeHtml(pick(data, ['company_name'], 'The Company'));
    const state = escapeHtml(
        pick(data, ['state', 'registered_office_state', 'registered_state', 'emirate'], BLANK)
    );
    const capital = escapeHtml(
        pick(data, ['authorised_capital', 'authorized_capital', 'capital'], BLANK)
    );
    const shareCount = escapeHtml(
        pick(data, ['number_of_shares', 'total_shares', 'shares'], BLANK)
    );
    const faceValue = escapeHtml(pick(data, ['share_value', 'face_value', 'nominal_value'], BLANK));

    return `
        <h1>Articles of Association</h1>
        <p class="center">OF<br/><strong>${name}</strong></p>
        <p class="center muted">(THE COMPANIES ACT, 2013) &middot; (COMPANY LIMITED BY SHARES)<br/>
        (STANDARD TABLE F — SCHEDULE I, COMPANIES ACT 2013)</p>

        <div class="draft"><strong>⚠ DRAFT — FOR LEGAL REVIEW ONLY</strong><br/>This document is
        auto-generated for internal review. It must be reviewed and approved by a practising Company
        Secretary or Chartered Accountant before submission to the MCA.</div>

        <h2>Part I — Preliminary</h2>
        <p><strong>1. Interpretation.</strong> In these Articles, unless the context otherwise
        requires:</p>
        <p>(i) "Act" means the Companies Act, 2013 and any statutory modification or re-enactment
        thereof for the time being in force.<br/>
        (ii) "Articles" means these Articles of Association as originally framed or as altered from
        time to time.<br/>
        (iii) "Board" or "Board of Directors" means the Board of Directors of the Company for the
        time being.<br/>
        (iv) "Company" means ${name}.<br/>
        (v) "Director" means a director appointed pursuant to the provisions of the Act.<br/>
        (vi) "Member" means the duly registered holder of the shares of the Company and includes the
        subscribers to the Memorandum of Association.<br/>
        (vii) "Month" means a calendar month.<br/>
        (viii) "Office" means the Registered Office of the Company.<br/>
        (ix) "Paid-up" includes credited as paid-up.<br/>
        (x) "Register" means the Register of Members kept pursuant to the Act.<br/>
        (xi) "Seal" means the Common Seal of the Company.<br/>
        (xii) "Share" means a share in the share capital of the Company.<br/>
        (xiii) Words importing the singular number include the plural and vice versa.<br/>
        (xiv) Words importing persons include corporations.<br/>
        (xv) Words importing the masculine gender include the feminine.</p>

        <h2>Part II — Share Capital and Variation of Rights</h2>
        <p><strong>2.</strong> The Authorised Share Capital of the Company is Rs. ${capital}/- divided
        into ${shareCount} Equity Shares of Rs. ${faceValue}/- each, with power to increase, reduce,
        or subdivide as permitted by the Act.</p>
        <p><strong>3.</strong> Subject to the provisions of the Act and these Articles, the shares
        shall be under the control of the Directors, who may issue, allot, or otherwise dispose of
        the same to such persons, in such proportion and on such terms and conditions and either at
        a premium or at par and at such time as they think fit.</p>
        <p><strong>4.</strong> Where the capital is divided into different classes of shares, the
        rights attached to any class may be varied with the consent in writing of the holders of
        three-fourths of the issued shares of that class, or with the sanction of a special
        resolution passed at a separate meeting of the holders of the shares of that class.</p>

        <h2>Part III — Share Certificates</h2>
        <p><strong>5.</strong> (i) Every person whose name is entered as a member in the Register
        shall be entitled to receive within two months after allotment or one month after
        application for registration of transfer, one share certificate for all his shares without
        payment or several certificates upon payment of Twenty Rupees for each certificate after the
        first.<br/>
        (ii) Every certificate shall be under the Seal and shall specify the shares to which it
        relates and the amount paid-up thereon.<br/>
        (iii) In respect of any shares held jointly by several persons, the Company shall not be
        bound to issue more than one certificate; delivery to one of the joint holders shall be
        sufficient delivery to all.</p>

        <h2>Part IV — Lien</h2>
        <p><strong>6.</strong> The Company shall have a first and paramount lien on every share (not
        being a fully paid share) for all moneys called or payable at a fixed time in respect of that
        share, including dividends payable and bonuses declared.</p>
        <p><strong>7.</strong> The Company may sell, in such manner as the Board thinks fit, any
        shares on which the Company has a lien, provided that a sum is presently payable and
        fourteen days' notice in writing demanding payment has been given to the registered
        holder.</p>
        <p><strong>8.</strong> The net proceeds of any such sale shall be applied towards
        satisfaction of the debt or liability in respect of which the lien exists; the residue, if
        any, shall be paid to the person entitled to the shares at the date of the sale.</p>

        <h2>Part V — Calls on Shares</h2>
        <p><strong>9.</strong> (i) The Board may, from time to time, make calls upon the members in
        respect of any moneys unpaid on their shares.<br/>
        (ii) Each member shall, subject to receiving at least fourteen days' notice specifying the
        time(s) and place of payment, pay to the Company the amount called on his shares.</p>
        <p><strong>10.</strong> A call shall be deemed to have been made at the time when the
        resolution of the Board authorising the call was passed and may be required to be paid by
        instalments.</p>
        <p><strong>11.</strong> The joint holders of a share shall be jointly and severally liable to
        pay all calls in respect thereof.</p>
        <p><strong>12.</strong> If a sum called is not paid on the day appointed, the person from whom
        the sum is due shall pay interest thereon from the day appointed for payment to the time of
        actual payment at ten percent per annum or such lower rate as the Board may determine.</p>

        <h2>Part VI — Transfer and Transmission of Shares</h2>
        <p class="muted">Note: This is a Private Limited Company. Accordingly, the right to transfer
        shares is restricted as stated below.</p>
        <p><strong>13.</strong> (i) The right to transfer shares is restricted as follows:
        (a) a member wishing to transfer shall give written notice to the Board stating the number of
        shares, proposed transferee, and consideration; (b) the Board shall within thirty days find a
        purchaser at fair value determined by the Auditors; (c) if no purchaser is found within
        thirty days, the member may transfer to the proposed transferee; (d) no shares shall be
        transferred to a person not approved by the Board.<br/>
        (ii) The instrument of transfer shall be executed by or on behalf of both the transferor and
        the transferee, and the transferor shall be deemed to remain a holder until the transferee
        is entered in the Register.</p>
        <p><strong>14.</strong> The Board may, subject to the right of appeal conferred by the Act,
        decline to register the transfer of a share (not being fully paid) to a person of whom they
        do not approve, or any transfer of shares on which the Company has a lien.</p>
        <p><strong>15.</strong> On the death of a member, the survivor(s) where the member was a joint
        holder, and the nominee(s) or legal representatives where the member was a sole holder, shall
        be the only persons recognised as having title to the shares.</p>

        <h2>Part VII — Forfeiture of Shares</h2>
        <p><strong>16.</strong> If a member fails to pay any call or instalment on the appointed day,
        the Board may serve a notice requiring payment of the unpaid amount together with any accrued
        interest.</p>
        <p><strong>17.</strong> The notice shall name a further day (not earlier than fourteen days
        from service) for payment and state that, on non-payment, the shares shall be liable to be
        forfeited.</p>
        <p><strong>18.</strong> If the notice is not complied with, the shares may be forfeited by a
        resolution of the Board.</p>
        <p><strong>19.</strong> A person whose shares have been forfeited shall cease to be a member
        in respect of those shares but shall remain liable for all moneys presently payable at the
        date of forfeiture.</p>

        <h2>Part VIII — Alteration of Capital</h2>
        <p><strong>20.</strong> The Company may, by ordinary resolution: (a) increase its share
        capital; (b) consolidate and divide its share capital into shares of larger amount;
        (c) sub-divide its shares into shares of smaller amount; or (d) cancel shares not taken or
        agreed to be taken by any person.</p>

        <h2>Part IX — Capitalisation of Profits</h2>
        <p><strong>21.</strong> The Company in general meeting may, upon the recommendation of the
        Board, resolve to capitalise any part of the amounts standing to the credit of its reserves
        or profit and loss account, to be applied in paying up in full unissued shares to be
        allotted and distributed, credited as fully paid-up, amongst the members.</p>

        <h2>Part X — General Meetings</h2>
        <p><strong>22.</strong> The Company shall hold an Annual General Meeting (AGM) each year; not
        more than fifteen months shall elapse between one AGM and the next.</p>
        <p><strong>23.</strong> All general meetings other than the AGM shall be called Extraordinary
        General Meetings (EGM).</p>
        <p><strong>24.</strong> (i) The Board may, whenever it thinks fit, call an EGM.<br/>
        (ii) If there are not within India sufficient directors to form a quorum, any director or any
        two members may call an EGM.</p>
        <p><strong>25.</strong> (i) At least twenty-one clear days' notice specifying the place, day
        and hour and, for special business, its general nature, shall be given.<br/>
        (ii) A meeting may be called after shorter notice with the consent of not less than
        ninety-five percent of the members entitled to vote.</p>
        <p><strong>26. Quorum.</strong> (i) Two members personally present shall be the quorum.
        (ii) If a quorum is not present within half an hour, the meeting shall stand adjourned to the
        same day in the next week at the same time and place, or as the Board may determine.</p>
        <p><strong>27.</strong> The Chairperson of the Board shall preside at every general meeting;
        failing which, the members present shall elect one of their number to be chairperson.</p>

        <h2>Part XI — Votes of Members</h2>
        <p><strong>28.</strong> Subject to any rights or restrictions: (a) on a show of hands, every
        member present in person shall have one vote; and (b) on a poll, voting rights shall be in
        proportion to his share in the paid-up equity capital.</p>
        <p><strong>29.</strong> A member may exercise his vote by electronic means in accordance with
        the Act and shall vote only once.</p>
        <p><strong>30.</strong> In the case of joint holders, the vote of the senior who tenders a
        vote shall be accepted to the exclusion of the others; seniority is determined by the order
        of names in the Register.</p>
        <p><strong>31.</strong> On a poll, a member entitled to more than one vote need not use all
        his votes or cast them all in the same way.</p>
        <p><strong>32.</strong> The demand for a poll may be withdrawn at any time by the person(s)
        who made it.</p>

        <h2>Part XII — Board of Directors</h2>
        <p><strong>33.</strong> Unless otherwise determined in general meeting, the number of
        Directors shall not be less than two nor more than fifteen.</p>
        <p><strong>34.</strong> The remuneration of the directors, in so far as it consists of a
        monthly payment, shall be deemed to accrue from day-to-day.</p>
        <p><strong>35.</strong> The directors may be paid all travelling, hotel and other expenses
        properly incurred in attending meetings of the Board, committees, or general meetings, or in
        connection with the business of the Company.</p>
        <p><strong>36.</strong> The Board may at any time appoint any person as an additional
        director, provided the total number does not exceed the maximum strength fixed for the
        Board.</p>
        <p><strong>37. Powers of Board.</strong> Subject to the Act, the control of the Company shall
        be vested in the Board, who may exercise all powers and do all acts the Company is authorised
        to do, except those required to be done by the Company in general meeting.</p>

        <h2>Part XIII — Proceedings of the Board</h2>
        <p><strong>38.</strong> The Board may meet for the conduct of business, adjourn and regulate
        its meetings as it thinks fit; a director may, and the Company Secretary on the requisition
        of a director shall, summon a meeting of the Board.</p>
        <p><strong>39.</strong> (i) Questions arising at any Board meeting shall be decided by a
        majority of votes.<br/>
        (ii) In case of an equality of votes, the Chairperson shall have a second or casting
        vote.</p>
        <p><strong>40.</strong> The quorum for a Board meeting shall be one-third of its total
        strength or two directors, whichever is higher; participation by video conferencing or other
        audio-visual means shall count towards quorum.</p>
        <p><strong>41.</strong> The Board may elect a Chairperson of its meetings; failing which, the
        directors present may choose one of their number to be Chairperson.</p>

        <h2>Part XIV — CEO, Manager, Company Secretary and CFO</h2>
        <p><strong>42.</strong> Subject to the Act: (a) a chief executive officer, manager, company
        secretary or chief financial officer may be appointed by the Board on such terms as it thinks
        fit and may be removed by a resolution of the Board; (b) a director may be appointed to any
        such office.</p>

        <h2>Part XV — The Seal</h2>
        <p><strong>43.</strong> The Board shall provide for the safe custody of the Seal, which shall
        not be affixed to any instrument except by authority of a resolution of the Board (or an
        authorised committee) and in the presence of at least two directors and the secretary or
        such other person as the Board may appoint.</p>

        <h2>Part XVI — Dividends and Reserves</h2>
        <p><strong>44.</strong> The Company in general meeting may declare dividends, but no dividend
        shall exceed the amount recommended by the Board.</p>
        <p><strong>45.</strong> The Board may from time to time pay such interim dividends as appear
        justified by the profits of the Company.</p>
        <p><strong>46.</strong> The Board may, before recommending any dividend, set aside such sums
        as it thinks fit as reserves.</p>
        <p><strong>47.</strong> No dividend shall be paid otherwise than out of profits arrived at
        after providing for depreciation in accordance with the Act.</p>
        <p><strong>48.</strong> The Board may deduct from any dividend payable to a member all sums
        presently payable by him to the Company in relation to the shares.</p>

        <h2>Part XVII — Accounts and Audit</h2>
        <p><strong>49.</strong> The Board shall determine when and where, and under what conditions,
        the accounts and books shall be open to the inspection of members not being directors.</p>
        <p><strong>50.</strong> No member (not being a director) shall have any right of inspecting
        any account or document except as conferred by law or authorised by the Board or the Company
        in general meeting.</p>
        <p><strong>51.</strong> The Company shall in each year appoint an auditor to hold office from
        the conclusion of one AGM until the conclusion of the next, in accordance with the Act.</p>
        <p><strong>52.</strong> The auditors shall have right of access at all times to the books,
        accounts and vouchers, and shall be entitled to require such information and explanation as
        may be necessary.</p>
        <p><strong>53.</strong> The auditors' report shall be read before the Company in general
        meeting and shall be open to inspection by any member.</p>

        <h2>Part XVIII — Notices and Communication</h2>
        <p><strong>54.</strong> A notice may be given by the Company to any member personally, by
        post to his registered address, or by electronic mode as approved under the Act.</p>
        <p><strong>55.</strong> Where sent by post, service shall be deemed effected by properly
        addressing, prepaying and posting, and to have been effected forty-eight hours after
        posting.</p>
        <p><strong>56.</strong> A notice to joint holders may be given to the joint holder first named
        in the Register.</p>

        <h2>Part XIX — Winding Up</h2>
        <p><strong>57.</strong> Subject to the Act: (i) on a winding up, the liquidator may, with the
        sanction of a special resolution, divide amongst the members in specie or kind the whole or
        any part of the assets; (ii) the liquidator may set such value as he deems fair and determine
        how the division shall be carried out between members or classes of members.</p>

        <h2>Part XX — Indemnity</h2>
        <p><strong>58.</strong> Every officer of the Company shall be indemnified out of the assets of
        the Company against any liability incurred in defending any proceedings, civil or criminal,
        in which judgment is given in his favour or in which he is acquitted or granted relief by the
        court or the Tribunal.</p>

        <p class="mt">Place : ${state}<br/>Date : _____________________</p>
        <p class="muted">Signed by the subscribers to the Memorandum of Association in the presence
        of:</p>
        <p>Witness Name : _____________________<br/>Witness Address : _____________________<br/>
        Witness Signature : _____________________</p>
    `;
};
