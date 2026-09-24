<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\HandlesImageStorage;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BrandController extends Controller
{
    use HandlesImageStorage;

    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Brand::withCount('products')->latest();

        if ($search) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $brands = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Brands/Index', [
            'brands' => $brands,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Brands/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:brands,slug',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string|max:255',
            'logo' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'is_danob_own' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $disk = config('filesystems.product_images_disk', 'public');
        $file = $request->file('logo');
        $uploaded = null;

        // Precedence: uploaded file wins > remove flag > plain logo_url string.
        if ($file === null && $request->boolean('remove_logo')) {
            $validated['logo_url'] = null;
        }

        unset($validated['logo']);

        try {
            DB::transaction(function () use ($validated, $disk, $file, &$uploaded): void {
                $brand = Brand::create($validated);

                if ($file) {
                    $path = $this->storeImageOrFail($file, 'brands/'.$brand->id, $disk, 'logo');
                    $uploaded = ['disk' => $disk, 'path' => $path];
                    $brand->logo_url = $this->storageUrl($disk, $path);
                    $brand->save();
                }
            });
        } catch (\Throwable $e) {
            // Transaction rolled back (no orphan row) — drop the stored file too,
            // so a failure can never leave an orphan file behind either.
            if ($uploaded !== null) {
                Storage::disk($uploaded['disk'])->delete($uploaded['path']);
            }
            throw $e;
        }

        return redirect()->route('admin.brands.index');
    }

    public function edit(Brand $brand)
    {
        return Inertia::render('Admin/Brands/Edit', [
            'brand' => $brand,
        ]);
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:brands,slug,'.$brand->id,
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string|max:255',
            'logo' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_logo' => 'nullable|boolean',
            'is_danob_own' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $disk = config('filesystems.product_images_disk', 'public');
        $file = $request->file('logo');
        $oldUrl = $brand->logo_url;
        $uploaded = null;

        unset($validated['logo'], $validated['remove_logo']);

        // Precedence: a new file wins over the remove flag.
        if ($file === null && $request->boolean('remove_logo')) {
            $validated['logo_url'] = null;
        }

        try {
            DB::transaction(function () use ($validated, $disk, $file, $brand, &$uploaded): void {
                if ($file) {
                    // Store the new file first: if storage rejects the write the
                    // ValidationException rolls back before any row change, so the
                    // row and the old file are left untouched.
                    $path = $this->storeImageOrFail($file, 'brands/'.$brand->id, $disk, 'logo');
                    $uploaded = ['disk' => $disk, 'path' => $path];
                    $validated['logo_url'] = $this->storageUrl($disk, $path);
                }

                $brand->update($validated);
            });
        } catch (\Throwable $e) {
            // Swap never committed — remove the freshly stored file so no
            // orphan file remains next to the unchanged row.
            if ($uploaded !== null) {
                Storage::disk($uploaded['disk'])->delete($uploaded['path']);
            }
            throw $e;
        }

        // Swap committed: drop the replaced/removed file, but only when we own it
        // (external URLs such as https://example.com/logo.png are left alone).
        if ($oldUrl && $oldUrl !== $brand->logo_url && $this->isOwnedStorageUrl($oldUrl)) {
            $this->deleteOwnedFile($oldUrl);
        }

        return redirect()->route('admin.brands.index');
    }

    public function destroy(Brand $brand)
    {
        if ($brand->products()->exists()) {
            return redirect()->route('admin.brands.index')
                ->with('error', 'Cannot delete brand while products are assigned to it. Please reassign the products first.');
        }

        if ($brand->logo_url && $this->isOwnedStorageUrl($brand->logo_url)) {
            $this->deleteOwnedFile($brand->logo_url);
        }

        $brand->delete();

        return redirect()->route('admin.brands.index');
    }
}
