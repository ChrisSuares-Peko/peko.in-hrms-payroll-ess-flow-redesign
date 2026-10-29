import { useEffect, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { setChat } from '@src/slices/chatSlice';

import useTicketCreate from '../hooks/useUpdateChatId';

const scriptTag = import.meta.env.VITE_WIDGET_SCRIPT;

interface Props {
    name?: string;
    email?: string;
    mobile?: string;
    credentialId?: number;
    restoreId?: string;
    role?: string;
    sessionId?: string;
}

const ChatService = ({ name, email, mobile, credentialId, restoreId, role, sessionId }: Props) => {
    const { handleUpdateChatId } = useTicketCreate();
    const dispatch = useDispatch();

    const freshChatEvents = useCallback(() => {
        (window as any).fcWidget.on('user:created', (resp: any) => {
            const status = resp && resp.status;
            const data = resp && resp.data;
            if (status === 200) {
                if (data.restoreId) {
                    const { restoreId: chatId } = data;
                    dispatch(setChat({ chatId, sessionId }));
                    handleUpdateChatId({
                        restoreId: chatId,
                        userId: credentialId,
                        userType: role,
                    });
                }
            }
        });

        (window as any).fcWidget.on('user:cleared', (resp: any) => {
            console.log('user is cleared so destroying widget');
        });

        (window as any).fcWidget.on('widget:destroyed', (resp: any) => {
            (window as any).fwcrm.off('widget:loaded', freshChatEvents);
            const scriptToRemove = document.getElementById('freshchatScript');
            const head = document.head || document.getElementsByTagName('head')[0];
            if (scriptToRemove) {
                head.removeChild(scriptToRemove);
            }
        });

        // (window as any).fcWidget.on('widget:closed', () => {

        // });

        // (window as any).fcWidget.on('widget:opened', () => {

        // });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [credentialId, email, mobile, name, role]);

    const initWidget = useCallback(
        (fcWidgetMessengerConfig: any) => {
            if (!fcWidgetMessengerConfig.restoreId) {
                // eslint-disable-next-line func-names
                const onInit = function () {
                    (window as any).fcWidget.setExternalId(fcWidgetMessengerConfig.externalId);
                    (window as any).fcWidget.user.setProperties({
                        firstName: fcWidgetMessengerConfig.firstName,
                        email: fcWidgetMessengerConfig.email,
                        phone: fcWidgetMessengerConfig.phone,
                    });
                };
                fcWidgetMessengerConfig.onInit = onInit;
            }
            (window as any).fcWidgetMessengerConfig = {
                ...fcWidgetMessengerConfig,
            };
            const freshchatScript = document.createElement('script');
            freshchatScript.src = scriptTag;

            freshchatScript.setAttribute('chat', 'true');
            freshchatScript.id = 'freshchatScript';
            freshchatScript.onload = () => {
                (window as any).fwcrm.on('widget:loaded', freshChatEvents);
            };
            const head = document.head || document.getElementsByTagName('head')[0];
            head.insertBefore(freshchatScript, head.firstChild);
        },
        [freshChatEvents]
    );

    const initializeFreshChatWidget = useCallback(
        () => {
            initWidget({
                externalId: credentialId,
                restoreId: restoreId !== '' ? restoreId : null,
                firstName: name,
                email,
                phone: mobile,
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [credentialId, email, initWidget, mobile, name]
    );

    useEffect(() => {
        initializeFreshChatWidget();

        return () => {
            if ((window as any).fcWidget) {
                (window as any).fcWidget.destroy();
            }
        };
    }, [initializeFreshChatWidget]);

    return null;
};

export default ChatService;
