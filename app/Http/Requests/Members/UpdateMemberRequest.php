<?php

namespace App\Http\Requests\Members;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        $memberId = decrypt_to_int_or_null($this->route('encryptedId'));

        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id', Rule::unique('members', 'user_id')->ignore($memberId)],
            'application_id' => ['nullable', 'integer', 'exists:member_applications,id'],
            'member_type' => ['sometimes', Rule::in(['member', 'bureau'])],
            'axis_id' => ['nullable', 'integer', 'exists:axes,id'],
            'education_level_id' => ['nullable', 'integer', 'exists:education_levels,id'],
            'member_number' => ['nullable', 'string', 'max:255', Rule::unique('members', 'member_number')->ignore($memberId)],
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'cin' => ['nullable', 'string', 'max:12', 'min:12'],
            'facebook' => ['nullable', 'string'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'alternative_phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'institution_name' => ['nullable', 'string', 'max:255'],
            'field_of_study' => ['nullable', 'string', 'max:255'],
            'is_student' => ['sometimes', 'boolean'],
            'is_sympathizer' => ['sometimes', 'boolean'],
            'is_from_antalaha' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'inactive', 'suspended', 'archived'])],
            'joined_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'function_ids' => ['nullable', 'array'],
            'function_ids.*' => ['integer', 'exists:functions,id'],
            'function_start_date' => ['nullable', 'date'],
            'function_end_date' => ['nullable', 'date', 'after_or_equal:function_start_date'],
            'function_notes' => ['nullable', 'string'],
        ];
    }
}
