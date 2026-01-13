import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebaseClient';
import { queryKeys } from './useQueries';

/**
 * Hook to listen for real-time messages in a conversation
 */
export function useRealtimeConversationMessages(conversationId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!conversationId) return;

        const messagesRef = ref(db, `conversations/${conversationId}/messages`);

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            if (data) {
                // When new message arrives, we can either:
                // 1. Invalidate query to refetch from API (simpler, ensures consistency)
                // 2. Update cache directly from Firebase data (faster, but complex data mapping)

                // Strategy 1: Data signal
                queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
                queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
            }
        };

        const unsubscribe = onValue(messagesRef, handleData);

        return () => unsubscribe();
    }, [conversationId, queryClient]);
}

/**
 * Hook to listen for real-time conversation updates
 */
export function useRealtimeConversations(userId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const userConversationsRef = ref(db, `users/${userId}/conversations`);

        const handleData = () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
        };

        const unsubscribe = onValue(userConversationsRef, handleData);

        return () => unsubscribe();
    }, [userId, queryClient]);
}

/**
 * Hook to listen for real-time unread count updates
 */
export function useRealtimeUnreadCount(userId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const unreadCountRef = ref(db, `users/${userId}/unreadCount`);

        const handleData = (snapshot: any) => {
            const count = snapshot.val();
            if (typeof count === 'number') {
                queryClient.setQueryData(queryKeys.unreadCount, count);
            } else {
                queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
            }
        };

        const unsubscribe = onValue(unreadCountRef, handleData);

        return () => unsubscribe();
    }, [userId, queryClient]);
}

/**
 * Hook to listen for real-time notification list updates
 * This listens to a 'lastNotificationAt' timestamp signal
 */
export function useRealtimeNotifications(userId?: string, onUpdate?: () => void) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const lastNotificationRef = ref(db, `users/${userId}/lastNotificationAt`);

        const handleData = (snapshot: any) => {
            const timestamp = snapshot.val();
            if (timestamp) {
                // When timestamp changes, invalidate query or call callback
                queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Assuming generic key, though page uses specific fetch
                if (onUpdate) {
                    onUpdate();
                }
            }
        };

        const unsubscribe = onValue(lastNotificationRef, handleData);

        return () => unsubscribe();
    }, [userId, queryClient, onUpdate]);
}
