<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $branches = Branch::latest()->paginate(20);

        return Inertia::render('Admin/Branches/Index', [
            'branches' => $branches,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Branches/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'sub_city' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'opening_hours' => 'nullable|string',
            'services' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Branch::create($validated);

        return redirect()->route('admin.branches.index');
    }

    public function edit(Branch $branch)
    {
        return Inertia::render('Admin/Branches/Edit', [
            'branch' => $branch,
        ]);
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'sub_city' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'opening_hours' => 'nullable|string',
            'services' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $branch->update($validated);

        return redirect()->route('admin.branches.index');
    }

    public function destroy(Branch $branch)
    {
        $branch->delete();

        return redirect()->route('admin.branches.index');
    }
}
