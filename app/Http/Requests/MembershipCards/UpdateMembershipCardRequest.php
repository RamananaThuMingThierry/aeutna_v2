<?php

namespace App\Http\Requests\MembershipCards;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateMembershipCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'issue_year' => ['nullable', 'integer', 'digits:4'],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:issued_at'],
            'status' => ['nullable', Rule::in(['active', 'expired', 'revoked'])],
        ];
    }
}
