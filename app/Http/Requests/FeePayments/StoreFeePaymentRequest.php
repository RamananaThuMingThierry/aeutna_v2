<?php

namespace App\Http\Requests\FeePayments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', 'exists:members,id'],
            'annual_fee_id' => ['required', 'integer', 'exists:annual_fees,id', Rule::unique('fee_payments')->where(fn ($query) => $query->where('member_id', $this->integer('member_id')))],
            'amount_due' => ['nullable', 'numeric', 'min:0'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['nullable', 'date'],
            'proof_path' => ['nullable', 'string', 'max:255'],
            'validated_by' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'payment_status' => ['nullable', Rule::in(['unpaid', 'partial', 'paid', 'cancelled'])],
            'validation_status' => ['nullable', Rule::in(['pending', 'validated', 'cancelled'])],
        ];
    }
}
