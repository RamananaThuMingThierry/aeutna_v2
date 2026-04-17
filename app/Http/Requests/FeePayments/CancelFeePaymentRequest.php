<?php

namespace App\Http\Requests\FeePayments;

use Illuminate\Foundation\Http\FormRequest;

class CancelFeePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string'],
        ];
    }
}
