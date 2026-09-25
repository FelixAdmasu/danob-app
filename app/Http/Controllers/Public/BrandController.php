<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $brands = Brand::where('is_active', true)
            ->withCount('products')
            ->latest()
            ->get();

        return Inertia::render('Brands/Index', [
            'brands' => $brands,
        ]);
    }

    public function show(Brand $brand)
    {
        abort_unless($brand->is_active, 404);

        $brand->load(['products' => function ($query) {
            $query->where('status', 'active')->with(['images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')]);
        }]);

        return Inertia::render('Brands/Show', [
            'brand' => $brand,
        ]);
    }
}
