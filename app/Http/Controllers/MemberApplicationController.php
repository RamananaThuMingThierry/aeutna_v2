<?php

namespace App\Http\Controllers;

use App\Http\Requests\MemberApplications\ReviewMemberApplicationRequest;
use App\Http\Requests\MemberApplications\StoreMemberApplicationRequest;
use App\Models\AnnualFee;
use App\Models\Axe;
use App\Models\EducationLevel;
use App\Models\FeePayment;
use App\Models\Member;
use App\Models\MemberApplication;
use App\Services\ActivityLogService;
use App\Services\MemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class MemberApplicationController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLogService,
        private MemberService $memberService
    ) {}

    private function resolveEncryptedApplicationId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant candidature invalide.'],
            ]);
        }

        return $id;
    }

    private function uploadPhoto(StoreMemberApplicationRequest $request): ?string
    {
        if (!$request->hasFile('photo')) {
            return null;
        }

        $directory = public_path('uploads/member-applications');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $file = $request->file('photo');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return 'uploads/member-applications/' . $filename;
    }

    public function publicMeta(): JsonResponse
    {
        $activeAnnualFee = AnnualFee::query()
            ->where('is_active', true)
            ->orderByDesc('year')
            ->first();

        return response()->json([
            'axes' => Axe::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'education_levels' => EducationLevel::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'active_annual_fee' => $activeAnnualFee,
            'payment_methods' => [
                ['value' => 'mvola', 'label' => 'MVola'],
                ['value' => 'orange_money', 'label' => 'Orange Money'],
                ['value' => 'airtel_money', 'label' => 'Airtel Money'],
            ],
        ]);
    }

    public function store(StoreMemberApplicationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $activeAnnualFee = AnnualFee::query()->where('is_active', true)->orderByDesc('year')->first();

        if (!$activeAnnualFee) {
            throw ValidationException::withMessages([
                'annual_fee' => ['Aucune cotisation annuelle active n est configuree.'],
            ]);
        }

        $application = MemberApplication::query()->create([
            ...$validated,
            'member_type' => $validated['member_type'] ?? 'member',
            'photo' => $this->uploadPhoto($request),
            'payment_amount' => $activeAnnualFee->amount,
            'payment_date' => $validated['payment_date'] ?? now()->toDateString(),
            'status' => 'submitted',
        ]);

        return response()->json([
            'message' => 'Votre demande d adhesion a ete envoyee. Elle sera verifiee par l administration.',
            'application' => $application,
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = MemberApplication::query()
            ->with(['axis:id,name', 'educationLevel:id,name', 'reviewer:id,name'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json($query->get());
    }

    public function show(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedApplicationId($encryptedId);

        return response()->json([
            'application' => MemberApplication::query()
                ->with(['axis:id,name', 'educationLevel:id,name', 'reviewer:id,name'])
                ->findOrFail($id),
        ]);
    }

    public function review(ReviewMemberApplicationRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedApplicationId($encryptedId);
        $validated = $request->validated();

        $application = DB::transaction(function () use ($request, $validated, $id) {
            $application = MemberApplication::query()->lockForUpdate()->findOrFail($id);

            $application->fill([
                'status' => $validated['status'],
                'admin_comment' => $validated['admin_comment'] ?? null,
                'reviewed_by' => $request->user()?->id,
                'reviewed_at' => now(),
            ]);
            $application->save();

            if ($validated['status'] === 'approved') {
                $member = Member::query()->where('application_id', $application->id)->first();

                if (!$member) {
                    $member = $this->memberService->createMember([
                        'application_id' => $application->id,
                        'member_type' => $application->member_type ?: 'member',
                        'axis_id' => $application->axis_id,
                        'education_level_id' => $application->education_level_id,
                        'member_number' => $this->memberService->getNextMemberNumber(),
                        'first_name' => $application->first_name,
                        'last_name' => $application->last_name,
                        'gender' => $application->gender,
                        'cin' => $application->cin,
                        'facebook' => $application->facebook,
                        'birth_date' => $application->birth_date,
                        'birth_place' => $application->birth_place,
                        'photo' => $application->photo,
                        'email' => $application->email,
                        'phone' => $application->phone,
                        'alternative_phone' => $application->alternative_phone,
                        'address' => $application->address,
                        'city' => $application->city,
                        'institution_name' => $application->institution_name,
                        'field_of_study' => $application->field_of_study,
                        'is_student' => $application->is_student,
                        'is_sympathizer' => $application->is_sympathizer,
                        'is_from_antalaha' => true,
                        'status' => 'active',
                        'joined_at' => now()->toDateString(),
                        'notes' => 'Membre cree depuis une candidature publique validee.',
                    ]);
                }

                $activeAnnualFee = AnnualFee::query()->where('is_active', true)->orderByDesc('year')->first();

                if ($activeAnnualFee) {
                    FeePayment::query()->updateOrCreate(
                        ['member_id' => $member->id, 'annual_fee_id' => $activeAnnualFee->id],
                        [
                            'amount_due' => $application->payment_amount ?? $activeAnnualFee->amount,
                            'amount_paid' => $application->payment_amount ?? $activeAnnualFee->amount,
                            'payment_status' => 'paid',
                            'validation_status' => 'validated',
                            'payment_method' => $application->payment_method,
                            'reference' => $application->payment_reference,
                            'paid_at' => $application->payment_date ?? now()->toDateString(),
                            'validated_by' => $request->user()?->id,
                            'validated_at' => now(),
                            'notes' => 'Paiement valide depuis la candidature membre.',
                        ]
                    );
                }
            }

            return $application->fresh(['axis:id,name', 'educationLevel:id,name', 'reviewer:id,name']);
        });

        if ($application->email) {
            Mail::raw(
                $validated['status'] === 'approved'
                    ? 'Votre demande d adhesion AEUTNA a ete validee.'
                    : 'Votre demande d adhesion AEUTNA a ete mise a jour. Commentaire: ' . ($application->admin_comment ?: '-'),
                function ($message) use ($application) {
                    $message->to($application->email)
                        ->subject('AEUTNA - Suivi de votre demande d adhesion');
                }
            );
        }

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'La candidature a ete approuvee et le membre a ete cree.'
                : 'La candidature a ete mise a jour.',
            'application' => $application,
        ]);
    }
}
