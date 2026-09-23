<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __invoke(Request $request)
    {
        $categories = Category::where('is_active', true)
            ->withCount('products')
            ->orderBy('name')
            ->get();

        $featuredProducts = Product::where('status', 'active')
            ->with(['category', 'brand', 'images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->limit(6)
            ->get();

        $brands = Brand::where('is_active', true)
            ->withCount('products')
            ->orderBy('name')
            ->get();

        $branches = Branch::where('is_active', true)->get();

        return Inertia::render('Home', [
            'featuredProducts' => $featuredProducts,
            'categories' => $categories,
            'brands' => $brands,
            'branches' => $branches,
        ]);
    }
}
