<?php

namespace App\Http\Requests\GroupMessages;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreGroupMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'audience_type' => ['required', Rule::in(['all', 'member', 'bureau'])],
            'section' => ['nullable', 'string', 'max:100'],
            'axis_id' => ['nullable', 'integer', 'exists:axes,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:5000'],
        ];
    }
}
