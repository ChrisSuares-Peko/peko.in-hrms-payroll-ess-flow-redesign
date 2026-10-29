/* eslint-disable no-return-assign */
/* eslint-disable no-multi-assign */
export {};

declare global {
    interface Window {
        moengage_q?: any[];
        moengage_object?: string;
        moe?: any;
        Moengage?: any;
    }
}

(() => {
    const moeDataCenter = import.meta.env.VITE_MOENGAGE_DC;
    const moeAppID = import.meta.env.VITE_MOENGAGE_APPID;
    const moeDebugLogs = Number(import.meta.env.VITE_MOENGAGE_DEBUGLOGS || 0);
    const sdkVersion = '2';

    if (!moeDataCenter || !/^dc_[0-9]+$/.test(moeDataCenter)) {
        console.error('MoEngage: Invalid Data Center', moeDataCenter);
        return;
    }

    (function moengageInit(e: any, n: Document, i: string, t: string, a: string) {
        e.moengage_object = a;

        const g = (f: string) =>
            function moengageQueuePush() {
                // eslint-disable-next-line prefer-rest-params
                (e.moengage_q = e.moengage_q || []).push({ f, a: arguments });
            };

        const methods = [
            'track_event',
            'add_user_attribute',
            'add_first_name',
            'add_last_name',
            'add_email',
            'add_mobile',
            'add_user_name',
            'add_gender',
            'add_birthday',
            'destroy_session',
            'add_unique_user_id',
            'update_unique_user_id',
            'moe_events',
            'call_web_push',
            'track',
            'identifyUser',
        ];

        const l: Record<string, any> = {};
        methods.forEach(m => (l[m] = g(m)));

        // Bug fix: this used to fall back to a plain `[]` instead of the queueing stub `l` above,
        // so window.Moengage had none of these methods until the async SDK script finished
        // loading — every call site's `typeof Moengage?.xxx === 'function'` guard would then
        // silently drop identifyUser/add_email/track_event/destroy_session calls made in that
        // window (e.g. right after a fast login or logout), instead of queueing them via
        // moengage_q for the real SDK to replay once it loads.
        const s = (e[a] = e[a] || l);
        if (s.invoked) return;

        s.invoked = true;

        const r = n.createElement(i) as HTMLScriptElement;
        r.async = true;
        r.src = t;
        n.head.appendChild(r);

        e.moe = function moengageGetInstance() {
            return l;
        };

        r.onload = function moengageOnLoad() {
            e[a] = e.moe({
                app_id: moeAppID,
                debug_logs: moeDebugLogs,
            });

            e.Moengage = e[a];
            e[a].initialized = true;
        };
    })(
        window,
        document,
        'script',
        `https://cdn.moengage.com/release/${moeDataCenter}/versions/${sdkVersion}/moe_webSdk.min.latest.js`,
        'Moengage'
    );
})();
