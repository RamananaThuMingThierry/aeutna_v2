<?php

namespace App\Http\Controllers;

use App\Http\Requests\MaterialLoans\ReturnMaterialLoanRequest;
use App\Http\Requests\MaterialLoans\StoreMaterialLoanRequest;
use App\Http\Requests\MaterialLoans\UpdateMaterialLoanRequest;
use App\Services\MaterialLoanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MaterialLoanController extends Controller
{
    public function __construct(private MaterialLoanService $materialLoanService) {}

    private function resolveEncryptedMaterialLoanId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant pret invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        if ($request->filled('material_id')) {
            $keys[] = 'material_id';
            $values[] = $request->integer('material_id');
        }

        if ($request->filled('member_id')) {
            $keys[] = 'member_id';
            $values[] = $request->integer('member_id');
        }

        if ($request->filled('status')) {
            $keys[] = 'status';
            $values[] = $request->string('status')->toString();
        }

        $loans = $this->materialLoanService->getAllMaterialLoans(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            relations: ['material', 'member', 'approver', 'creator', 'movements'],
            paginate: $request->integer('per_page')
        );

        return response()->json($loans);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $loan = $this->materialLoanService->getByIdMaterialLoan(
            $this->resolveEncryptedMaterialLoanId($encryptedId),
            ['*'],
            ['material', 'member', 'approver', 'creator', 'movements']
        );

        return response()->json(['material_loan' => $loan]);
    }

    public function store(StoreMaterialLoanRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()?->id;

        $loan = $this->materialLoanService->createMaterialLoan($validated);

        return response()->json([
            'message' => 'Pret cree avec succes.',
            'material_loan' => $loan,
        ], 201);
    }

    public function update(UpdateMaterialLoanRequest $request, string $encryptedId): JsonResponse
    {
        $loan = $this->materialLoanService->getByIdMaterialLoan($this->resolveEncryptedMaterialLoanId($encryptedId));
        $loan = $this->materialLoanService->updateMaterialLoan($loan, $request->validated());

        return response()->json([
            'message' => 'Pret mis a jour avec succes.',
            'material_loan' => $loan,
        ]);
    }

    public function returnLoan(ReturnMaterialLoanRequest $request, string $encryptedId): JsonResponse
    {
        $loan = $this->materialLoanService->getByIdMaterialLoan($this->resolveEncryptedMaterialLoanId($encryptedId));
        $loan = $this->materialLoanService->returnMaterialLoan($loan, $request->input('returned_at'), $request->input('notes'));

        return response()->json([
            'message' => 'Pret retourne avec succes.',
            'material_loan' => $loan,
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $loan = $this->materialLoanService->getByIdMaterialLoan($this->resolveEncryptedMaterialLoanId($encryptedId));
        $this->materialLoanService->deleteMaterialLoan($loan);

        return response()->json([
            'message' => 'Pret supprime avec succes.',
        ]);
    }
}
