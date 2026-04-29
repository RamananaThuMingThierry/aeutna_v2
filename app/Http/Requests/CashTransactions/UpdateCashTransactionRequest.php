<?php

namespace App\Http\Requests\CashTransactions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCashTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transaction_type' => ['sometimes', 'required', Rule::in(['income', 'expense'])],
            'source_type' => ['nullable', Rule::in(['activity', 'donation', 'fee_payment', 'manual', 'other'])],
            'activity_id' => ['nullable', 'integer', 'exists:activities,id'],
            'member_id' => ['nullable', 'integer', 'exists:members,id'],
            'fee_payment_id' => ['nullable', 'integer', 'exists:fee_payments,id'],
            'label' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'transaction_date' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'validated_by' => ['nullable', 'integer', 'exists:users,id'],
            'validated_at' => ['nullable', 'date'],
        ];
    }
}