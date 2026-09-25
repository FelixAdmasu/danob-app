<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Global search endpoint (Phase 27).
 *
 * Serves the header search box as plain JSON (the UI is client-side state,
 * not a page transition). Read-only by construction: it validates the term,
 * delegates every query to GlobalSearchService — which bounds results and
 * applies the role rules of each entity's own routes — and returns only
 * normalized identifying fields. Oversized or malformed input fails
 * validation (422 JSON for the box, redirect for a raw browser hit), and an
 * empty term short-circuits to an empty group list without touching data.
 */
class SearchController extends Controller
{
    public function index(Request $request, GlobalSearchService $search): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $term = trim($validated['search'] ?? '');

        return response()->json([
            'query' => $term,
            'groups' => $search->search($term, $request->user()),
        ]);
    }
}
