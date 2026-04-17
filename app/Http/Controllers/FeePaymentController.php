<?php

namespace App\Http\Controllers;

use App\Http\Requests\FeePayments\CancelFeePaymentRequest;
use App\Http\Requests\FeePayments\StoreFeePaymentRequest;
use App\Http\Requests\FeePayments\UpdateFeePaymentRequest;
use App\Services\FeePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FeePaymentController extends Controller
{
    public function __construct(private FeePaymentService $feePaymentService) {}

    private function resolveEncryptedFeePaymentId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant cotisation invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        if ($request->filled('member_id')) {
            $keys[] = 'member_id';
            $values[] = $request->integer('member_id');
        }

        if ($request->filled('annual_fee_id')) {
            $keys[] = 'annual_fee_id';
            $values[] = $request->integer('annual_fee_id');
        }

        $payments = $this->feePaymentService->getAllFeePayments(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            fields: ['*'],
            relations: ['member', 'annualFee', 'validator', 'canceller'],
            paginate: $request->integer('per_page')
        );

        return response()->json($payments);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedFeePaymentId($encryptedId);
        $payment = $this->feePaymentService->getByIdFeePayment($id, ['*'], ['member', 'annualFee', 'validator', 'canceller']);

        return response()->json(['fee_payment' => $payment]);
    }

    public function store(StoreFeePaymentRequest $request): JsonResponse
    {
        $payment = $this->feePaymentService->createFeePayment($request->validated());

        return response()->json([
            'message' => 'Cotisation enregistree avec succes.',
            'fee_payment' => $payment->fresh(['member', 'annualFee', 'validator', 'canceller']),
        ], 201);
    }

    public function update(UpdateFeePaymentRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedFeePaymentId($encryptedId);
        $payment = $this->feePaymentService->getByIdFeePayment($id);
        $payment = $this->feePaymentService->updateFeePayment($payment, $request->validated());

        return response()->json([
            'message' => 'Cotisation mise a jour avec succes.',
            'fee_payment' => $payment->fresh(['member', 'annualFee', 'validator', 'canceller']),
        ]);
    }

    public function validatePayment(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedFeePaymentId($encryptedId);
        $payment = $this->feePaymentService->getByIdFeePayment($id);
        $payment = $this->feePaymentService->validateFeePayment($payment, $request->user()?->id);

        return response()->json([
            'message' => 'Cotisation validee avec succes.',
            'fee_payment' => $payment->fresh(['member', 'annualFee', 'validator', 'canceller']),
        ]);
    }

    public function cancel(CancelFeePaymentRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedFeePaymentId($encryptedId);
        $payment = $this->feePaymentService->getByIdFeePayment($id);
        $payment = $this->feePaymentService->cancelFeePayment($payment, $request->user()?->id, $request->input('reason'));

        return response()->json([
            'message' => 'Cotisation annulee avec succes.',
            'fee_payment' => $payment->fresh(['member', 'annualFee', 'validator', 'canceller']),
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedFeePaymentId($encryptedId);
        $payment = $this->feePaymentService->getByIdFeePayment($id);
        $this->feePaymentService->deleteFeePayment($payment);

        return response()->json([
            'message' => 'Cotisation supprimee avec succes.',
        ]);
    }
}
