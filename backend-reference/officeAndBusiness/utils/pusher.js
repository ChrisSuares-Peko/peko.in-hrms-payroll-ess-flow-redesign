const Pusher = require("pusher");

const pusher = new Pusher({
  appId: "1986496",
  key: "c071f84777ea23ecd9a6",
  secret: "REDACTED",
  cluster: "ap2",
  encrypted: true,
});

module.exports = pusher;
