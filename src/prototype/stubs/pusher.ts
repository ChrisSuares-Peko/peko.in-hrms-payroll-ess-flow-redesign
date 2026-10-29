// PROTOTYPE-SETUP: stands in for 'pusher-js' (aliased in vite.config.mts). Realtime push needs Peko's
// Pusher app; the prototype gets inert channels so subscribe/bind/unsubscribe can never throw.
type Handler = (data: any) => void;

class StubChannel {
    bind(_event: string, _handler: Handler) {
        return this;
    }

    unbind(_event?: string, _handler?: Handler) {
        return this;
    }

    unbind_all() {
        return this;
    }

    unsubscribe() {
        return undefined;
    }
}

export default class Pusher {
    constructor(_key?: string, _options?: unknown) {
        // no connection is opened
    }

    subscribe(_channel: string) {
        return new StubChannel();
    }

    unsubscribe(_channel: string) {
        return undefined;
    }

    disconnect() {
        return undefined;
    }
}
