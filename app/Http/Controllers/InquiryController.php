<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInquiryRequest;
use App\Models\Inquiry;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\AlertService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function store(StoreInquiryRequest $request): RedirectResponse
    {
        $key = 'inquiry:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors(['message' => 'Too many inquiries. Please try again later.'])->withInput();
        }
        RateLimiter::hit($key, 3600);

        $validated = $request->validated();
        unset($validated['website']);

        $product = null;
        if (! empty($validated['product_id'])) {
            $product = Product::whereKey($validated['product_id'])
                ->where('status', 'active')
                ->first();
            if (! $product) {
                throw ValidationException::withMessages(['product_id' => 'That product is no longer available.']);
            }
        }

        if (! empty($validated['variant_id'])) {
            $variant = ProductVariant::whereKey($validated['variant_id'])
                ->where('product_id', $product?->id)
                ->where('is_active', true)
                ->first();
            if (! $variant) {
                throw ValidationException::withMessages(['variant_id' => 'That product option is no longer available.']);
            }
        }

        $inquiry = Inquiry::create($validated + ['source' => 'website']);

        $context = $product ? ' for '.$product->name : '';

        app(AlertService::class)->dispatch(
            'inquiry_created',
            'info',
            'New website inquiry'.$context,
            $inquiry->name.' sent a '.$inquiry->interest.$context.'.',
            route('admin.inquiries.index'),
            AlertService::SALES_ROLES,
        );

        return back()->with('success', 'Thank you. Danob will be in touch soon.');
    }

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(Inquiry::STATUSES)],
        ]);

        $inquiries = Inquiry::with(['assignee', 'product', 'variant', 'customer'])
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($where) use ($search): void {
                    $where->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                });
            })
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Inquiries/Index', [
            'inquiries' => $inquiries,
            'filters' => [
                'search' => $validated['search'] ?? null,
                'status' => $validated['status'] ?? null,
            ],
            'statuses' => Inquiry::STATUSES,
        ]);
    }

    public function update(Request $request, Inquiry $inquiry): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(Inquiry::STATUSES)],
            'internal_notes' => ['nullable', 'string', 'max:4000'],
        ]);

        $inquiry->update($validated + ['assigned_to' => $request->user()->id]);

        return back()->with('success', 'Inquiry updated.');
    }

    public function convertToCustomer(Request $request, Inquiry $inquiry): RedirectResponse
    {
        $customer = DB::transaction(function () use ($request, $inquiry): Customer {
            if ($inquiry->customer_id) {
                return $inquiry->customer()->firstOrFail();
            }

            $customer = null;
            if ($inquiry->email) {
                $customer = Customer::where('email', $inquiry->email)->lockForUpdate()->first();
            }

            $customer ??= Customer::create([
                'type' => $inquiry->interest === 'Wholesale Order' ? 'business' : 'individual',
                'contact_name' => $inquiry->name,
                'phone' => $inquiry->phone,
                'email' => $inquiry->email,
                'notes' => 'Created from website inquiry #'.$inquiry->id.'. '.$inquiry->message,
                'is_active' => true,
            ]);

            $inquiry->update([
                'customer_id' => $customer->id,
                'status' => Inquiry::STATUS_CONVERTED,
                'assigned_to' => $request->user()->id,
            ]);

            return $customer;
        });

        return back()->with('success', 'Inquiry converted to customer #'.$customer->id.'.');
    }
}
