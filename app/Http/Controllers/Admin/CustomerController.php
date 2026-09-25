<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            // Same vocabulary the store rule uses — one source of truth for
            // what a customer type may be.
            'type' => ['nullable', 'string', Rule::in(['business', 'home_business', 'individual', 'other'])],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $search = $validated['search'] ?? null;
        $type = $validated['type'] ?? null;
        $status = $validated['status'] ?? null;

        $query = Customer::withCount('orders')
            // Database-side filtering only; invalid values never reach here
            // (validation above) and each term is a bound parameter.
            ->when($search, function ($q) use ($search): void {
                $q->where(function ($w) use ($search): void {
                    $w->where('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($status, fn ($q) => $q->where('is_active', $status === 'active'))
            ->latest();

        $customers = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'status' => $status,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Customers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:business,home_business,individual,other',
            'company_name' => 'nullable|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        Customer::create($validated);

        return redirect()->route('admin.customers.index');
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Admin/Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:business,home_business,individual,other',
            'company_name' => 'nullable|string|max:255',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $customer->update($validated);

        return redirect()->route('admin.customers.index');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()->route('admin.customers.index');
    }
}
