<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $categorySlug = $request->input('category');
        $brandSlug = $request->input('brand');

        $query = Product::where('status', 'active')
            ->with(['category', 'brand']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($categorySlug) {
            $category = Category::where('slug', $categorySlug)->where('is_active', true)->first();
            if ($category) {
                $query->where('category_id', $category->id);
            }
        }

        if ($brandSlug) {
            $brand = Brand::where('slug', $brandSlug)->where('is_active', true)->first();
            if ($brand) {
                $query->where('brand_id', $brand->id);
            }
        }

        $products = $query->latest()->paginate(12)->withQueryString();

        $categories = Category::where('is_active', true)->orderBy('name')->get();
        $brands = Brand::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'category' => $categorySlug,
                'brand' => $brandSlug,
            ],
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    public function show(Product $product)
    {
        abort_if($product->status !== 'active', 404);

        $product->load(['category', 'brand', 'variants', 'images']);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }
}
