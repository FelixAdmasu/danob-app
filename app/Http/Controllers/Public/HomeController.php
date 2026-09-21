<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Branch;
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
            ->limit(8)
            ->get();

        $featuredProducts = Product::where('status', 'active')
            ->with(['category', 'brand'])
            ->limit(6)
            ->get();

        $brands = Brand::where('is_active', true)
            ->withCount('products')
            ->get();

        $branches = Branch::limit(6)->get();

        return Inertia::render('Home', [
            'featuredProducts' => $featuredProducts,
            'categories' => $categories,
            'brands' => $brands,
            'branches' => $branches,
        ]);
    }
}
