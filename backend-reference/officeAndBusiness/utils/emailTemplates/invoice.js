/* eslint-disable no-irregular-whitespace */
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../emailTemplateKeys');
const { v2Header, v2Footer, socialIconCells, websiteLabel, v2SuccessBadge, v2LayoutVariables } = require('./sharedLayout');
const { normalisePartner } = require('./common');
const { formatNumberWithLocalString } = require('../formatter');
//Generate Payment successful email for payment links
exports.generatePaymentLinkTemplate = ({ amount, link, corporateName = 'Team Peko', invoiceId, expiryDate }, templateDetails) => {
  return `
<!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"
  style="padding:0;Margin:0">

<head>
  <meta charset="UTF-8" />
  <meta content="width=device-width, initial-scale=1" name="viewport" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta content="telephone=no" name="format-detection" />
  <title>Copy of (2) DED Lisence</title>
  <!--[if (mso 16)
    ]><style type="text/css">
      a {
        text-decoration: none;
      }
    </style><!
  [endif]-->
  <!--[if gte mso 9
    ]><style>
      sup {
        font-size: 100% !important;
      }
    </style><!
  [endif]-->
  <!--[if gte mso 9
    ]><noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG></o:AllowPNG> <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
  <![endif]-->
  <!--[if !mso]><!-- -->
  <link
    href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i"
    rel="stylesheet" />
  <!--<![endif]-->
  <style type="text/css">
    #outlook a {
      padding: 0;
    }
    .ExternalClass {
      width: 100%;
    }
    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: 100%;
    }
    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
      transition: all 100ms ease-in;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    .es-button:hover {
      background: #555555 !important;
      border-color: #555555 !important;
    }
    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }
    @media only screen and (max-width: 600px) {
      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important;
      }
      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120% !important;
      }
      h1 {
        font-size: 30px !important;
        text-align: center;
      }
      h2 {
        font-size: 26px !important;
        text-align: left;
      }
      h3 {
        font-size: 20px !important;
        text-align: left;
      }
      h1 a {
        text-align: center;
      }
      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 30px !important;
      }
      h2 a {
        text-align: left;
      }
      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 20px !important;
      }
      h3 a {
        text-align: left;
      }
      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important;
      }
      .es-menu td a {
        font-size: 16px !important;
      }
      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 16px !important;
      }
      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 17px !important;
      }
      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 17px !important;
      }
      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important;
      }
      *[class="gmail-fix"] {
        display: none !important;
      }
      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important;
      }
      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important;
      }
      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important;
      }
      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important;
      }
      .es-button-border {
        display: inline-block !important;
      }
      a.es-button,
      button.es-button {
        font-size: 14px !important;
        display: inline-block !important;
      }
      .es-btn-fw {
        border-width: 10px 0px !important;
        text-align: center !important;
      }
      .es-adaptive table,
      .es-btn-fw,
      .es-btn-fw-brdr,
      .es-left,
      .es-right {
        width: 100% !important;
      }
      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important;
      }
      .es-adapt-td {
        display: block !important;
        width: 100% !important;
      }
      .adapt-img {
        width: 100% !important;
        height: auto !important;
      }
      .es-m-p0 {
        padding: 0px !important;
      }
      .es-m-p0r {
        padding-right: 0px !important;
      }
      .es-m-p0l {
        padding-left: 0px !important;
      }
      .es-m-p0t {
        padding-top: 0px !important;
      }
      .es-m-p0b {
        padding-bottom: 0 !important;
      }
      .es-m-p20b {
        padding-bottom: 20px !important;
      }
      .es-mobile-hidden,
      .es-hidden {
        display: none !important;
      }
      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important;
      }
      tr.es-desk-hidden {
        display: table-row !important;
      }
      table.es-desk-hidden {
        display: table !important;
      }
      td.es-desk-menu-hidden {
        display: table-cell !important;
      }
      .es-menu td {
        width: 1% !important;
      }
      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important;
      }
      table.es-social {
        display: inline-block !important;
      }
      table.es-social td {
        display: inline-block !important;
      }
      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important;
      }
      .h-auto {
        height: auto !important;
      }
    }
    @media screen and (max-width: 384px) {
      .mail-message-content {
        width: 414px !important;
      }
    }
  </style>
</head>
<body
  style="
    font-family: helvetica, 'helvetica neue', arial, verdana, sans-serif;
    width: 100%;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    padding: 0;
    margin: 0;
  ">
  <div
    dir="ltr"
    class="es-wrapper-color"
    lang="en"
    style="background-color: #f8fef5">
    <!--[if gte mso 9
      ]><v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
        <v:fill type="tile" color="#f8fef5"></v:fill> </v:background
    ><![endif]-->
    <table
      class="es-wrapper"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      role="none"
      style="
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        border-collapse: collapse;
        border-spacing: 0px;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
        background-repeat: repeat;
        background-position: center top;
        background-color: #f8fef5;
      ">
      <tr style="border-collapse: collapse">
        <td valign="top" style="padding: 0; margin: 0">
          <table
            cellpadding="0"
            cellspacing="0"
            class="es-footer"
            align="center"
            role="none"
            style="
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
              border-collapse: collapse;
              border-spacing: 0px;
              table-layout: fixed !important;
              width: 100%;
              background-color: transparent;
              background-repeat: repeat;
              background-position: center top;
            ">
            <tr style="border-collapse: collapse">
              <td
                align="center"
                bgcolor="#f8fef5"
                style="padding: 0; margin: 0; background-color: #f8fef5">
                <table
                  class="es-footer-body"
                  style="
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                    border-collapse: collapse;
                    border-spacing: 0px;
                    background-color: #ffffff;
                    width: 600px;
                  "
                  cellspacing="0"
                  cellpadding="0"
                  bgcolor="#ffffff"
                  align="center"
                  role="none">
                  <tr style="border-collapse: collapse">
                    <td
                      align="left"
                      style="
                        padding: 0;
                        margin: 0;
                        padding-top: 40px;
                        padding-left: 40px;
                        padding-right: 40px;
                      ">
                      <table
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        role="none"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-collapse: collapse;
                          border-spacing: 0px;
                        ">
                        <tr style="border-collapse: collapse">
                          <td
                            align="center"
                            valign="top"
                            style="padding: 0; margin: 0; width: 520px">
                            <table
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                border-collapse: collapse;
                                border-spacing: 0px;
                              ">
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="
                                    padding: 0;
                                    margin: 0;
                                    font-size: 0px;
                                  ">
                                  <img
                                    class="adapt-img"
                                    src="https://gxphmw.stripocdn.email/content/guids/CABINET_99f36d15a6b7cd44b38058ccb01f54a7548f6426c6937db3936400c75ef76373/images/screenshot_20241012_at_61332_pmremovebgpreview.png"
                                    alt
                                    style="
                                      display: block;
                                      border: 0;
                                      outline: none;
                                      text-decoration: none;
                                      -ms-interpolation-mode: bicubic;
                                    "
                                    width="146"
                                    height="121" />
                                </td>
                              </tr>
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="padding: 0; margin: 0">
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 36px;
                                      color: #0e0d0d;
                                      font-size: 24px;
                                    ">
                                    <strong>Complete your payment</strong>
                                  </p>
                                </td>
                              </tr>
                              <tr style="border-collapse: collapse">
                                <td
                                  align="left"
                                  style="padding: 20px; margin: 0">
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #131313;
                                      font-size: 16px;
                                    ">
                                    Dear Customer,&nbsp;
                                  </p>
                                    <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #131313;
                                      font-size: 16px;
                                    ">
                                    <br />
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #131313;
                                      font-size: 16px;
                                    ">
                                    A payment of ₹ ${amount} has been generated by ${corporateName}. 
                                    Your Reference ID is ${invoiceId}. Please note that this payment request will expire in ${expiryDate} hours.
                                    To complete your payment, click the button below: 
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse: collapse">
                    <td
                      align="left"
                      style="
                        margin: 0;
                        padding-top: 15px;
                        padding-bottom: 20px;
                        padding-left: 40px;
                        padding-right: 40px;
                      ">
                      <table
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        role="none"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-collapse: collapse;
                          border-spacing: 0px;
                        ">
                        <tr style="border-collapse: collapse">
                          <td
                            align="center"
                            valign="top"
                            style="padding: 0; margin: 0; width: 520px">
                            <table
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                border-collapse: collapse;
                                border-spacing: 0px;
                              ">
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="padding: 0; margin: 0">
                                  <!--[if mso
                                    ]><a href="" target="_blank" hidden>
                                      <v:roundrect
                                        xmlns:v="urn:schemas-microsoft-com:vml"
                                        xmlns:w="urn:schemas-microsoft-com:office:word"
                                        esdevVmlButton
                                        href=""
                                        style="
                                          height: 46px;
                                          v-text-anchor: middle;
                                          width: 175px;
                                        "
                                        arcsize="13%"
                                        stroke="f"
                                        fillcolor="#ff4f4f">
                                        <w:anchorlock></w:anchorlock>
                                        <center
                                          style="
                                            color: #ffffff;
                                            font-family: arial,
                                              'helvetica neue', helvetica,
                                              sans-serif;
                                            font-size: 16px;
                                            font-weight: 700;
                                            line-height: 16px;
                                            mso-text-raise: 1px;
                                          ">
                                          Pay Now
                                        </center>
                                      </v:roundrect></a
                                    >
                                  <![endif]-->
                                  <!--[if !mso]><!-- --><span
                                    class="msohide es-button-border"
                                    style="
                                      border-style: solid;
                                      border-color: #26a4d3;
                                      background: #ff4f4f;
                                      border-width: 0px;
                                      display: inline-block;
                                      border-radius: 6px;
                                      width: auto;
                                      mso-hide: all;
                                    "
                                    ><a
                                      href=${link}
                                      class="es-button"
                                      target="_blank"
                                      style="
                                        mso-style-priority: 100 !important;
                                        text-decoration: none;
                                        transition: all 100ms ease-in;
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        color: #ffffff;
                                        font-size: 18px;
                                        display: inline-block;
                                        background: #ff4f4f;
                                        border-radius: 6px;
                                        font-family: arial, 'helvetica neue',
                                          helvetica, sans-serif;
                                        font-weight: bold;
                                        font-style: normal;
                                        line-height: 21.6px;
                                        width: auto;
                                        text-align: center;
                                        padding: 15px 45px;
                                        mso-padding-alt: 0;
                                        mso-border-alt: 10px solid #ff4f4f;
                                      "
                                      >Pay Now</a
                                    >
                                  </span>
                                  <!--<![endif]-->
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse: collapse">
                    <td
                      align="left"
                      style="
                        padding: 0;
                        margin: 0;
                        padding-left: 40px;
                        padding-right: 40px;
                      ">
                      <table
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        role="none"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-collapse: collapse;
                          border-spacing: 0px;
                        ">
                        <tr style="border-collapse: collapse">
                          <td
                            align="center"
                            valign="top"
                            style="padding: 0; margin: 0; width: 520px">
                            <table
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                border-collapse: collapse;
                                border-spacing: 0px;
                              ">
                              <tr style="border-collapse: collapse">
                                <td
                                  align="left"
                                  style="padding: 20px; margin: 0">
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #131313;
                                      font-size: 16px;
                                    ">
                           If the button above does not work, please click on the link given below to proceed: 
                           </br>
                           ${link}  
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table
            cellpadding="0"
            cellspacing="0"
            class="es-footer"
            align="center"
            role="none"
            style="
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
              border-collapse: collapse;
              border-spacing: 0px;
              table-layout: fixed !important;
              width: 100%;
              background-color: transparent;
              background-repeat: repeat;
              background-position: center top;
            ">
            <tr style="border-collapse: collapse">
              <td align="center" style="padding: 0; margin: 0">
                <table
                  class="es-footer-body"
                  style="
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                    border-collapse: collapse;
                    border-spacing: 0px;
                    background-color: #ffffff;
                    width: 600px;
                  "
                  cellspacing="0"
                  cellpadding="0"
                  bgcolor="#ffffff"
                  align="center"
                  role="none">
                  <tr style="border-collapse: collapse">
                    <td
                      align="left"
                      style="
                        padding: 0;
                        margin: 0;
                        padding-top: 5px;
                        padding-left: 40px;
                        padding-right: 40px;
                      ">
                      <table
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        role="none"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-collapse: collapse;
                          border-spacing: 0px;
                        ">
                        <tr style="border-collapse: collapse">
                          <td
                            align="center"
                            valign="top"
                            style="padding: 0; margin: 0; width: 520px">
                            <table
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                border-collapse: collapse;
                                border-spacing: 0px;
                              ">
                              <tr style="border-collapse: collapse">
                                <td
                                  align="left"
                                  style="padding: 0; margin: 0">
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #090808;
                                      font-size: 16px;
                                    ">
                                    If you have any queries or need further
                                    assistance, please call us at
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #090808;
                                      font-size: 16px;
                                    ">
                                    022 489 30373 or write to us
                                    at reach@peko.one.&nbsp;&nbsp;
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #090808;
                                      font-size: 16px;
                                    ">
                                    <br />
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #090808;
                                      font-size: 16px;
                                    ">
                                    Best regards,&nbsp;&nbsp;
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 24px;
                                      color: #090808;
                                      font-size: 16px;
                                    ">
                                    Team ${templateDetails?.branding}
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 21px;
                                      color: #090808;
                                      font-size: 14px;
                                    ">
                                    <br />
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse: collapse">
                    <td
                      align="left"
                      bgcolor="#FAFAFA"
                      style="
                        margin: 0;
                        padding-top: 25px;
                        padding-bottom: 25px;
                        padding-left: 40px;
                        padding-right: 40px;
                        background-color: #fafafa;
                      ">
                      <table
                        cellpadding="0"
                        cellspacing="0"
                        width="100%"
                        role="none"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-collapse: collapse;
                          border-spacing: 0px;
                        ">
                        <tr style="border-collapse: collapse">
                          <td
                            align="center"
                            valign="top"
                            style="padding: 0; margin: 0; width: 520px">
                            <table
                              cellpadding="0"
                              cellspacing="0"
                              width="100%"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                border-collapse: collapse;
                                border-spacing: 0px;
                              ">
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="
                                    padding: 0;
                                    margin: 0;
                                    font-size: 0px;
                                  ">
                                  <img
                                    class="adapt-img"
                                    src="https://gxphmw.stripocdn.email/content/guids/CABINET_99f36d15a6b7cd44b38058ccb01f54a7548f6426c6937db3936400c75ef76373/images/group_1597881484.png"
                                    alt
                                    style="
                                      display: block;
                                      border: 0;
                                      outline: none;
                                      text-decoration: none;
                                      -ms-interpolation-mode: bicubic;
                                    "
                                    width="520"
                                    height="199" />
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse: collapse">
                    <td
                      align="left"
                      bgcolor="#ffffff"
                      style="
                        padding: 0;
                        margin: 0;
                        padding-top: 30px;
                        padding-left: 40px;
                        padding-right: 40px;
                        background-color: #ffffff;
                      ">
                      <table
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        role="none"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-collapse: collapse;
                          border-spacing: 0px;
                        ">
                        <tr style="border-collapse: collapse">
                          <td
                            valign="top"
                            align="center"
                            style="padding: 0; margin: 0; width: 520px">
                            <table
                              width="100%"
                              cellspacing="0"
                              cellpadding="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                border-collapse: collapse;
                                border-spacing: 0px;
                              ">
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="
                                    padding: 0;
                                    margin: 0;
                                    font-size: 0px;
                                  ">
                                  <a
                                    target="_blank"
                                    href="https://peko.one/in"
                                    style="
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      text-decoration: underline;
                                      color: #666666;
                                      font-size: 12px;
                                    "
                                    ><img
                                      class="adapt-img"
                                      src=${templateDetails?.logo}
                                      alt
                                      style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                       height="35"></a> </td>
                              </tr>
                              <tr style="border-collapse:collapse">
                                <td align="center" style="padding:0;Margin:0;padding-top:10px;padding-bottom:10px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;line-height:18px;color:#666666;font-size:12px">
                                    This email was sent to you from company email
                                    address</p>
                                </td>
                              </tr>
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="padding: 0; margin: 0">
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 18px;
                                      color: #666666;
                                      font-size: 12px;
                                    ">
                                    <br />© ${new Date().getUTCFullYear()} Peko Platforms Private Limited,
                                    All Rights Reserved
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 18px;
                                      color: #666666;
                                      font-size: 12px;
                                    ">
                                    <br />
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr style="border-collapse: collapse">
                    <td
                      align="left"
                      bgcolor="#0c0c0c"
                      style="
                        margin: 0;
                        padding-top: 5px;
                        padding-bottom: 20px;
                        padding-left: 40px;
                        padding-right: 40px;
                        background-color: #0c0c0c;
                      ">
                      <table
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        role="none"
                        style="
                          mso-table-lspace: 0pt;
                          mso-table-rspace: 0pt;
                          border-collapse: collapse;
                          border-spacing: 0px;
                        ">
                        <tr style="border-collapse: collapse">
                          <td
                            valign="top"
                            align="center"
                            style="padding: 0; margin: 0; width: 520px">
                            <table
                              width="100%"
                              cellspacing="0"
                              cellpadding="0"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                border-collapse: collapse;
                                border-spacing: 0px;
                              ">
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="padding: 0; margin: 0">
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 18px;
                                      color: #ffffff;
                                      font-size: 12px;
                                    ">
                                    <a
                                      href="https://peko.one/in"
                                      style="
                                        -webkit-text-size-adjust: none;
                                        -ms-text-size-adjust: none;
                                        mso-line-height-rule: exactly;
                                        text-decoration: none;
                                        color: #ffffff;
                                        font-size: 12px;
                                      "
                                      target="_blank"
                                      >www.peko.one</a
                                    >
                                  </p>
                                  <p
                                    style="
                                      margin: 0;
                                      -webkit-text-size-adjust: none;
                                      -ms-text-size-adjust: none;
                                      mso-line-height-rule: exactly;
                                      font-family: helvetica, 'helvetica neue',
                                        arial, verdana, sans-serif;
                                      line-height: 18px;
                                      color: #ffffff;
                                      font-size: 12px;
                                    ">
                                    <br />
                                  </p>
                                </td>
                              </tr>
                              <tr style="border-collapse: collapse">
                                <td
                                  align="center"
                                  style="padding: 0; margin: 0; font-size: 0">
                                  <table
                                    class="es-table-not-adapt es-social"
                                    cellspacing="0"
                                    cellpadding="0"
                                    role="presentation"
                                    style="
                                      mso-table-lspace: 0pt;
                                      mso-table-rspace: 0pt;
                                      border-collapse: collapse;
                                      border-spacing: 0px;
                                    ">
                                    <tr style="border-collapse: collapse">
                                      <td
                                        valign="top"
                                        align="center"
                                        style="
                                          padding: 0;
                                          margin: 0;
                                          padding-right: 10px;
                                        ">
                                        <a
                                          target="_blank"
                                          href="https://x.com/PekoIndia"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "
                                          ><img
                                            title="Х"
                                            src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FTwitter%20-%20Negative.svg?alt=media&token=8a7dc063-306c-4f27-84f4-4762f26a3d7d"
                                            alt="Х"
                                            width="24"
                                            height="24"
                                            style="
                                              display: block;
                                              border: 0;
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                            "
                                        /></a>
                                      </td>
                                      <td
                                        valign="top"
                                        align="center"
                                        style="
                                          padding: 0;
                                          margin: 0;
                                          padding-right: 10px;
                                        ">
                                        <a
                                          target="_blank"
                                          href="https://www.instagram.com/peko.india"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "
                                          ><img
                                            title="Instagram"
                                            src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FInstagram%20-%20Negative.svg?alt=media&token=997809a7-a6eb-46aa-a04e-8c970cc41026"
                                            alt="Inst"
                                            width="24"
                                            height="24"
                                            style="
                                              display: block;
                                              border: 0;
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                            "
                                        /></a>
                                      </td>
                                      <td
                                        valign="top"
                                        align="center"
                                        style="padding: 0; margin: 0">
                                        <a
                                          target="_blank"
                                          href="https://www.linkedin.com/company/pekoindia/"
                                          style="
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            text-decoration: underline;
                                            color: #666666;
                                            font-size: 12px;
                                          "
                                          ><img
                                            title="Linkedin"
                                            src="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FLinkedIn%20-%20Negative.svg?alt=media&token=d830adf6-f0e7-4ac5-8add-ddc2ed0395bd"
                                            alt="In"
                                            width="24"
                                            height="24"
                                            style="
                                              display: block;
                                              border: 0;
                                              outline: none;
                                              text-decoration: none;
                                              -ms-interpolation-mode: bicubic;
                                            "
                                        /></a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`
}

// ---- v2 layout helpers (payment link emails) ----
const V2_FONT = "font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;";
const v2Row = (inner, padBottom = 20) => `<tr><td align="left" style="font-size:0px;padding-bottom:${padBottom}px;word-break:break-word;">${inner}</td></tr>`;
const v2Text = (html, padBottom = 20) => v2Row(`<div style="${V2_FONT}font-size:16px;line-height:1.6;text-align:left;color:#000000;">${html}</div>`, padBottom);
const v2Heading = (text) => v2Row(`<div class="peko-heading" style="${V2_FONT}font-size:32px;font-weight:700;line-height:1.3;text-align:left;color:#000000;">${text}</div>`, 24);
const v2Button = (label, href) => v2Row(`<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"><tr><td align="center" bgcolor="#000000" role="presentation" style="border:none;border-radius:10px;mso-padding-alt:16px 32px;background:#000000;" valign="middle"><a href="${href}" target="_blank" style="display:inline-block;background:#000000;color:#ffffff;${V2_FONT}font-size:16px;font-weight:600;line-height:100%;margin:0;text-decoration:none;padding:16px 32px;mso-padding-alt:0px;border-radius:10px;">${label}</a></td></tr></table>`, 28);
const v2DetailRows = (rows) => rows.map(([label, value], i) => {
  const pad = i === rows.length - 1 ? '' : 'padding-bottom:12px;';
  return `<tr><td width="200" valign="top" style="${V2_FONT}font-size:15px;font-weight:700;color:#000000;${pad}">${label}</td><td valign="top" style="${V2_FONT}font-size:15px;color:#000000;${pad}">${value}</td></tr>`;
}).join('');
const v2DetailTable = (rows) => v2Row(`<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">${v2DetailRows(rows)}</table>`, 28);
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

// expiryDate is Decentro expiry_time in minutes; guard against a missing value.
const toExpiryHours = (expiryDate) => {
  const hours = Math.floor(Number(expiryDate) / 60);
  return Number.isFinite(hours) ? String(hours) : '-';
};

// key: INVOICE_PAYMENT_LINK_CREATED (service: INVOICING)
exports.generatePaymentLinkTemplateNew = ({ amount, link, corporateName = 'Team Peko', invoiceId, expiryDate }, partnerDetails) => {
  const { branding } = normalisePartner(partnerDetails);
  const bodyHtml = [
    v2Heading('Complete your payment'),
    v2Text('Dear Customer,'),
    v2Text(`A payment of ₹ ${amount} has been generated by ${corporateName}. Your Reference ID is ${invoiceId}. Please note that this payment request will expire in ${toExpiryHours(expiryDate)} hours. To complete your payment, click the button below:`, 28),
    v2Button('Pay Now', link),
    v2Text(`If the button above does not work, please click on the link given below to proceed:<br><a href="${link}" target="_blank" style="color:#000000;word-break:break-all;">${link}</a>`, 24),
    v2Text('If you have any queries or need further assistance, please write to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.'),
    v2Text(`Best regards,<br>Team ${branding}`, 0),
  ].join('\n');
  return v2Shell({ title: 'Complete your payment', bodyHtml, partnerDetails });
};

exports.resolvePaymentLinkCreatedEmail = (emailData, partnerDetails, { fallbackSubject, partnerId = null, logTraceId = null } = {}) => {
  const { amount, link, corporateName = 'Team Peko', invoiceId, expiryDate } = emailData;
  const partner = normalisePartner(partnerDetails);
  const variables = {
    amount: String(amount),
    link,
    corporateName,
    referenceId: invoiceId || '-',
    expiryHours: toExpiryHours(expiryDate),
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.INVOICE_PAYMENT_LINK_CREATED,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject: fallbackSubject || `Payment Link Generated by ${corporateName}, Reference ID ${invoiceId}`,
    fallback: () => exports.generatePaymentLinkTemplateNew(emailData, partnerDetails),
    partnerId,
    logTraceId,
  });
};

const formatCustomerMobile = (mobile) => (mobile ? `+${mobile}` : '-');

// key: INVOICE_PAYMENT_LINK_PAID (service: INVOICING)
exports.paymentCompletedEmailTemplate = (username, amount, date, referenceId, customerName, customerMobile, customerEmail, partnerDetails) => {
  const { branding } = normalisePartner(partnerDetails);
  const bodyHtml = [
    v2Row(v2SuccessBadge(), 24),
    v2Heading('Payment received'),
    v2Text(`Dear ${username},`),
    v2Text(`We are pleased to inform you that a payment of ₹ ${amount} has been successfully made by your customer on ${date}.`, 28),
    v2DetailTable([
      ['Reference ID:', referenceId || '-'],
      ['Payment Date:', date || '-'],
      ['Customer Name:', customerName || '-'],
      ['Customer Mobile Number:', formatCustomerMobile(customerMobile)],
      ['Customer Email ID:', customerEmail || '-'],
    ]),
    v2Text('If you have any queries or need further assistance, please write to us at <a href="mailto:reach@peko.one" style="color:#000000;">reach@peko.one</a>.'),
    v2Text(`Best Regards,<br>Team ${branding}`, 0),
  ].join('\n');
  return v2Shell({ title: 'Payment received', bodyHtml, partnerDetails });
};

exports.resolvePaymentLinkPaidEmail = ({ username, amount, date, referenceId, customerName, customerMobile, customerEmail }, partnerDetails, { fallbackSubject, partnerId = null, logTraceId = null } = {}) => {
  const partner = normalisePartner(partnerDetails);
  const variables = {
    name: username || '-',
    amount: String(amount),
    date: date || '-',
    referenceId: referenceId || '-',
    customerName: customerName || '-',
    customerMobile: formatCustomerMobile(customerMobile),
    customerEmail: customerEmail || '-',
    branding: partner.branding,
    website: partner.website,
    ...v2LayoutVariables(partner),
  };
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.INVOICE_PAYMENT_LINK_PAID,
    service: EMAIL_TEMPLATE_SERVICES.INVOICING,
    variables,
    fallbackSubject: fallbackSubject || `Payment Received: ₹ ${amount}`,
    fallback: () => exports.paymentCompletedEmailTemplate(username, amount, date, referenceId, customerName, customerMobile, customerEmail, partnerDetails),
    partnerId,
    logTraceId,
  });
};

exports.shareInvoicePdfTemplate = (emailData, partnerDetails) => {
  const { invoiceNo, dueDate, invoiceDate, customerName, amountDue, companyName, companyEmail, companyMobile } = emailData
  return `<!DOCTYPE html>

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
                              padding-bottom: 10px;
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
                                    <div style="max-width: 120px">
                                      <img
                                        alt=""
                                        height="auto"
                                        src="${partnerDetails.logo}"
                                        style="
                                          display: block;
                                          height: auto;
                                          border: 0;
                                          width: 100%;
                                        "
                                        title=""
                                        width="120" />
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
                      class="row-content stack"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #ffffff;
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
                              background-color: #ffffff;
                              padding-bottom: 5px;
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
                                      font-size: 24px;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      line-height: 120%;
                                      text-align: center;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                      mso-line-height-alt: 28.799999999999997px;
                                    ">
                                    Your Invoice from ${companyName} - Invoice #${invoiceNo}
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
                              padding-bottom: 20px;
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
                                      color: #0c0c0d;
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
                                      Dear ${customerName || 'Customer'},
                                    </p>
                                    <p style="margin: 0; margin-bottom: 16px"> 
                                      We hope this message finds you well. Please find your invoice details below: 
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
                                font-size: 14px;
                                font-weight: 400;
                                letter-spacing: 0px;
                                line-height: 200%;
                                text-align: left;
                                mso-line-height-alt: 28px;
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
                                        Invoice Number: ${invoiceNo}
                                      </li>
                                      <li style="margin: 0 0 0 0">
                                        Invoice Date: ${invoiceDate} 
                                      </li>
                                      <li style="margin: 0 0 0 0">
                                        Due Date:  ${dueDate} 
                                      </li>
                                      <li style="margin: 0 0 0 0">
                                        Amount Due: ₹  ${formatNumberWithLocalString(amountDue)} 
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
                                      line-height: 180%;
                                      text-align: left;
                                      mso-line-height-alt: 25.2px;
                                    ">
                                    <p style="margin: 0">
                                        For your convenience, the invoice is attached as a PDF. You can review the details and make payments accordingly. 
                                    </p>
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
                                      line-height: 180%;
                                      text-align: left;
                                      mso-line-height-alt: 25.2px;
                                    ">
                                    <p style="margin: 0">
                                        If you have any questions or concerns regarding this invoice, please do not hesitate to contact us at ${companyEmail} or ${companyMobile}. <br /><br />Best
                                      regards, <br />${companyName}
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
                              cellpadding="5"
                              cellspacing="0"
                              class="heading_block block-1"
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
                                      bis_size="{"
                                      href="https://peko.one/"
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
`

}