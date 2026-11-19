<?php

namespace App\Http\Controllers;

use App\Models\AnnualFee;
use App\Models\FeePayment;
use App\Models\Member;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PublicFeePaymentController extends Controller
{
    public function searchMember(Request $request): JsonResponse
    {
        $request->validate([
            'member_number' => 'required|string',
        ]);

        $member = Member::query()
            ->where('member_number', $request->input('member_number'))
            ->where('status', 'active')
            ->first(['id', 'member_number', 'first_name', 'last_name', 'email']);

        if (!$member) {
            return response()->json(['message' => 'Membre non trouve ou inactif.'], 404);
        }

        $memberPayments = FeePayment::query()
            ->with('annualFee:id,year')
            ->where('member_id', $member->id)
            ->whereIn('validation_status', ['pending', 'validated'])
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->get();
        $latestPayment = $memberPayments->first();

        return response()->json([
            'member' => $member,
            'latest_payment' => $latestPayment ? [
                'year' => $latestPayment->annualFee?->year,
                'status' => $latestPayment->validation_status,
            ] : null,
            'paid_years' => $memberPayments->map(fn (FeePayment $payment) => $payment->annualFee?->year)->filter()->unique()->values(),
        ]);
    }

    public function getMeta(): JsonResponse
    {
        $annualFees = AnnualFee::query()
            ->where('is_active', true)
            ->orderByDesc('year')
            ->get(['id', 'year', 'amount', 'description']);

        return response()->json([
            'annual_fees' => $annualFees,
            'payment_methods' => [
                ['value' => 'mvola', 'label' => 'MVola'],
                ['value' => 'orange_money', 'label' => 'Orange Money'],
                ['value' => 'airtel_money', 'label' => 'Airtel Money'],
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'member_id' => 'required|integer|exists:members,id',
            'annual_fee_id' => 'required|integer|exists:annual_fees,id',
            'payment_method' => 'required|string',
            'reference' => 'nullable|string|max:255',
            'amount_paid' => 'required|numeric|min:0',
            'proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'notes' => 'nullable|string',
        ]);

        $member = Member::findOrFail($request->input('member_id'));
        $annualFee = AnnualFee::findOrFail($request->input('annual_fee_id'));

        // Check if already paid
        $existing = FeePayment::where('member_id', $member->id)
            ->where('annual_fee_id', $annualFee->id)
            ->whereIn('validation_status', ['pending', 'validated'])
            ->first();

        if ($existing) {
            if ($existing->validation_status === 'validated') {
                return response()->json(['message' => 'Vous avez deja regle votre cotisation pour cette annee.'], 422);
            }
            return response()->json(['message' => 'Un paiement est deja en cours de validation pour cette annee.'], 422);
        }

        $proofPath = null;
        if ($request->hasFile('proof')) {
            $directory = public_path('uploads/fee-proofs');
            if (!File::exists($directory)) {
                File::makeDirectory($directory, 0755, true);
            }
            $file = $request->file('proof');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $file->move($directory, $filename);
            $proofPath = 'uploads/fee-proofs/' . $filename;
        }

        $payment = FeePayment::create([
            'member_id' => $member->id,
            'annual_fee_id' => $annualFee->id,
            'amount_due' => $annualFee->amount,
            'amount_paid' => $request->input('amount_paid'),
            'payment_method' => $request->input('payment_method'),
            'reference' => $request->input('reference'),
            'paid_at' => now()->toDateString(),
            'proof_path' => $proofPath,
            'notes' => $request->input('notes'),
            'payment_status' => 'paid',
            'validation_status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Votre paiement a ete enregistre et est en attente de validation par l\'administration.',
            'payment' => $payment
        ], 201);
    }
}
