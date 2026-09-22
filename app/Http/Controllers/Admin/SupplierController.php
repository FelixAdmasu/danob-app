<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = Supplier::latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $suppliers = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Suppliers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:1000',
            'tax_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:5000',
            'is_active' => 'boolean',
        ]);

        Supplier::create($validated);

        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier created successfully.');
    }

    public function show(Supplier $supplier)
    {
        return Inertia::render('Admin/Suppliers/Show', [
            'supplier' => $supplier,
        ]);
    }

    public function edit(Supplier $supplier)
    {
        return Inertia::render('Admin/Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:1000',
            'tax_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:5000',
            'is_active' => 'boolean',
        ]);

        $supplier->update($validated);

        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    public function deactivate(Supplier $supplier)
    {
        $supplier->update(['is_active' => false]);

        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier deactivated.');
    }

    public function activate(Supplier $supplier)
    {
        $supplier->update(['is_active' => true]);

        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier activated.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier deleted.');
    }
}
