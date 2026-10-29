/* eslint-disable no-irregular-whitespace */
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2RejectBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
exports.kybSubmissionToVendor = (supplier, supplierName) => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
  
    return `
    <!DOCTYPE html>
    <html
      lang="en"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:v="urn:schemas-microsoft-com:vml">
      <head>
        <title></title>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <!--[if mso
          ]><xml
            ><o:OfficeDocumentSettings
              ><o:PixelsPerInch>96</o:PixelsPerInch
              ><o:AllowPNG /></o:OfficeDocumentSettings></xml
        ><![endif]-->
        <!--[if !mso]><!-->
        <!--<![endif]-->
        <style>
          * {
            box-sizing: border-box;
          }
    
          body {
            margin: 0;
            padding: 0;
          }
    
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
          }
    
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
          }
    
          p {
            line-height: inherit;
          }
    
          .desktop_hide,
          .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
          }
    
          .image_block img + div {
            display: none;
          }
    
          sup,
          sub {
            font-size: 75%;
            line-height: 0;
          }
    
          #converted-body .list_block ul,
          #converted-body .list_block ol,
          .body [class~="x_list_block"] ul,
          .body [class~="x_list_block"] ol,
          u + .body .list_block ul,
          u + .body .list_block ol {
            padding-left: 20px;
          }
    
          @media (max-width: 500px) {
            .mobile_hide {
              display: none;
            }
    
            .row-content {
              width: 100% !important;
            }
    
            .stack .column {
              width: 100%;
              display: block;
            }
    
            .mobile_hide {
              min-height: 0;
              max-height: 0;
              max-width: 0;
              overflow: hidden;
              font-size: 0px;
            }
    
            .desktop_hide,
            .desktop_hide table {
              display: table !important;
              max-height: none !important;
            }
    
            .row-2 .column-1 .block-1.heading_block h1 {
              font-size: 25px !important;
            }
    
            .row-3 .column-1 .block-1.paragraph_block td.pad > div {
              font-size: 14px !important;
            }
          }
        </style>
        <!--[if mso
          ]><style>
            sup,
            sub {
              font-size: 100% !important;
            }
            sup {
              mso-text-raise: 10%;
            }
            sub {
              mso-text-raise: -10%;
            }
          </style>
        <![endif]-->
      </head>
      <body
        class="body"
        style="
          margin: 0;
          background-color: #ffffff;
          padding: 0;
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
        ">
        <table
          border="0"
          cellpadding="0"
          cellspacing="0"
          class="nl-container"
          role="presentation"
          style="
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            background-color: #ffffff;
          "
          width="100%">
          <tbody>
            <tr>
              <td>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-1"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #ffffff;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-bottom: 5px;
                                  padding-top: 15px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="image_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td
                                      class="pad"
                                      style="
                                        width: 100%;
                                        padding-right: 0px;
                                        padding-left: 0px;
                                      ">
                                      <div
                                        align="center"
                                        class="alignment"
                                        style="line-height: 10px">
                                        <div style="max-width: 115.2px">
                                          <img
                                            alt=""
                                            height="auto"
                                            src="images/unnamed-6.png"
                                            style="
                                              display: block;
                                              height: auto;
                                              border: 0;
                                              width: 100%;
                                            "
                                            title=""
                                            width="115.2" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-3"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #ffffff;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-top: 15px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="paragraph_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    word-break: break-word;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <div
                                        style="
                                          color: #000000;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 14px;
                                          font-weight: 400;
                                          letter-spacing: 0px;
                                          line-height: 120%;
                                          text-align: left;
                                          mso-line-height-alt: 16.8px;
                                        ">
                                        <p style="margin: 0; margin-bottom: 16px">
                                          Dear MyFatoorah Team,
                                        </p>
                                        <p style="margin: 0; margin-bottom: 16px">
                                          We have uploaded the necessary documents
                                          for the supplier ${supplierName} (Code:
                                          ${
                                            supplier.supplierCode
                                          }) through the APIs. 
                                        </p>
                                        <p style="margin: 0; margin-bottom: 16px">
                                          Kindly review and approve the supplier for
                                          onboarding and activation. 
                                        </p>
                                        <p style="margin: 0">
                                          <strong>Supplier Details: </strong>
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="10"
                                  cellspacing="0"
                                  class="list_block block-2"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    word-break: break-word;
                                    color: #101112;
                                    direction: ltr;
                                    font-family: Arial, Helvetica, sans-serif;
                                    font-size: 16px;
                                    font-weight: 400;
                                    letter-spacing: 0px;
                                    line-height: 120%;
                                    text-align: left;
                                    mso-line-height-alt: 19.2px;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <div style="margin-left: -20px">
                                        <ul
                                          style="
                                            margin-top: 0;
                                            margin-bottom: 0;
                                            list-style-type: revert;
                                          ">
                                          <li style="margin: 0 0 0 0">
                                            Name: ${supplierName}
                                          </li>
                                          <li style="margin: 0 0 0 0">
                                            Code: ${supplier.supplierCode}
                                          </li>
                                          <li style="margin: 0 0 0 0">
                                            Submission Date: ${formattedDate}
                                          </li>
                                        </ul>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="10"
                                  cellspacing="0"
                                  class="paragraph_block block-3"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    word-break: break-word;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <div
                                        style="
                                          color: #101112;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 16px;
                                          font-weight: 400;
                                          letter-spacing: 0px;
                                          line-height: 120%;
                                          text-align: left;
                                          mso-line-height-alt: 19.2px;
                                        ">
                                        <p style="margin: 0">
                                          Best Regards, <br />Team Peko 
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-4"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #f7f7f7;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-bottom: 15px;
                                  padding-top: 25px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="image_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td
                                      class="pad"
                                      style="
                                        width: 100%;
                                        padding-right: 0px;
                                        padding-left: 0px;
                                      ">
                                      <div
                                        align="center"
                                        class="alignment"
                                        style="line-height: 10px">
                                        <div style="max-width: 144px">
                                          <img
                                            alt=""
                                            height="auto"
                                            src="images/Frame_2085661778.png"
                                            style="
                                              display: block;
                                              height: auto;
                                              border: 0;
                                              width: 100%;
                                            "
                                            title=""
                                            width="144" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-5"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #f7f7f7;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-bottom: 30px;
                                  padding-top: 5px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="heading_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td
                                      class="pad"
                                      style="text-align: center; width: 100%">
                                      <h1
                                        style="
                                          margin: 0;
                                          color: #000000;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 14px;
                                          font-weight: 400;
                                          letter-spacing: normal;
                                          line-height: 120%;
                                          text-align: center;
                                          margin-top: 0;
                                          margin-bottom: 0;
                                          mso-line-height-alt: 16.8px;
                                        ">
                                        <span
                                          class="tinyMce-placeholder"
                                          style="word-break: break-word"
                                          >© ${new Date().getUTCFullYear()} Peko Platforms Private Limited. All Rights Reserved</span
                                        >
                                      </h1>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="5"
                                  cellspacing="0"
                                  class="heading_block block-2"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <h1
                                        style="
                                          margin: 0;
                                          color: #000000;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 15px;
                                          font-weight: 400;
                                          letter-spacing: normal;
                                          line-height: 120%;
                                          text-align: center;
                                          margin-top: 0;
                                          margin-bottom: 0;
                                          mso-line-height-alt: 18px;
                                        ">
                                        <a
                                          href="https://peko.one/in"
                                          rel="noopener"
                                          style="
                                            text-decoration: underline;
                                            color: #000000;
                                          "
                                          target="_blank"
                                          >www.peko.one</a
                                        >
                                      </h1>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- End -->
      </body>
    </html>
        `;
  };
  
  exports.kybSubmissionComplete = (name, partnerDetails) => {
    return `
        <!DOCTYPE html>
    
    <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
    <head>
    <title></title>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
    <meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
    <style>
            * {
                box-sizing: border-box;
            }
    
            body {
                margin: 0;
                padding: 0;
            }
    
            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: inherit !important;
            }
    
            #MessageViewBody a {
                color: inherit;
                text-decoration: none;
            }
    
            p {
                line-height: inherit
            }
    
            .desktop_hide,
            .desktop_hide table {
                mso-hide: all;
                display: none;
                max-height: 0px;
                overflow: hidden;
            }
    
            .image_block img+div {
                display: none;
            }
    
            sup,
            sub {
                font-size: 75%;
                line-height: 0;
            }
    
            @media (max-width:500px) {
                .mobile_hide {
                    display: none;
                }
    
                .row-content {
                    width: 100% !important;
                }
    
                .stack .column {
                    width: 100%;
                    display: block;
                }
    
                .mobile_hide {
                    min-height: 0;
                    max-height: 0;
                    max-width: 0;
                    overflow: hidden;
                    font-size: 0px;
                }
    
                .desktop_hide,
                .desktop_hide table {
                    display: table !important;
                    max-height: none !important;
                }
    
                .row-2 .column-1 .block-1.heading_block h1 {
                    font-size: 25px !important;
                }
    
                .row-3 .column-1 .block-1.paragraph_block td.pad>div {
                    font-size: 14px !important;
                }
            }
        </style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
    </head>
    <body class="body" style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 10px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
    <div align="center" class="alignment" style="line-height:10px">
    <div style="max-width: 120px;"><img alt="" height="auto" src="images/unnamed-6.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="120"/></div>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 480px; margin: 0 auto;" width="480">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #ffffff; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad" style="text-align:center;width:100%;">
    <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 23px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 27.599999999999998px;">Your KYB submission for payment links activation has been received</h1>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 20px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
    <tr>
    <td class="pad">
    <div style="color:#0c0c0d;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
    <p style="margin: 0; margin-bottom: 16px;">Dear ${name},</p>
    <p style="margin: 0; margin-bottom: 16px;">Thank you for submitting your KYB documents for activating payment links on the ${partnerDetails?.branding} platform.</p>
    <p style="margin: 0; margin-bottom: 16px;">We have successfully received your documents, and our team is currently reviewing them. You will receive a notification once the review process is complete. Once your KYB is approved, you’ll be able to start using payment links to simplify and secure your payment collections.</p>
    <p style="margin: 0; margin-bottom: 16px;">If you have any queries or need further assistance, please call us at  022 489 30373 or write to us at <a href="mailto:reach@peko.one" style="text-decoration: underline; color: #000000;">reach@peko.one</a>.</p>
    <p style="margin: 0;">Best Regards<br/>Team ${partnerDetails?.branding}</p>
    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tbody>
    <tr>
    <td>
    <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
    <tbody>
    <tr>
    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
    <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
    <tr>
    <td class="pad">
    <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;"><a href="https://peko.one/in" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">www.peko.one</a></h1>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table><!-- End -->
    </body>
    </html>`;
  };
  
// ---- v2 layout helpers (collector KYB emails) ----
const V2_FONT = "font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;";
const v2Row = (inner, padBottom = 20) => `<tr><td align="left" style="font-size:0px;padding-bottom:${padBottom}px;word-break:break-word;">${inner}</td></tr>`;
const v2Text = (html, padBottom = 20) => v2Row(`<div style="${V2_FONT}font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>`, padBottom);
const v2Heading = (text) => v2Row(`<div class="peko-heading" style="${V2_FONT}font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>`, 24);
const v2SubHeading = (text) => v2Row(`<div style="${V2_FONT}font-size:18px;font-weight:700;line-height:1.4;text-align:left;color:#000000;">${text}</div>`, 12);
const v2Button = (label, href) => v2Row(`<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"><tr><td align="center" bgcolor="#000000" role="presentation" style="border:none;border-radius:10px;mso-padding-alt:16px 32px;background:#000000;" valign="middle"><a href="${href}" target="_blank" style="display:inline-block;background:#000000;color:#ffffff;${V2_FONT}font-size:16px;font-weight:600;line-height:100%;margin:0;text-decoration:none;padding:16px 32px;mso-padding-alt:0px;border-radius:10px;">${label}</a></td></tr></table>`, 28);
const v2Shell = ({ title, bodyHtml, partnerDetails }) => {
  const { branding, website, logo, socials } = normalisePartner(partnerDetails);
  const header = v2Header({ website, websiteLabel: websiteLabel(website), logo, branding });
  const footer = v2Footer({ socials: socialIconCells(socials, { size: 24, padding: '0 16px' }), branding });
  return `<!doctype html>
  <html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <title>${title}</title>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style type="text/css">
        #outlook a { padding:0; }
        body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
        table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
        img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
        p { display:block;margin:13px 0; }
        @media only screen and (max-width:479px) {
          .peko-heading { font-size: 26px !important; }
          .peko-card { padding: 24px 16px !important; }
        }
      </style>
    </head>
    <body style="word-spacing:normal;background-color:#F9FAFB;">
      <div aria-label="${title}" aria-roledescription="email" style="background-color:#F9FAFB;" role="article" lang="en" dir="ltr">

${header}
      <div style="background:#F9FAFB;background-color:#F9FAFB;margin:0px auto;max-width:680px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#F9FAFB;background-color:#F9FAFB;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 20px;text-align:center;">
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse:separate;">
                    <tbody>
                      <tr>
                        <td class="peko-card" style="background-color:#ffffff;border-radius:16px;vertical-align:top;border-collapse:separate;padding:48px;">
                          <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tbody>
${bodyHtml}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

${footer}

      </div>
    </body>
  </html>`;
};

const SUPPORT_LINE = 'If you have any queries or need further assistance, please write to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.';

// key: COLLECTOR_KYB_APPROVED (service: INVOICING)
exports.kybSubmissionApproved = (name, frontendUrl, partnerDetails) => {
  const { branding, website } = normalisePartner(partnerDetails);
  const bodyHtml = [
    v2Row(v2SuccessBadge(), 24),
    v2Heading('Your KYB verification is complete – Payment links activated'),
    v2Text(`Dear ${name},`),
    v2Text(`We are pleased to inform you that your KYB verification is now complete! You can now start using payment links on the ${branding} platform.`, 28),
    v2Button('Login', frontendUrl || website),
    v2Text(SUPPORT_LINE),
    v2Text(`Best Regards,<br>Team ${branding}`, 0),
  ].join('\n');
  return v2Shell({ title: 'Your KYB verification is complete', bodyHtml, partnerDetails });
};

exports.resolveCollectorKybApprovedEmail = (name, frontendUrl, partnerDetails, { fallbackSubject = 'Your KYB verification is complete – Payment links activated', partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name: name || '-',
    loginUrl: frontendUrl || partner.website,
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.COLLECTOR_KYB_APPROVED,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject,
    fallback: () => exports.kybSubmissionApproved(name, frontendUrl, partnerDetails),
    partnerId,
    logTraceId,
  });
};

// Reject reason is optional; pre-rendered so the admin template gets one non-empty blob.
const buildRejectReasonHtml = (reason) => (reason
  ? `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:#F9FAFB;border-radius:10px;"><tr><td style="padding:16px 20px;${V2_FONT}font-size:15px;line-height:1.6;color:#000000;">${reason}</td></tr></table>`
  : '<!-- no reject reason provided -->');

// key: COLLECTOR_KYB_REJECTED (service: INVOICING)
exports.kybSubmissionRejected = (name, reason, partnerDetails) => {
  const { branding } = normalisePartner(partnerDetails);
  const bodyHtml = [
    v2Row(v2RejectBadge(), 24),
    v2Heading('Your KYB submission for payment links activation – action required'),
    v2Text(`Dear ${name},`),
    v2Text(`Thank you for submitting your KYB documents for activating payment links on the ${branding} platform. After reviewing your submission, we found that some information does not meet our compliance requirements, which prevents us from proceeding with your KYB approval at this time.`, 24),
    v2SubHeading('What’s Next?'),
    v2Text(`To proceed with the activation of your payment links, please review the points below and resubmit the required documents through the ${branding} platform.`, reason ? 16 : 12),
    v2Row(buildRejectReasonHtml(reason), reason ? 16 : 0),
    v2Text('Ensure that all uploaded documents are clear and complete.', 24),
    v2Text(SUPPORT_LINE),
    v2Text(`Best Regards,<br>Team ${branding}`, 0),
  ].join('\n');
  return v2Shell({ title: 'Your KYB submission – action required', bodyHtml, partnerDetails });
};

exports.resolveCollectorKybRejectedEmail = (name, reason, partnerDetails, { fallbackSubject = 'Your KYB submission for payment links activation – action required', partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name: name || '-',
    rejectReasonHtml: buildRejectReasonHtml(reason),
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.COLLECTOR_KYB_REJECTED,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject,
    fallback: () => exports.kybSubmissionRejected(name, reason, partnerDetails),
    partnerId,
    logTraceId,
  });
};
  
  exports.requestForSettlementAmountToVendor = ({
    amount,
    paymentDate,
    supplierName,
    supplierCode,
    paymentId,
    referenceId,
  }) => {
    return `
    <!DOCTYPE html>
    
    <html
      lang="en"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:v="urn:schemas-microsoft-com:vml">
      <head>
        <title></title>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <!--[if mso
          ]><xml
            ><o:OfficeDocumentSettings
              ><o:PixelsPerInch>96</o:PixelsPerInch
              ><o:AllowPNG /></o:OfficeDocumentSettings></xml
        ><![endif]-->
        <!--[if !mso]><!-->
        <!--<![endif]-->
        <style>
          * {
            box-sizing: border-box;
          }
    
          body {
            margin: 0;
            padding: 0;
          }
    
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
          }
    
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
          }
    
          p {
            line-height: inherit;
          }
    
          .desktop_hide,
          .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
          }
    
          .image_block img + div {
            display: none;
          }
    
          sup,
          sub {
            font-size: 75%;
            line-height: 0;
          }
    
          #converted-body .list_block ul,
          #converted-body .list_block ol,
          .body [class~="x_list_block"] ul,
          .body [class~="x_list_block"] ol,
          u + .body .list_block ul,
          u + .body .list_block ol {
            padding-left: 20px;
          }
    
          @media (max-width: 500px) {
            .mobile_hide {
              display: none;
            }
    
            .row-content {
              width: 100% !important;
            }
    
            .stack .column {
              width: 100%;
              display: block;
            }
    
            .mobile_hide {
              min-height: 0;
              max-height: 0;
              max-width: 0;
              overflow: hidden;
              font-size: 0px;
            }
    
            .desktop_hide,
            .desktop_hide table {
              display: table !important;
              max-height: none !important;
            }
    
            .row-2 .column-1 .block-1.paragraph_block td.pad > div {
              font-size: 14px !important;
            }
          }
        </style>
        <!--[if mso
          ]><style>
            sup,
            sub {
              font-size: 100% !important;
            }
            sup {
              mso-text-raise: 10%;
            }
            sub {
              mso-text-raise: -10%;
            }
          </style>
        <![endif]-->
      </head>
      <body
        class="body"
        style="
          margin: 0;
          background-color: #ffffff;
          padding: 0;
          -webkit-text-size-adjust: none;
          text-size-adjust: none;
        ">
        <table
          border="0"
          cellpadding="0"
          cellspacing="0"
          class="nl-container"
          role="presentation"
          style="
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            background-color: #ffffff;
          "
          width="100%">
          <tbody>
            <tr>
              <td>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-1"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #ffffff;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-bottom: 5px;
                                  padding-top: 15px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="image_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td
                                      class="pad"
                                      style="
                                        width: 100%;
                                        padding-right: 0px;
                                        padding-left: 0px;
                                      ">
                                      <div
                                        align="center"
                                        class="alignment"
                                        style="line-height: 10px">
                                        <div style="max-width: 115.2px">
                                          <img
                                            alt=""
                                            height="auto"
                                            src="images/unnamed-6.png"
                                            style="
                                              display: block;
                                              height: auto;
                                              border: 0;
                                              width: 100%;
                                            "
                                            title=""
                                            width="115.2" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-2"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #ffffff;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-top: 15px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="paragraph_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    word-break: break-word;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <div
                                        style="
                                          color: #000000;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 14px;
                                          font-weight: 400;
                                          letter-spacing: 0px;
                                          line-height: 120%;
                                          text-align: left;
                                          mso-line-height-alt: 16.8px;
                                        ">
                                        <p style="margin: 0; margin-bottom: 16px">
                                          Dear MyFatoorah Team,
                                        </p>
                                        <p style="margin: 0; margin-bottom: 16px">
                                          A payment of
                                          <strong>AED ${amount}</strong> on ${paymentDate} has been made via the payment link. 
                                        </p>
                                        <p style="margin: 0">
                                          Supplier and transaction details: 
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="10"
                                  cellspacing="0"
                                  class="list_block block-2"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    word-break: break-word;
                                    color: #101112;
                                    direction: ltr;
                                    font-family: Arial, Helvetica, sans-serif;
                                    font-size: 16px;
                                    font-weight: 400;
                                    letter-spacing: 0px;
                                    line-height: 120%;
                                    text-align: left;
                                    mso-line-height-alt: 19.2px;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <div style="margin-left: -20px">
                                        <ul
                                          style="
                                            margin-top: 0;
                                            margin-bottom: 0;
                                            list-style-type: revert;
                                          ">
                                          <li
                                            aria-setsize="-1"
                                            style="margin: 0 0 0 0">
                                            Name:  ${supplierName}
                                          </li>
                                          <li
                                            aria-setsize="-1"
                                            style="margin: 0 0 0 0">
                                            Code:  ${supplierCode}
                                          </li>
                                          <li
                                            aria-setsize="-1"
                                            style="margin: 0 0 0 0">
                                            Submission Date:  ${paymentDate}
                                          </li>
                                          <li
                                            aria-setsize="-1"
                                            style="margin: 0 0 0 0">
                                            Payment ID:  ${paymentId}
                                          </li>
                                          <li
                                            aria-setsize="-1"
                                            style="margin: 0 0 0 0">
                                            Reference ID: ${referenceId}
                                          </li>
                                        </ul>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="10"
                                  cellspacing="0"
                                  class="paragraph_block block-3"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    word-break: break-word;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <div
                                        style="
                                          color: #101112;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 14px;
                                          font-weight: 400;
                                          letter-spacing: 0px;
                                          line-height: 120%;
                                          text-align: left;
                                          mso-line-height-alt: 16.8px;
                                        ">
                                        <p style="margin: 0; margin-bottom: 16px">
                                          As the payment amount is below AED 250, we
                                          request you to initiate the settlement and
                                          provide the payment status via the
                                          webhook. 
                                        </p>
                                        <p style="margin: 0">
                                          Best Regards, <br />Team Peko 
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-3"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #f7f7f7;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-bottom: 15px;
                                  padding-top: 25px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="image_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td
                                      class="pad"
                                      style="
                                        width: 100%;
                                        padding-right: 0px;
                                        padding-left: 0px;
                                      ">
                                      <div
                                        align="center"
                                        class="alignment"
                                        style="line-height: 10px">
                                        <div style="max-width: 144px">
                                          <img
                                            alt=""
                                            height="auto"
                                            src="images/Frame_2085661778.png"
                                            style="
                                              display: block;
                                              height: auto;
                                              border: 0;
                                              width: 100%;
                                            "
                                            title=""
                                            width="144" />
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  class="row row-4"
                  role="presentation"
                  style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
                  width="100%">
                  <tbody>
                    <tr>
                      <td>
                        <table
                          align="center"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="row-content stack"
                          role="presentation"
                          style="
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                            background-color: #f7f7f7;
                            border-radius: 0;
                            color: #000000;
                            width: 480px;
                            margin: 0 auto;
                          "
                          width="480">
                          <tbody>
                            <tr>
                              <td
                                class="column column-1"
                                style="
                                  mso-table-lspace: 0pt;
                                  mso-table-rspace: 0pt;
                                  font-weight: 400;
                                  text-align: left;
                                  padding-bottom: 30px;
                                  padding-top: 5px;
                                  vertical-align: top;
                                  border-top: 0px;
                                  border-right: 0px;
                                  border-bottom: 0px;
                                  border-left: 0px;
                                "
                                width="100%">
                                <table
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  class="heading_block block-1"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td
                                      class="pad"
                                      style="text-align: center; width: 100%">
                                      <h1
                                        style="
                                          margin: 0;
                                          color: #000000;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 14px;
                                          font-weight: 400;
                                          letter-spacing: normal;
                                          line-height: 120%;
                                          text-align: center;
                                          margin-top: 0;
                                          margin-bottom: 0;
                                          mso-line-height-alt: 16.8px;
                                        ">
                                        <span
                                          class="tinyMce-placeholder"
                                          style="word-break: break-word"
                                          >© ${new Date().getUTCFullYear()} Peko Platforms Private Limited. All Rights Reserved</span
                                        >
                                      </h1>
                                    </td>
                                  </tr>
                                </table>
                                <table
                                  border="0"
                                  cellpadding="5"
                                  cellspacing="0"
                                  class="heading_block block-2"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                  "
                                  width="100%">
                                  <tr>
                                    <td class="pad">
                                      <h1
                                        style="
                                          margin: 0;
                                          color: #000000;
                                          direction: ltr;
                                          font-family: Arial, Helvetica, sans-serif;
                                          font-size: 15px;
                                          font-weight: 400;
                                          letter-spacing: normal;
                                          line-height: 120%;
                                          text-align: center;
                                          margin-top: 0;
                                          margin-bottom: 0;
                                          mso-line-height-alt: 18px;
                                        ">
                                        <a
                                          href="https://peko.one/in"
                                          rel="noopener"
                                          style="
                                            text-decoration: underline;
                                            color: #000000;
                                          "
                                          target="_blank"
                                          >www.peko.one</a
                                        >
                                      </h1>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- End -->
      </body>
    </html>
    `;
  };
  
  exports.fundTransferEmailTemplate = (
    username,
    amount,
    date,
    referenceNo,
    templateDetails
  ) => {
    return `
      <!DOCTYPE html>
    
      <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
      <head>
      <title></title>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
      <meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
      <style>
          * {
            box-sizing: border-box;
          }
    
          body {
            margin: 0;
            padding: 0;
          }
    
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
          }
    
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
          }
    
          p {
            line-height: inherit
          }
    
          .desktop_hide,
          .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
          }
    
          .image_block img+div {
            display: none;
          }
    
          sup,
          sub {
            font-size: 75%;
            line-height: 0;
          }
    
          #converted-body .list_block ul,
          #converted-body .list_block ol,
          .body [class~="x_list_block"] ul,
          .body [class~="x_list_block"] ol,
          u+.body .list_block ul,
          u+.body .list_block ol {
            padding-left: 20px;
          }
    
          @media (max-width:500px) {
            .mobile_hide {
              display: none;
            }
    
            .row-content {
              width: 100% !important;
            }
    
            .stack .column {
              width: 100%;
              display: block;
            }
    
            .mobile_hide {
              min-height: 0;
              max-height: 0;
              max-width: 0;
              overflow: hidden;
              font-size: 0px;
            }
    
            .desktop_hide,
            .desktop_hide table {
              display: table !important;
              max-height: none !important;
            }
    
            .row-2 .column-1 .block-1.paragraph_block td.pad>div,
            .row-2 .column-1 .block-2.paragraph_block td.pad>div {
              font-size: 14px !important;
            }
          }
        </style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
      </head>
      <body class="body" style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
      <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
      <div align="center" class="alignment" style="line-height:10px">
      <div style="max-width: 115.2px;"><img alt="" height="auto" src="images/unnamed-6.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="115.2"/></div>
      </div>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
      <tr>
      <td class="pad">
      <div style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
      <p style="margin: 0; margin-bottom: 16px;">Dear ${username},</p>
      <p style="margin: 0; margin-bottom: 16px;">We are pleased to inform you that the settlement for your recent payment of AED ${amount} has been successfully completed. </p>
      <p style="margin: 0;"> </p>
      </div>
      </td>
      </tr>
      </table>
      <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
      <tr>
      <td class="pad">
      <div style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
      <p style="margin: 0;"><strong>Settlement Details: </strong></p>
      </div>
      </td>
      </tr>
      </table>
      <table border="0" cellpadding="10" cellspacing="0" class="list_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word; color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left; mso-line-height-alt: 16.8px;" width="100%">
      <tr>
      <td class="pad">
      <div style="margin-left:-20px">
      <ul style="margin-top: 0; margin-bottom: 0; list-style-type: revert;">
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Settlement Amount: AED ${amount} </li>
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Settlement Date: ${date} </li>
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Deposit Number: ${referenceNo} </li>
      </ul>
      </div>
      </td>
      </tr>
      </table>
      <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
      <tr>
      <td class="pad">
      <div style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
      <p style="margin: 0; margin-bottom: 16px;">If you have any queries or need further assistance, please call us at 022 489 30373 or write to us at <a href="mailto:reach@peko.one" rel="noreferrer noopener" style="text-decoration: underline; color: #7747FF;" target="_blank">reach@peko.one</a>. </p>
      <p style="margin: 0;">Best Regards, <br/>Team ${
        templateDetails.branding
      }</p>
      </div>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 25px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
      <div align="center" class="alignment" style="line-height:10px">
      <div style="max-width: 144px;"><img alt="" height="auto" src="${
        templateDetails.logo
      }" style="display: block; height: auto; border: 0; width: 100%;" title="" width="144"/></div>
      </div>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad" style="text-align:center;width:100%;">
      <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;"><span class="tinyMce-placeholder" style="word-break: break-word;">© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</span></h1>
      </td>
      </tr>
      </table>
      <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad">
      <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;"><a href="https://peko.one/in" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">www.peko.one</a></h1>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table><!-- End -->
      </body>
      </html>`;
  };
  
  exports.paymentCompletedEmailTemplate = (
    username,
    amount,
    date,
    paymentId,
    referenceId,
    customerName,
    customerMobile,
    customerEmail,
    templateDetails
  ) => {
    return `
        <!DOCTYPE html>
    
      <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
      <head>
      <title></title>
      <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
      <meta content="width=device-width, initial-scale=1.0" name="viewport"/><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><!--<![endif]-->
      <style>
          * {
            box-sizing: border-box;
          }
    
          body {
            margin: 0;
            padding: 0;
          }
    
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
          }
    
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
          }
    
          p {
            line-height: inherit
          }
    
          .desktop_hide,
          .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
          }
    
          .image_block img+div {
            display: none;
          }
    
          sup,
          sub {
            font-size: 75%;
            line-height: 0;
          }
    
          #converted-body .list_block ul,
          #converted-body .list_block ol,
          .body [class~="x_list_block"] ul,
          .body [class~="x_list_block"] ol,
          u+.body .list_block ul,
          u+.body .list_block ol {
            padding-left: 20px;
          }
    
          @media (max-width:500px) {
            .mobile_hide {
              display: none;
            }
    
            .row-content {
              width: 100% !important;
            }
    
            .stack .column {
              width: 100%;
              display: block;
            }
    
            .mobile_hide {
              min-height: 0;
              max-height: 0;
              max-width: 0;
              overflow: hidden;
              font-size: 0px;
            }
    
            .desktop_hide,
            .desktop_hide table {
              display: table !important;
              max-height: none !important;
            }
    
            .row-2 .column-1 .block-1.paragraph_block td.pad>div,
            .row-2 .column-1 .block-2.paragraph_block td.pad>div {
              font-size: 14px !important;
            }
          }
        </style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
      </head>
      <body class="body" style="margin: 0; background-color: #ffffff; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
      <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
      <div align="center" class="alignment" style="line-height:10px">
      <div style="max-width: 115.2px;"><img alt="" height="auto" src="images/unnamed-6.png" style="display: block; height: auto; border: 0; width: 100%;" title="" width="115.2"/></div>
      </div>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 15px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
      <tr>
      <td class="pad">
      <div style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
      <p style="margin: 0; margin-bottom: 16px;">Dear ${username},</p>
      <p style="margin: 0; margin-bottom: 16px;">We are pleased to inform you that a payment of AED ${amount} has been successfully made by your customer on ${date}.</p>
      <p style="margin: 0;"> </p>
      </div>
      </td>
      </tr>
      </table>
    
      <!-- Payment Details starts -->
      <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
      <tr>
      <td class="pad">
      <div style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
      <p style="margin: 0;"><strong>Payment Details:</strong></p>
      </div>
      </td>
      </tr>
      </table>
      <table border="0" cellpadding="10" cellspacing="0" class="list_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word; color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left; mso-line-height-alt: 16.8px;" width="100%">
      <tr>
      <td class="pad">
      <div style="margin-left:-20px">
      <ul style="margin-top: 0; margin-bottom: 0; list-style-type: revert;">
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Payment ID: ${paymentId}  </li>
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Reference ID: ${referenceId}  </li>
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Payment Date: ${date}  </li>
      </ul>
      </div>
      </td>
      </tr>
      </table>
      <!-- Payment Details ends -->
    
      <!-- Customer Details starts -->
      <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
      <tr>
      <td class="pad">
      <div style="color:#000000;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
      <p style="margin: 0;"><strong>Customer Details:</strong></p>
      </div>
      </td>
      </tr>
      </table>
      <table border="0" cellpadding="10" cellspacing="0" class="list_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word; color: #101112; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: 0px; line-height: 120%; text-align: left; mso-line-height-alt: 16.8px;" width="100%">
      <tr>
      <td class="pad">
      <div style="margin-left:-20px">
      <ul style="margin-top: 0; margin-bottom: 0; list-style-type: revert;">
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Customer Name: ${customerName}</li>
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Customer Mobile Number: +${customerMobile}</li>
      <li aria-setsize="-1" style="Margin: 0 0 0 0;">Customer Email ID: ${customerEmail}</li>
      </ul>
      </div>
      </td>
      </tr>
      </table>
      <!-- Customer Details ends -->
    
    
      <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
      <tr>
      <td class="pad">
      <div style="color:#101112;direction:ltr;font-family:Arial, Helvetica, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
      <p style="margin: 0; margin-bottom: 16px;">If you have any queries or need further assistance, please call us at 022 489 30373 or write to us at <a href="mailto:reach@peko.one" rel="noreferrer noopener" style="text-decoration: underline; color: #7747FF;" target="_blank">reach@peko.one</a>. </p>
      <p style="margin: 0;">Best Regards, <br/>Team ${
        templateDetails.branding
      }</p>
      </div>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 15px; padding-top: 25px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
      <div align="center" class="alignment" style="line-height:10px">
      <div style="max-width: 144px;"><img alt="" height="auto" src="${
        templateDetails.logo
      }" style="display: block; height: auto; border: 0; width: 100%;" title="" width="144"/></div>
      </div>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tbody>
      <tr>
      <td>
      <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f7f7; border-radius: 0; color: #000000; width: 480px; margin: 0 auto;" width="480">
      <tbody>
      <tr>
      <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 30px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
      <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad" style="text-align:center;width:100%;">
      <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 16.8px;"><span class="tinyMce-placeholder" style="word-break: break-word;">© ${new Date().getUTCFullYear()} Peko Platforms Private Limited, All Rights Reserved</span></h1>
      </td>
      </tr>
      </table>
      <table border="0" cellpadding="5" cellspacing="0" class="heading_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
      <tr>
      <td class="pad">
      <h1 style="margin: 0; color: #000000; direction: ltr; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 18px;"><a href="https://peko.one/in" rel="noopener" style="text-decoration: underline; color: #000000;" target="_blank">www.peko.one</a></h1>
      </td>
      </tr>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table>
      </td>
      </tr>
      </tbody>
      </table><!-- End -->
      </body>
      </html>
      `;
  };
  