exports.BCRYPT_SALT_ROUNDS = 10;

exports.PASSWORD_GEN_DIGIT_CHARS = "REDACTED";

exports.TAX_IMS_REF_ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

exports.MOCK_TEST_EMAIL = "test@test.com";

exports.STAGING_MOCK_GST_RETURNS_RESPONSE = {
  data: {
    status: true,
    status_cd: "1",
    "EFiledlist": [
      {
        "valid": "Y",
        "mof": "ONLINE",
        "dof": "16-01-2018",
        "ret_prd": "062017",
        "rtntype": "GSTR3B",
        "arn": "AA080617000247D", "status": "Filed"
      },
      {
        "valid": "Y",
        "mof": "ONLINE",
        "dof": "16-01-2018",
        "ret_prd": "072017",
        "rtntype": "GSTR3B",
        "arn": "AA080717000401N",
        "status": "Filed"
      },
      {
        "valid": "Y",
        "mof": "ONLINE",
        "dof": "12-01-2018",
        "ret_prd": "052017",
        "rtntype": "GSTR3B",
        "arn": "AA080517000372K",
        "status": "Filed"
      },
      {
        "valid": "Y",
        "mof": "ONLINE",
        "dof": "03-07-2017",
        "ret_prd": "102017",
        "rtntype": "GSTR1",
        "arn": "AA051016000296T",
        "status": "Filed"
      },
      {
        "mof": "ONLINE",
        "dof": "03-07-2017",
        "ret_prd": "112017",
        "rtntype": "GSTR3B",
        "arn": "AA051016000297R", "status": "Filed"
      }
    ]
  }
};
