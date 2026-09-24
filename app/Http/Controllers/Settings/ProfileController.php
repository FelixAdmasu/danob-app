<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Admin\Concerns\HandlesImageStorage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileAvatarUpdateRequest;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    use HandlesImageStorage;

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Update or remove the user's profile photo.
     *
     * Photos are stored on the same durable disk as catalog images (under
     * avatars/) so they survive production redeploys — see docs/storage.md.
     * Without a photo, every avatar in the UI falls back to the user's
     * name initials.
     */
    public function updateAvatar(ProfileAvatarUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $disk = (string) config('filesystems.product_images_disk', 'public');

        if (($validated['avatar'] ?? null) instanceof UploadedFile) {
            $path = $this->storeImageOrFail($validated['avatar'], 'avatars', $disk, 'avatar');

            if (is_string($user->avatar) && $user->avatar !== '') {
                $this->deleteOwnedFile($user->avatar);
            }

            $user->avatar = $this->storageUrl($disk, $path);
            $user->save();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile photo updated.')]);

            return to_route('profile.edit');
        }

        if (filter_var($validated['remove_avatar'] ?? false, FILTER_VALIDATE_BOOLEAN) && $user->avatar) {
            $this->deleteOwnedFile($user->avatar);
            $user->avatar = null;
            $user->save();

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile photo removed.')]);
        }

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
