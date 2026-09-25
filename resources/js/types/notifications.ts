/**
 * Phase 28 — notification center payload shapes.
 *
 * Mirrors exactly what Admin\NotificationController returns: a bounded
 * recent list plus the authoritative unread count. Severity is a plain
 * string on the wire (the server owns the vocabulary) and is mapped to the
 * app's existing badge tones in the UI.
 */
export type NotificationItem = {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    url: string | null;
    read: boolean;
    created_at_diff: string | null;
};

export type NotificationsPayload = {
    unread_count: number;
    notifications: NotificationItem[];
};

/** The slice of shared Inertia props the bell needs. */
export type SharedNotifications = {
    unread_count?: number;
};
