<?php

namespace App\Http\Controllers;

use App\Http\Requests\CashCategories\StoreCashCategoryRequest;
use App\Http\Requests\CashCategories\UpdateCashCategoryRequest;
use App\Services\CashCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CashCategoryController extends Controller
{
    public function __construct(private CashCategoryService $cashCategoryService) {}

    private function resolveEncryptedCashCategoryId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant categorie caisse invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        if ($request->filled('type')) {
            $keys[] = 'type';
            $values[] = $request->string('type')->toString();
        }

        if ($request->filled('is_active')) {
            $keys[] = 'is_active';
            $values[] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        $categories = $this->cashCategoryService->getAllCashCategories(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            paginate: $request->integer('per_page')
        );

        return response()->json($categories);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $cashCategory = $this->cashCategoryService->getByIdCashCategory($this->resolveEncryptedCashCategoryId($encryptedId));

        return response()->json(['cash_category' => $cashCategory]);
    }

    public function store(StoreCashCategoryRequest $request): JsonResponse
    {
        $cashCategory = $this->cashCategoryService->createCashCategory($request->validated());

        return response()->json([
            'message' => 'Categorie caisse creee avec succes.',
            'cash_category' => $cashCategory,
        ], 201);
    }

    public function update(UpdateCashCategoryRequest $request, string $encryptedId): JsonResponse
    {
        $cashCategory = $this->cashCategoryService->getByIdCashCategory($this->resolveEncryptedCashCategoryId($encryptedId));
        $cashCategory = $this->cashCategoryService->updateCashCategory($cashCategory, $request->validated());

        return response()->json([
            'message' => 'Categorie caisse mise a jour avec succes.',
            'cash_category' => $cashCategory,
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $cashCategory = $this->cashCategoryService->getByIdCashCategory($this->resolveEncryptedCashCategoryId($encryptedId));
        $this->cashCategoryService->deleteCashCategory($cashCategory);

        return response()->json([
            'message' => 'Categorie caisse supprimee avec succes.',
        ]);
    }
}