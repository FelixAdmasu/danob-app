<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\OptimizeProductImage;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $search = $validated['search'] ?? null;
        $categoryId = $validated['category_id'] ?? null;
        $brandId = $validated['brand_id'] ?? null;
        $status = $validated['status'] ?? null;

        $query = Product::with(['category', 'brand'])
            ->withCount('variants')
            // Variants needing attention per the authoritative stock status:
            // out of stock, or monitored and at/below threshold.
            ->withCount(['variants as low_stock_variants_count' => fn ($q) => $q->where('is_active', true)
                ->where(fn ($v) => $v->where('quantity', '<=', 0)
                    ->orWhere(fn ($v2) => $v2->whereNotNull('low_stock_threshold')
                        ->whereColumn('quantity', '<=', 'low_stock_threshold')))])
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')->orderBy('id')])
            // Every filter is a database-side constraint; the validated term
            // is bound as a parameter, never concatenated into SQL.
            ->when($search, function ($q) use ($search): void {
                $q->where(function ($w) use ($search): void {
                    $w->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, fn ($q) => $q->where('category_id', $categoryId))
            ->when($brandId, fn ($q) => $q->where('brand_id', $brandId))
            ->when($status, fn ($q) => $q->where('status', $status));

        $products = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            // Filter options: every category/brand is listed (not just the
            // active ones) so an admin can always find a product by the
            // group it belongs to.
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'brands' => Brand::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId !== null ? (int) $categoryId : null,
                'brand_id' => $brandId !== null ? (int) $brandId : null,
                'status' => $status,
            ],
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
            'variants.*.low_stock_threshold' => 'nullable|integer|min:0|max:1000000',
            'variants.*.public_price' => 'nullable|numeric|min:0|max:999999.99',
            'variants.*.is_active' => 'nullable|boolean',
            'images' => 'nullable|array',
            'images.*.id' => 'nullable|integer|exists:product_images,id',
            'images.*.url' => 'nullable|string|max:2048',
            'images.*.file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'images.*.sort_order' => 'nullable|integer|min:0',
            'images.*.is_primary' => 'nullable|boolean',
            'images.*.alt_text' => 'nullable|string|max:255',
        ]);

        // Ensure at least url or file for each image
        foreach ($validated['images'] ?? [] as $idx => $img) {
            if (empty($img['url']) && empty($request->file("images.$idx.file"))) {
                return back()->withErrors(["images.$idx.file" => 'Either URL or file is required.'])->withInput();
            }
        }

        $product = null;
        $uploadedPaths = [];

        try {
            DB::transaction(function () use ($request, $validated, &$product, &$uploadedPaths): void {
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
                        'low_stock_threshold' => $variantData['low_stock_threshold'] ?? null,
                        'public_price' => $variantData['public_price'] ?? null,
                        'is_active' => $variantData['is_active'] ?? true,
                    ]);
                }

                $disk = config('filesystems.product_images_disk', 'public');
                $hasPrimary = false;

                foreach ($validated['images'] ?? [] as $index => $imageData) {
                    $url = $imageData['url'] ?? null;
                    $file = $request->file("images.$index.file");

                    if ($file) {
                        $path = $this->storeImageOrFail($file, 'products/'.$product->id, $disk, $index);
                        $uploadedPaths[] = ['disk' => $disk, 'path' => $path];
                        $url = $this->storageUrl($disk, $path);
                    }

                    if (! $url) {
                        continue;
                    }

                    $isPrimary = $imageData['is_primary'] ?? false;
                    if ($isPrimary && $hasPrimary) {
                        $isPrimary = false;
                    }
                    if ($isPrimary) {
                        $hasPrimary = true;
                    }

                    $product->images()->create([
                        'url' => $url,
                        'sort_order' => $imageData['sort_order'] ?? $index,
                        'is_primary' => $isPrimary,
                        'alt_text' => $imageData['alt_text'] ?? null,
                    ]);
                }

                // Ensure at most one primary - if none set, first image becomes primary
                if (! $hasPrimary && $product->images()->exists()) {
                    $first = $product->images()->orderBy('sort_order')->first();
                    if ($first) {
                        $product->images()->where('id', $first->id)->update(['is_primary' => true]);
                    }
                }
            });
        } catch (\Throwable $e) {
            // Cleanup uploaded files if transaction failed
            foreach ($uploadedPaths as $uploaded) {
                Storage::disk($uploaded['disk'])->delete($uploaded['path']);
            }
            throw $e;
        }

        foreach ($uploadedPaths as $uploaded) {
            OptimizeProductImage::dispatch($uploaded['disk'], $uploaded['path']);
        }

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
            'variants.*.low_stock_threshold' => 'nullable|integer|min:0|max:1000000',
            'variants.*.public_price' => 'nullable|numeric|min:0|max:999999.99',
            'variants.*.is_active' => 'nullable|boolean',
            'images' => 'nullable|array',
            'images.*.id' => 'nullable|integer|exists:product_images,id',
            'images.*.url' => 'nullable|string|max:2048',
            'images.*.file' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
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

        // Ensure at least url or file for each image where id not set or url empty
        foreach ($validated['images'] ?? [] as $idx => $img) {
            $hasId = ! empty($img['id']);
            $hasUrl = ! empty($img['url']);
            $hasFile = $request->hasFile("images.$idx.file");
            if (! $hasId && ! $hasUrl && ! $hasFile) {
                return back()->withErrors(["images.$idx.file" => 'Either URL or file is required.'])->withInput();
            }
            if ($hasId && ! $hasUrl && ! $hasFile) {
                // Existing image must keep url or have new file
                $existing = $product->images()->find($img['id']);
                if ($existing && empty($existing->url) && ! $hasFile) {
                    return back()->withErrors(["images.$idx.file" => 'Either URL or file is required.'])->withInput();
                }
            }
        }

        $uploadedPaths = [];

        try {
            DB::transaction(function () use ($request, $product, $validated, &$uploadedPaths): void {
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
                            'low_stock_threshold' => $variantData['low_stock_threshold'] ?? null,
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
                    if ($keepVariantIds) {
                        $product->variants()->whereNotIn('id', $keepVariantIds)->delete();
                    } else {
                        $product->variants()->delete();
                    }
                }

                if (array_key_exists('images', $validated)) {
                    $keepImageIds = [];
                    $disk = config('filesystems.product_images_disk', 'public');
                    $hasPrimary = false;
                    $imagesToDelete = [];

                    // First, handle file uploads and determine final payloads
                    $processedImages = [];
                    foreach ($validated['images'] ?? [] as $index => $imageData) {
                        $id = $imageData['id'] ?? null;
                        $file = $request->file("images.$index.file");
                        $url = $imageData['url'] ?? null;

                        if ($file) {
                            $path = $this->storeImageOrFail($file, 'products/'.$product->id, $disk, $index);
                            $uploadedPaths[] = ['disk' => $disk, 'path' => $path];
                            $url = $this->storageUrl($disk, $path);
                        } elseif ($id) {
                            // Keep existing url if no new file and no url provided
                            if (! $url) {
                                $existing = $product->images()->find($id);
                                $url = $existing?->url;
                            }
                        }

                        if (! $url) {
                            continue;
                        }

                        $isPrimary = $imageData['is_primary'] ?? false;
                        if ($isPrimary && $hasPrimary) {
                            $isPrimary = false;
                        }
                        if ($isPrimary) {
                            $hasPrimary = true;
                        }

                        $processedImages[] = [
                            'id' => $id,
                            'payload' => [
                                'url' => $url,
                                'sort_order' => $imageData['sort_order'] ?? $index,
                                'is_primary' => $isPrimary,
                                'alt_text' => $imageData['alt_text'] ?? null,
                            ],
                        ];
                    }

                    // If none marked primary but images exist, first becomes primary
                    if (! $hasPrimary && $processedImages) {
                        $processedImages[0]['payload']['is_primary'] = true;
                        $hasPrimary = true;
                    }

                    // Persist
                    foreach ($processedImages as $item) {
                        $id = $item['id'];
                        $payload = $item['payload'];
                        if ($id) {
                            $image = $product->images()->find($id);
                            $oldUrl = $image?->url;
                            if ($image) {
                                $image->update($payload);
                                $keepImageIds[] = $image->id;
                                // If url changed from file upload, delete old file if owned
                                if ($oldUrl && $oldUrl !== $payload['url'] && $this->isOwnedStorageUrl($oldUrl)) {
                                    $this->deleteOwnedFile($oldUrl);
                                }
                            } else {
                                $new = $product->images()->create($payload);
                                $keepImageIds[] = $new->id;
                            }
                        } else {
                            $new = $product->images()->create($payload);
                            $keepImageIds[] = $new->id;
                        }
                    }

                    // Delete removed images and their storage files if owned
                    $toDelete = $keepImageIds
                        ? $product->images()->whereNotIn('id', $keepImageIds)->get()
                        : $product->images()->get();

                    foreach ($toDelete as $img) {
                        if ($this->isOwnedStorageUrl($img->url)) {
                            $this->deleteOwnedFile($img->url);
                        }
                        $img->delete();
                    }

                    // Ensure single primary after sync
                    if ($hasPrimary) {
                        $primaryId = collect($processedImages)->firstWhere(fn ($i) => $i['payload']['is_primary'])?->id
                            ?? $product->images()->where('is_primary', true)->first()?->id;
                        if ($primaryId) {
                            $product->images()->where('id', '!=', $primaryId)->update(['is_primary' => false]);
                        }
                    }
                }
            });
        } catch (\Throwable $e) {
            foreach ($uploadedPaths as $uploaded) {
                Storage::disk($uploaded['disk'])->delete($uploaded['path']);
            }
            throw $e;
        }

        foreach ($uploadedPaths as $uploaded) {
            OptimizeProductImage::dispatch($uploaded['disk'], $uploaded['path']);
        }

        return redirect()->route('admin.products.index');
    }

    public function destroy(Product $product)
    {
        // Delete owned storage files before deleting product (cascade will delete DB records)
        foreach ($product->images as $image) {
            if ($this->isOwnedStorageUrl($image->url)) {
                $this->deleteOwnedFile($image->url);
            }
        }

        $product->delete();

        return redirect()->route('admin.products.index');
    }

    /**
     * Public URL for an uploaded image.
     *
     * Local disks are served through the /storage symlink, so persist a
     * root-relative URL: it keeps working no matter which host, port or
     * APP_URL the app is served from (dev server ports, deploy domains).
     * Cloud disks (s3/supabase) keep their absolute public URL.
     */
    private function storageUrl(string $disk, string $path): string
    {
        $url = Storage::disk($disk)->url($path);

        if (config("filesystems.disks.{$disk}.driver") !== 'local') {
            return $url;
        }

        $relative = parse_url($url, PHP_URL_PATH);

        return is_string($relative) && $relative !== '' ? $relative : $url;
    }

    /**
     * Persist an uploaded image or fail the whole request with a field error.
     *
     * Storage can reject a write (missing bucket, bad keys, unwritable disk).
     * We must never persist a product_images row for a file that was not saved —
     * a silent false here is how "uploaded" images vanish on the next deploy.
     */
    private function storeImageOrFail(UploadedFile $file, string $directory, string $disk, string|int $index): string
    {
        // Fail fast in production: writing to a local disk means the container's
        // ephemeral filesystem, which is wiped on every deploy — images would 404
        // after the next redeploy. Only cloud disks (supabase/s3) are durable.
        if (config('app.env') === 'production' && config("filesystems.disks.{$disk}.driver") === 'local') {
            report(new \RuntimeException(
                "Blocked product image upload to local disk '{$disk}' in production — storage is misconfigured (FILESYSTEM_DISK_PRODUCT_IMAGES must be 'supabase')."
            ));

            throw ValidationException::withMessages([
                "images.{$index}.file" => 'Image storage is not configured for production uploads. Set FILESYSTEM_DISK_PRODUCT_IMAGES=supabase (see docs/storage.md).',
            ]);
        }

        try {
            $path = $file->store($directory, $disk);
        } catch (\Throwable $e) {
            report($e);
            $path = false;
        }

        if (! is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                "images.{$index}.file" => 'Image upload failed — the file could not be saved to storage. Please try again.',
            ]);
        }

        return $path;
    }

    private function isOwnedStorageUrl(string $url): bool
    {
        // Owned if it's a storage path for product-images disk (local /storage/ or supabase bucket)
        // External URLs (https://example.com/...) are not owned.
        // A hostless url resolves against this app's origin, so /storage/... is ours.
        $path = parse_url($url, PHP_URL_PATH);
        if (is_string($path) && str_starts_with($path, '/storage/') && parse_url($url, PHP_URL_HOST) === null) {
            return true;
        }
        if (str_starts_with($url, '/storage/product-images/')) {
            return true;
        }
        if (str_contains($url, '/storage/v1/object/public/'.config('filesystems.disks.supabase.bucket', 'product-images'))) {
            return true;
        }
        // Check if url is from our configured disks
        $disk = config('filesystems.product_images_disk', 'public');
        try {
            $diskUrl = Storage::disk($disk)->url('');
            if ($diskUrl && str_starts_with($url, $diskUrl)) {
                return true;
            }
        } catch (\Throwable $e) {
            // ignore
        }
        // Also check supabase disk
        try {
            $supabaseUrl = Storage::disk('supabase')->url('');
            if ($supabaseUrl && str_starts_with($url, $supabaseUrl)) {
                return true;
            }
        } catch (\Throwable $e) {
            // ignore
        }

        return false;
    }

    private function deleteOwnedFile(string $url): void
    {
        // Derive storage path from url and delete from appropriate disk
        $disks = [config('filesystems.product_images_disk', 'public'), 'supabase', 'public', 's3'];
        $disks = array_unique(array_filter($disks));

        foreach ($disks as $disk) {
            try {
                $diskUrl = Storage::disk($disk)->url('');
                if ($diskUrl && str_starts_with($url, $diskUrl)) {
                    $path = ltrim(Str::after($url, $diskUrl), '/');
                    if ($path && Storage::disk($disk)->exists($path)) {
                        Storage::disk($disk)->delete($path);

                        return;
                    }
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        // Fallback for local /storage/... paths
        if (str_starts_with($url, '/storage/')) {
            $path = ltrim(Str::after($url, '/storage/'), '/');
            // For local public disk, product-images is under product-images/
            if (str_starts_with($path, 'product-images/')) {
                $actualPath = Str::after($path, 'product-images/');
                if (Storage::disk('product-images')->exists($actualPath) || Storage::disk('public')->exists($actualPath) || Storage::disk('public')->exists('product-images/'.$actualPath)) {
                    Storage::disk('product-images')->delete($actualPath);
                    Storage::disk('public')->delete($actualPath);
                    Storage::disk('public')->delete('product-images/'.$actualPath);
                }
            } else {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
