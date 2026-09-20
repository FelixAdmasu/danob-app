<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $branches = Branch::where('is_active', true)
            ->latest()
            ->get();

        return Inertia::render('Branches/Index', [
            'branches' => $branches,
        ]);
    }
}
