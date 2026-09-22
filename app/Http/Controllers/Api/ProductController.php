<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::where('status', 'active')
            ->with(['category:id,name,slug', 'brand:id,name,slug', 'images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->with(['variants' => fn ($q) => $q->where('is_active', true)])
            ->latest()
            ->paginate(20);

        return response()->json($products);
    }
}
