<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileAvatarUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * One endpoint serves both photo operations: attach a file to set (or
     * replace) the photo, or send remove_avatar=1 to clear it. When no photo
     * is set, the UI falls back to the user's name initials everywhere.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    public function rules(): array
    {
        return [
            'avatar' => ['required_without:remove_avatar', 'nullable', 'file', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'remove_avatar' => ['sometimes', 'boolean'],
        ];
    }
}
