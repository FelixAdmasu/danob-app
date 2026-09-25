<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase 28 — notification center endpoints.
 *
 * Small bounded JSON for the header bell (the same pattern Phase 27 used
 * for global search): the list is fetched when the panel opens, and both
 * mutations answer with the full fresh state so the UI can update
 * immediately without guessing.
 *
 * Security: ownership is enforced in the query itself — every lookup runs
 * through $user->notifications(), so an id belonging to someone else is a
 * 404, never a 403 or a payload leak. Nothing here can touch another user's
 * notifications, and the response carries only normalized display fields.
 */
class NotificationController extends Controller
{
    /** Most recent notifications the panel ever renders. */
    public const RECENT_LIMIT = 20;

    /**
     * Recent notifications + the server-side unread count.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json($this->payload($request->user()));
    }

    /**
     * Mark one of the caller's notifications as read. Unknown or foreign
     * ids are indistinguishable (both 404), so ids can't be probed.
     */
    public function read(Request $request, string $notification): JsonResponse
    {
        $row = $request->user()->notifications()->where('id', $notification)->firstOrFail();

        if ($row->read_at === null) {
            $row->markAsRead();
        }

        return response()->json($this->payload($request->user()));
    }

    /**
     * Mark every unread notification of the caller as read, in one indexed
     * UPDATE scoped to the authenticated user.
     */
    public function readAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json($this->payload($request->user()));
    }

    /**
     * Bounded payload: one COUNT for the badge plus the newest rows only —
     * never the whole notification history.
     *
     * @return array{unread_count: int, notifications: array<int, array<string, mixed>>}
     */
    private function payload(User $user): array
    {
        return [
            'unread_count' => $user->notifications()->unread()->count(),
            'notifications' => $user->notifications()
                ->latest()
                ->take(self::RECENT_LIMIT)
                ->get()
                ->map(fn ($notification) => [
                    'id' => $notification->id,
                    'type' => $notification->data['type'] ?? 'alert',
                    'severity' => $notification->data['severity'] ?? 'info',
                    'title' => $notification->data['title'] ?? '',
                    'message' => $notification->data['message'] ?? '',
                    'url' => $notification->data['url'] ?? null,
                    'read' => $notification->read_at !== null,
                    'created_at_diff' => $notification->created_at?->diffForHumans(),
                ])
                ->values()
                ->all(),
        ];
    }
}
