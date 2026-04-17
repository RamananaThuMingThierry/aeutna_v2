<?php

namespace App\Http\Requests\MembershipCards;

use Illuminate\Foundation\Http\FormRequest;
class UpdateMembershipCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'issue_year' => ['nullable', 'integer', 'digits:4'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'status' => ['nullable', Rule::in(['active', 'expired', 'revoked'])],
            'pdf_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
