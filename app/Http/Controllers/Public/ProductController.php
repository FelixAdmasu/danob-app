<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::where('status', 'active')
            ->with(['category', 'brand'])
            ->latest()
            ->paginate(12);

        return Inertia::render('Products/Index', [
            'products' => $products,
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
