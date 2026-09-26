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
            ->with([
                'category',
                'brand',
                'images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'),
                'variants' => fn ($q) => $q->where('is_active', true),
            ]);

        if ($search) {
            // Case-insensitive LIKE: PostgreSQL LIKE is case-sensitive (SQLite
            // is not), so LOWER() keeps behaviour consistent across both.
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function ($q) use ($needle) {
                $q->whereRaw('LOWER(name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(description) LIKE ?', [$needle]);
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

        $eagerLoads = [
            'category',
            'brand',
            'images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'),
            'variants' => fn ($q) => $q->where('is_active', true),
        ];

        $product->load([
            'category',
            'brand',
            'images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'),
            'variants' => fn ($q) => $q->where('is_active', true)->orderBy('id'),
        ]);

        // Related products: same category first, then newest active products.
        $related = Product::where('status', 'active')
            ->where('id', '!=', $product->id)
            ->when(
                $product->category_id,
                fn ($q) => $q->where('category_id', $product->category_id)
            )
            ->with($eagerLoads)
            ->latest()
            ->limit(4)
            ->get();

        if ($related->isEmpty()) {
            $related = Product::where('status', 'active')
                ->where('id', '!=', $product->id)
                ->with($eagerLoads)
                ->latest()
                ->limit(4)
                ->get();
        }

        return Inertia::render('Products/Show', [
            'product' => $product,
            'related' => $related,
        ]);
    }
}
