<?php

namespace App\Services;

use App\Interfaces\FeePaymentInterface;
use App\Models\AnnualFee;
use App\Models\FeePayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FeePaymentService
{
    public function __construct(private FeePaymentInterface $feePaymentRepository) {}

    public function getAllFeePayments(
        string|array|null $keys = null,
        mixed $values = null,
        array $fields = ['*'],
        array $relations = [],
        ?int $paginate = null,
        array $orderBy = ['id' => 'desc']
    ) {
        return $this->feePaymentRepository->getAll($keys, $values, $fields, $relations, $paginate, $orderBy);
    }

    public function getByIdFeePayment(int|string|null $id, array $fields = ['*'], array $relations = []): ?FeePayment
    {
        return $this->feePaymentRepository->getById($id, $fields, $relations);
    }

    public function createFeePayment(array $data): ?FeePayment
    {
        return DB::transaction(function () use ($data) {
            $data = $this->prepareFeePaymentData($data);
            return $this->feePaymentRepository->create($data);
        });
    }

    public function updateFeePayment(FeePayment $feePayment, array $data): ?FeePayment
    {
        return DB::transaction(function () use ($feePayment, $data) {
            if (in_array($feePayment->validation_status, ['validated', 'cancelled'], true)) {
                throw ValidationException::withMessages([
                    'fee_payment' => ['Cette cotisation ne peut plus etre modifiee.'],
                ]);
            }

            $data = $this->prepareFeePaymentData($data, $feePayment);
            return $this->feePaymentRepository->update($feePayment, $data);
        });
    }

    public function cancelFeePayment(FeePayment $feePayment, ?int $cancelledBy, ?string $reason = null): ?FeePayment
    {
        if ($feePayment->validation_status === 'validated') {
            throw ValidationException::withMessages([
                'fee_payment' => ['Cette cotisation validee ne peut pas etre annulee.'],
            ]);
        }

        if ($feePayment->validation_status === 'cancelled') {
            throw ValidationException::withMessages([
                'fee_payment' => ['Cette cotisation est deja annulee.'],
            ]);
        }

        return $this->feePaymentRepository->update($feePayment, [
            'payment_status' => 'cancelled',
            'validation_status' => 'cancelled',
            'cancelled_by' => $cancelledBy,
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
            'validated_by' => null,
            'validated_at' => null,
        ]);
    }

    public function validateFeePayment(FeePayment $feePayment, ?int $validatedBy): ?FeePayment
    {
        if ($feePayment->payment_status === 'cancelled' || $feePayment->validation_status === 'cancelled') {
            return $feePayment;
        }

        if ((float) $feePayment->amount_paid < (float) $feePayment->amount_due) {
            throw ValidationException::withMessages([
                'amount_paid' => ['Le montant paye doit etre superieur ou egal au montant du pour valider cette cotisation.'],
            ]);
        }

        $paymentStatus = $this->resolvePaymentStatus((float) $feePayment->amount_due, (float) $feePayment->amount_paid);

        return $this->feePaymentRepository->update($feePayment, [
            'payment_status' => $paymentStatus,
            'validation_status' => 'validated',
            'validated_by' => $validatedBy,
            'validated_at' => now(),
        ]);
    }

    public function deleteFeePayment(FeePayment $feePayment): void
    {
        $this->feePaymentRepository->delete($feePayment);
    }

    private function prepareFeePaymentData(array $data, ?FeePayment $existing = null): array
    {
        $data = $this->normalizeLegacyStatuses($data, $existing);

        if (!isset($data['amount_due']) && isset($data['annual_fee_id'])) {
            $data['amount_due'] = (float) AnnualFee::query()->findOrFail($data['annual_fee_id'])->amount;
        }

        if (!isset($data['amount_due']) && $existing) {
            $data['amount_due'] = (float) $existing->amount_due;
        }

        if (!isset($data['amount_paid']) && $existing) {
            $data['amount_paid'] = (float) $existing->amount_paid;
        }

        $data['amount_due'] = (float) ($data['amount_due'] ?? 0);
        $data['amount_paid'] = (float) ($data['amount_paid'] ?? 0);

        if (($data['payment_status'] ?? $existing?->payment_status) !== 'cancelled') {
            $data['payment_status'] = $this->resolvePaymentStatus($data['amount_due'], $data['amount_paid']);
        }

        if (($data['validation_status'] ?? $existing?->validation_status) !== 'cancelled') {
            $data['validation_status'] = $this->resolveValidationStatus($data, $existing);
        }

        if (($data['validation_status'] ?? null) !== 'validated') {
            $data['validated_by'] = null;
            $data['validated_at'] = null;
        } else {
            $data['validated_at'] = $data['validated_at'] ?? $existing?->validated_at ?? now();
        }

        return $data;
    }

    private function normalizeLegacyStatuses(array $data, ?FeePayment $existing = null): array
    {
        if (!array_key_exists('status', $data)) {
            return $data;
        }

        $status = $data['status'];
        unset($data['status']);

        if (!isset($data['payment_status'])) {
            if (in_array($status, ['unpaid', 'partial', 'paid', 'cancelled'], true)) {
                $data['payment_status'] = $status;
            } elseif ($status === 'pending_validation') {
                $data['payment_status'] = $existing?->payment_status ?? 'unpaid';
            } elseif ($status === 'validated') {
                $data['payment_status'] = $existing?->payment_status ?? $this->resolvePaymentStatus(
                    (float) ($data['amount_due'] ?? $existing?->amount_due ?? 0),
                    (float) ($data['amount_paid'] ?? $existing?->amount_paid ?? 0)
                );
            }
        }

        if (!isset($data['validation_status'])) {
            $data['validation_status'] = match ($status) {
                'cancelled' => 'cancelled',
                'validated' => 'validated',
                default => $existing?->validation_status ?? 'pending',
            };
        }

        return $data;
    }

    private function resolvePaymentStatus(float $amountDue, float $amountPaid): string
    {
        if ($amountPaid <= 0) {
            return 'unpaid';
        }

        if ($amountPaid >= $amountDue) {
            return 'paid';
        }

        return 'partial';
    }

    private function resolveValidationStatus(array $data, ?FeePayment $existing = null): string
    {
        if (($data['validated_by'] ?? $existing?->validated_by)) {
            return 'validated';
        }

        if (($data['validated_at'] ?? $existing?->validated_at)) {
            return 'validated';
        }

        return 'pending';
    }
}
