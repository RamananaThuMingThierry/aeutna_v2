<?php

namespace App\Http\Requests\MemberApplications;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewMemberApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['approved', 'rejected', 'needs_correction'])],
            'admin_comment' => ['nullable', 'string'],
        ];
    }
}
