const noop = async () => {};

const page = {
    setContent: noop,
    goto: noop,
    pdf: async () => Buffer.from(''),
    close: noop,
    on: () => {},
    setRequestInterception: noop,
    setDefaultNavigationTimeout: () => {},
    emulateMediaType: noop,
    evaluate: async () => {},
    setViewport: noop,
};

const browser = {
    newPage: async () => page,
    close: noop,
    connected: true,
    on: () => {},
    process: () => null,
};

const launch = async () => browser;

module.exports = { launch, default: { launch } };
