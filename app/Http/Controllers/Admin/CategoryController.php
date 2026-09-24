<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\HandlesImageStorage;
use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CategoryController extends Controller
{
    use HandlesImageStorage;

    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Category::withCount('products')->latest();

        if ($search) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $categories = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Categories/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // FormData sends '' for an emptied field; keep the historical null.
        if (array_key_exists('description', $validated) && $validated['description'] === '') {
            $validated['description'] = null;
        }
        unset($validated['image']);

        $category = null;
        $uploaded = null;

        try {
            DB::transaction(function () use ($request, $validated, &$category, &$uploaded): void {
                $category = Category::create($validated);

                $file = $request->file('image');
                if ($file) {
                    $disk = config('filesystems.product_images_disk', 'public');
                    $path = $this->storeImageOrFail($file, 'categories/'.$category->id, $disk, 'image');
                    $uploaded = ['disk' => $disk, 'path' => $path];
                    $category->update(['image_url' => $this->storageUrl($disk, $path)]);
                }
            });
        } catch (\Throwable $e) {
            // The transaction rolled back the row — the file must not outlive it.
            if ($uploaded !== null) {
                Storage::disk($uploaded['disk'])->delete($uploaded['path']);
            }
            throw $e;
        }

        return redirect()->route('admin.categories.index');
    }

    public function edit(Category $category)
    {
        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,'.$category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_image' => 'nullable|boolean',
        ]);

        // FormData sends '' for an emptied field; keep the historical null.
        if (array_key_exists('description', $validated) && $validated['description'] === '') {
            $validated['description'] = null;
        }

        $removeImage = (bool) ($validated['remove_image'] ?? false);
        unset($validated['image'], $validated['remove_image']);

        $oldUrl = $category->image_url;
        $uploaded = null;

        try {
            DB::transaction(function () use ($request, $category, $validated, $removeImage, &$uploaded): void {
                $category->update($validated);

                $file = $request->file('image');
                if ($file) {
                    // Store FIRST: a storage failure must leave the row unchanged
                    // (storeImageOrFail throws ValidationException; rollback keeps
                    // the old image_url, the catch below removes the partial file).
                    $disk = config('filesystems.product_images_disk', 'public');
                    $path = $this->storeImageOrFail($file, 'categories/'.$category->id, $disk, 'image');
                    $uploaded = ['disk' => $disk, 'path' => $path];
                    $category->update(['image_url' => $this->storageUrl($disk, $path)]);
                } elseif ($removeImage) {
                    $category->update(['image_url' => null]);
                }
            });
        } catch (\Throwable $e) {
            // Transaction rolled back (old row state intact) — drop the new file.
            if ($uploaded !== null) {
                Storage::disk($uploaded['disk'])->delete($uploaded['path']);
            }
            throw $e;
        }

        // New state committed: retire the old file, but only if we own it.
        if ($oldUrl && $oldUrl !== $category->image_url && $this->isOwnedStorageUrl($oldUrl)) {
            $this->deleteOwnedFile($oldUrl);
        }

        return redirect()->route('admin.categories.index');
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return redirect()->route('admin.categories.index')
                ->with('error', 'Cannot delete category while products are assigned to it. Please reassign the products first.');
        }

        if ($category->image_url && $this->isOwnedStorageUrl($category->image_url)) {
            $this->deleteOwnedFile($category->image_url);
        }

        $category->delete();

        return redirect()->route('admin.categories.index');
    }
}
