<?php

namespace App\Http\Requests\MemberApplications;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_type' => ['nullable', Rule::in(['member', 'bureau'])],
            'axis_id' => ['nullable', 'integer', 'exists:axes,id'],
            'education_level_id' => ['nullable', 'integer', 'exists:education_levels,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'cin' => ['nullable', 'string', 'max:12'],
            'facebook' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'alternative_phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'institution_name' => ['nullable', 'string', 'max:255'],
            'field_of_study' => ['nullable', 'string', 'max:255'],
            'is_student' => ['nullable', 'boolean'],
            'is_sympathizer' => ['nullable', 'boolean'],
            'payment_method' => ['required', Rule::in(['mvola', 'orange_money', 'airtel_money'])],
            'payment_reference' => ['required', 'string', 'max:255'],
            'payment_date' => ['nullable', 'date'],
        ];
    }
}
