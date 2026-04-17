<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnnualFees\StoreAnnualFeeRequest;
use App\Http\Requests\AnnualFees\UpdateAnnualFeeRequest;
use App\Services\AnnualFeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AnnualFeeController extends Controller
{
    public function __construct(private AnnualFeeService $annualFeeService) {}

    private function resolveEncryptedAnnualFeeId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant cotisation annuelle invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $fees = $this->annualFeeService->getAllAnnualFees(
            fields: ['*'],
            relations: ['feePayments'],
            paginate: $request->integer('per_page')
        );

        return response()->json($fees);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedAnnualFeeId($encryptedId);
        $annualFee = $this->annualFeeService->getByIdAnnualFee($id, ['*'], ['feePayments.member']);

        return response()->json(['annual_fee' => $annualFee]);
    }

    public function store(StoreAnnualFeeRequest $request): JsonResponse
    {
        $annualFee = $this->annualFeeService->createAnnualFee($request->validated());

        return response()->json([
            'message' => 'Cotisation annuelle creee avec succes.',
            'annual_fee' => $annualFee,
        ], 201);
    }

    public function update(UpdateAnnualFeeRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedAnnualFeeId($encryptedId);
        $annualFee = $this->annualFeeService->getByIdAnnualFee($id);
        $annualFee = $this->annualFeeService->updateAnnualFee($annualFee, $request->validated());

        return response()->json([
            'message' => 'Cotisation annuelle mise a jour avec succes.',
            'annual_fee' => $annualFee,
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedAnnualFeeId($encryptedId);
        $annualFee = $this->annualFeeService->getByIdAnnualFee($id);
        $this->annualFeeService->deleteAnnualFee($annualFee);

        return response()->json([
            'message' => 'Cotisation annuelle supprimee avec succes.',
        ]);
    }
}
