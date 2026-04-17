<?php

namespace App\Http\Requests\Members;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id', 'unique:members,user_id'],
            'application_id' => ['nullable', 'integer', 'exists:member_applications,id'],
            'member_type' => ['required', Rule::in(['member', 'bureau'])],
            'axis_id' => ['nullable', 'integer', 'exists:axes,id'],
            'education_level_id' => ['nullable', 'integer', 'exists:education_levels,id'],
            'member_number' => ['nullable', 'string', 'max:255', 'unique:members,member_number'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
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
            'is_student' => ['nullable', 'boolean'],
            'is_sympathizer' => ['nullable', 'boolean'],
            'is_from_antalaha' => ['nullable', 'boolean'],
            'status' => ['nullable', Rule::in(['pending', 'active', 'inactive', 'suspended', 'archived'])],
            'joined_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'function_ids' => ['nullable', 'array', 'required_if:member_type,bureau', 'min:1'],
            'function_ids.*' => ['integer', 'exists:functions,id'],
            'function_start_date' => ['nullable', 'date'],
            'function_end_date' => ['nullable', 'date', 'after_or_equal:function_start_date'],
            'function_notes' => ['nullable', 'string'],
        ];
    }
}
