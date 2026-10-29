import PrivacyPolicyModal from '@src/domains/auth/components/modals/PrivacyPolicyModal';
import usePrivacyAcceptApi from '@src/domains/auth/hooks/usePrivacyAcceptApi';
import { setPrivacyModalVisible } from '@src/domains/auth/slices/loginSlice';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

/**
 * The privacy-policy prompt, mounted once for the whole app.
 *
 * Any authed request can come back with responseCode '006' — the ApiClient turns that into
 * `showPrivacyPolicyModal`, and until the policy is accepted every subsequent request fails the same way. The
 * prompt therefore has to be reachable from wherever that happens.
 *
 * It used to be rendered inside two layouts, in the branch that runs only once loading has finished. A 403 on
 * the very first call — a fresh sign-up, or a newly invited member's first login — arrives while the layout is
 * still showing its spinner, so nothing was mounted to show it: the person saw a blank or refused screen with
 * no way to accept and no way forward.
 */
const PrivacyPolicyGate = () => {
    const dispatch = useAppDispatch();
    const { showPrivacyPolicyModal } = useAppSelector(state => state.reducer.auth);
    const { acceptPrivacyPolicyForUser, isLoading } = usePrivacyAcceptApi();

    if (!showPrivacyPolicyModal) return null;

    return (
        <PrivacyPolicyModal
            isOpen={showPrivacyPolicyModal}
            isLoading={isLoading}
            onClose={() => dispatch(setPrivacyModalVisible(false))}
            onAccept={async policyIds => {
                const response = await acceptPrivacyPolicyForUser(policyIds);
                if (response && response.status) {
                    dispatch(setPrivacyModalVisible(false));
                    // Everything the session fetched while the policy was outstanding was refused, so the
                    // app is reloaded rather than each caller being asked to re-request individually.
                    window.location.reload();
                }
            }}
        />
    );
};

export default PrivacyPolicyGate;
