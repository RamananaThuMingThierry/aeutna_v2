<?php

namespace App\Http\Controllers;

use App\Http\Requests\CashTransactions\StoreCashTransactionRequest;
use App\Http\Requests\CashTransactions\UpdateCashTransactionRequest;
use App\Services\CashTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CashTransactionController extends Controller
{
    public function __construct(private CashTransactionService $cashTransactionService) {}

    private function resolveEncryptedCashTransactionId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant transaction caisse invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        foreach (['transaction_type', 'source_type', 'category'] as $field) {
            if ($request->filled($field)) {
                $keys[] = $field;
                $values[] = $request->string($field)->toString();
            }
        }

        $transactions = $this->cashTransactionService->getAllCashTransactions(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            relations: ['activity', 'member', 'feePayment', 'creator', 'validator'],
            paginate: $request->integer('per_page')
        );

        return response()->json($transactions);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $cashTransaction = $this->cashTransactionService->getByIdCashTransaction(
            $this->resolveEncryptedCashTransactionId($encryptedId),
            ['*'],
            ['activity', 'member', 'feePayment', 'creator', 'validator']
        );

        return response()->json(['cash_transaction' => $cashTransaction]);
    }

    public function store(StoreCashTransactionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()?->id;

        $cashTransaction = $this->cashTransactionService->createCashTransaction($validated);

        return response()->json([
            'message' => 'Transaction caisse creee avec succes.',
            'cash_transaction' => $cashTransaction->fresh(['activity', 'member', 'feePayment', 'creator', 'validator']),
        ], 201);
    }

    public function update(UpdateCashTransactionRequest $request, string $encryptedId): JsonResponse
    {
        $cashTransaction = $this->cashTransactionService->getByIdCashTransaction($this->resolveEncryptedCashTransactionId($encryptedId));
        $cashTransaction = $this->cashTransactionService->updateCashTransaction($cashTransaction, $request->validated());

        return response()->json([
            'message' => 'Transaction caisse mise a jour avec succes.',
            'cash_transaction' => $cashTransaction->fresh(['activity', 'member', 'feePayment', 'creator', 'validator']),
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $cashTransaction = $this->cashTransactionService->getByIdCashTransaction($this->resolveEncryptedCashTransactionId($encryptedId));
        $this->cashTransactionService->deleteCashTransaction($cashTransaction);

        return response()->json([
            'message' => 'Transaction caisse supprimee avec succes.',
        ]);
    }
}