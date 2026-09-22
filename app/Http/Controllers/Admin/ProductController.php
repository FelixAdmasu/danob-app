<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with(['category', 'brand'])
            ->withCount('variants')
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Products/Create', [
            'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'brands' => Brand::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'description' => 'required|string',
            'status' => 'required|string|in:active,inactive',
            'variants' => 'nullable|array',
            'variants.*.name' => 'required_with:variants|string|max:255',
            'variants.*.sku' => 'nullable|string|max:255|unique:product_variants,sku',
            'variants.*.unit' => 'nullable|string|max:50',
            'variants.*.quantity' => 'nullable|integer|min:0',
            'variants.*.public_price' => 'nullable|numeric|min:0|max:999999.99',
            'variants.*.is_active' => 'nullable|boolean',
            'images' => 'nullable|array',
            'images.*.url' => 'required_with:images|string|max:2048',
            'images.*.sort_order' => 'nullable|integer|min:0',
            'images.*.is_primary' => 'nullable|boolean',
            'images.*.alt_text' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated): void {
            $product = Product::create([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'category_id' => $validated['category_id'],
                'brand_id' => $validated['brand_id'] ?? null,
                'description' => $validated['description'],
                'status' => $validated['status'],
            ]);

            foreach ($validated['variants'] ?? [] as $variantData) {
                $product->variants()->create([
                    'name' => $variantData['name'],
                    'sku' => $variantData['sku'] ?? null,
                    'unit' => $variantData['unit'] ?? null,
                    'quantity' => $variantData['quantity'] ?? 1,
                    'public_price' => $variantData['public_price'] ?? null,
                    'is_active' => $variantData['is_active'] ?? true,
                ]);
            }

            foreach ($validated['images'] ?? [] as $index => $imageData) {
                $product->images()->create([
                    'url' => $imageData['url'],
                    'sort_order' => $imageData['sort_order'] ?? $index,
                    'is_primary' => $imageData['is_primary'] ?? false,
                    'alt_text' => $imageData['alt_text'] ?? null,
                ]);
            }
        });

        return redirect()->route('admin.products.index');
    }

    public function show(Product $product)
    {
        $product->load([
            'category',
            'brand',
            'variants' => fn ($q) => $q->orderBy('id'),
            'images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'),
        ]);

        return Inertia::render('Admin/Products/Show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product)
    {
        $product->load([
            'category',
            'brand',
            'variants' => fn ($q) => $q->orderBy('id'),
            'images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'),
        ]);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
            'brands' => Brand::where('is_active', true)->orderBy('name')->get(['id', 'name', 'slug']),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => ['required', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product->id)],
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'description' => 'required|string',
            'status' => 'required|string|in:active,inactive',
            'variants' => 'nullable|array',
            'variants.*.id' => 'nullable|integer|exists:product_variants,id',
            'variants.*.name' => 'required_with:variants|string|max:255',
            'variants.*.sku' => 'nullable|string|max:255',
            'variants.*.unit' => 'nullable|string|max:50',
            'variants.*.quantity' => 'nullable|integer|min:0',
            'variants.*.public_price' => 'nullable|numeric|min:0|max:999999.99',
            'variants.*.is_active' => 'nullable|boolean',
            'images' => 'nullable|array',
            'images.*.id' => 'nullable|integer|exists:product_images,id',
            'images.*.url' => 'required_with:images|string|max:2048',
            'images.*.sort_order' => 'nullable|integer|min:0',
            'images.*.is_primary' => 'nullable|boolean',
            'images.*.alt_text' => 'nullable|string|max:255',
        ]);

        // Validate SKU uniqueness per variant (ignore current id on update)
        $variantRules = [];
        foreach ($validated['variants'] ?? [] as $idx => $v) {
            $ignoreId = $v['id'] ?? null;
            $variantRules["variants.$idx.sku"] = [
                'nullable', 'string', 'max:255',
                $ignoreId ? Rule::unique('product_variants', 'sku')->ignore($ignoreId) : Rule::unique('product_variants', 'sku'),
            ];
        }
        if ($variantRules) {
            $request->validate($variantRules);
        }

        DB::transaction(function () use ($request, $product, $validated): void {
            $product->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'category_id' => $validated['category_id'],
                'brand_id' => $validated['brand_id'] ?? null,
                'description' => $validated['description'],
                'status' => $validated['status'],
            ]);

            if (array_key_exists('variants', $validated)) {
                $keepVariantIds = [];
                foreach ($validated['variants'] ?? [] as $variantData) {
                    $id = $variantData['id'] ?? null;
                    $payload = [
                        'name' => $variantData['name'],
                        'sku' => $variantData['sku'] ?? null,
                        'unit' => $variantData['unit'] ?? null,
                        'quantity' => $variantData['quantity'] ?? 1,
                        'public_price' => $variantData['public_price'] ?? null,
                        'is_active' => $variantData['is_active'] ?? true,
                    ];
                    if ($id) {
                        $variant = $product->variants()->find($id);
                        if ($variant) {
                            $variant->update($payload);
                            $keepVariantIds[] = $variant->id;
                        } else {
                            $new = $product->variants()->create($payload);
                            $keepVariantIds[] = $new->id;
                        }
                    } else {
                        $new = $product->variants()->create($payload);
                        $keepVariantIds[] = $new->id;
                    }
                }
                // Delete variants not sent (explicit removal)
                if ($keepVariantIds) {
                    $product->variants()->whereNotIn('id', $keepVariantIds)->delete();
                } else {
                    $product->variants()->delete();
                }
            }

            if (array_key_exists('images', $validated)) {
                $keepImageIds = [];
                foreach ($validated['images'] ?? [] as $index => $imageData) {
                    $id = $imageData['id'] ?? null;
                    $payload = [
                        'url' => $imageData['url'],
                        'sort_order' => $imageData['sort_order'] ?? $index,
                        'is_primary' => $imageData['is_primary'] ?? false,
                        'alt_text' => $imageData['alt_text'] ?? null,
                    ];
                    if ($id) {
                        $image = $product->images()->find($id);
                        if ($image) {
                            $image->update($payload);
                            $keepImageIds[] = $image->id;
                        } else {
                            $new = $product->images()->create($payload);
                            $keepImageIds[] = $new->id;
                        }
                    } else {
                        $new = $product->images()->create($payload);
                        $keepImageIds[] = $new->id;
                    }
                }
                if ($keepImageIds) {
                    $product->images()->whereNotIn('id', $keepImageIds)->delete();
                } else {
                    $product->images()->delete();
                }
            }
        });

        return redirect()->route('admin.products.index');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('admin.products.index');
    }
}
