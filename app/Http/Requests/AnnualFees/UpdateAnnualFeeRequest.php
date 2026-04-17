<?php

namespace App\Http\Requests\AnnualFees;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnnualFeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $annualFeeId = decrypt_to_int_or_null($this->route('encryptedId'));

        return [
            'year' => ['sometimes', 'required', 'integer', 'digits:4', Rule::unique('annual_fees', 'year')->ignore($annualFeeId)],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
