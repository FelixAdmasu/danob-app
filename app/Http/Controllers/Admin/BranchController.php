<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\HandlesImageStorage;
use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BranchController extends Controller
{
    use HandlesImageStorage;

    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Branch::latest();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        $branches = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Branches/Index', [
            'branches' => $branches,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Branches/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'sub_city' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'opening_hours' => 'nullable|string',
            'services' => 'nullable|string',
            'is_active' => 'boolean',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        unset($validated['image']);

        $branch = null;
        $uploaded = null;

        try {
            DB::transaction(function () use ($request, $validated, &$branch, &$uploaded): void {
                $branch = Branch::create($validated);

                $file = $request->file('image');
                if ($file) {
                    $disk = config('filesystems.product_images_disk', 'public');
                    $path = $this->storeImageOrFail($file, 'branches/'.$branch->id, $disk, 'image');
                    $uploaded = ['disk' => $disk, 'path' => $path];
                    $branch->update(['image_url' => $this->storageUrl($disk, $path)]);
                }
            });
        } catch (\Throwable $e) {
            // The transaction rolled back the row — the file must not outlive it.
            if ($uploaded !== null) {
                Storage::disk($uploaded['disk'])->delete($uploaded['path']);
            }
            throw $e;
        }

        return redirect()->route('admin.branches.index');
    }

    public function edit(Branch $branch)
    {
        return Inertia::render('Admin/Branches/Edit', [
            'branch' => $branch,
        ]);
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'sub_city' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'opening_hours' => 'nullable|string',
            'services' => 'nullable|string',
            'is_active' => 'boolean',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_image' => 'nullable|boolean',
        ]);

        $removeImage = (bool) ($validated['remove_image'] ?? false);
        unset($validated['image'], $validated['remove_image']);

        $oldUrl = $branch->image_url;
        $uploaded = null;

        try {
            DB::transaction(function () use ($request, $branch, $validated, $removeImage, &$uploaded): void {
                $branch->update($validated);

                $file = $request->file('image');
                if ($file) {
                    // Store FIRST: a storage failure must leave the row unchanged
                    // (storeImageOrFail throws ValidationException; rollback keeps
                    // the old image_url, the catch below removes the partial file).
                    $disk = config('filesystems.product_images_disk', 'public');
                    $path = $this->storeImageOrFail($file, 'branches/'.$branch->id, $disk, 'image');
                    $uploaded = ['disk' => $disk, 'path' => $path];
                    $branch->update(['image_url' => $this->storageUrl($disk, $path)]);
                } elseif ($removeImage) {
                    $branch->update(['image_url' => null]);
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
        if ($oldUrl && $oldUrl !== $branch->image_url && $this->isOwnedStorageUrl($oldUrl)) {
            $this->deleteOwnedFile($oldUrl);
        }

        return redirect()->route('admin.branches.index');
    }

    public function destroy(Branch $branch)
    {
        if ($branch->image_url && $this->isOwnedStorageUrl($branch->image_url)) {
            $this->deleteOwnedFile($branch->image_url);
        }

        $branch->delete();

        return redirect()->route('admin.branches.index');
    }
}
