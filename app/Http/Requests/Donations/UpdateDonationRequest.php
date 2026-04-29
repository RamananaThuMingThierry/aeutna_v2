<?php

namespace App\Http\Requests\Donations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id' => ['nullable', 'integer', 'exists:members,id'],
            'donor_name' => ['sometimes', 'required', 'string', 'max:255'],
            'donor_email' => ['nullable', 'email', 'max:255'],
            'donor_phone' => ['nullable', 'string', 'max:30'],
            'donation_type' => ['nullable', Rule::in(['money', 'material', 'service', 'other'])],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'donation_date' => ['nullable', 'date'],
            'reference' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_anonymous' => ['nullable', 'boolean'],
        ];
    }
}
