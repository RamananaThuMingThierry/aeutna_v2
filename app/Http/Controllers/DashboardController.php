<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityLog;
use App\Models\AnnualFee;
use App\Models\ContactUs;
use App\Models\FeePayment;
use App\Models\Member;
use App\Models\MemberApplication;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $activeAnnualFee = AnnualFee::query()
            ->where('is_active', true)
            ->orderByDesc('year')
            ->first();

        $recentApplications = MemberApplication::query()
            ->with(['axis:id,name', 'educationLevel:id,name'])
            ->latest()
            ->limit(5)
            ->get();

        $recentContacts = ContactUs::query()
            ->latest()
            ->limit(5)
            ->get();

        $recentLogs = ActivityLog::query()
            ->with(['user:id,name,email'])
            ->latest()
            ->limit(6)
            ->get();

        $upcomingActivities = Activity::query()
            ->whereNotNull('starts_at')
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit(5)
            ->get(['id', 'title', 'location', 'starts_at', 'status']);

        $memberAnalytics = $this->buildMemberAnalytics();
        $paymentAnalytics = $this->buildPaymentAnalytics();
        $availableYears = collect([
            ...collect($memberAnalytics['yearly'])->pluck('year')->all(),
            ...collect($paymentAnalytics['yearly'])->pluck('year')->all(),
        ])
            ->filter()
            ->unique()
            ->sortDesc()
            ->values()
            ->all();

        return response()->json([
            'stats' => [
                'members_total' => Member::query()->count(),
                'members_active' => Member::query()->where('status', 'active')->count(),
                'bureau_members' => Member::query()->where('member_type', 'bureau')->count(),
                'users_total' => User::query()->count(),
                'activities_total' => Activity::query()->count(),
                'activities_published' => Activity::query()->where('status', 'published')->count(),
                'activities_upcoming' => Activity::query()
                    ->whereNotNull('starts_at')
                    ->where('starts_at', '>=', now())
                    ->count(),
                'contacts_total' => ContactUs::query()->count(),
                'contacts_pending' => ContactUs::query()->whereNull('responded_at')->count(),
                'contacts_answered' => ContactUs::query()->whereNotNull('responded_at')->count(),
                'applications_total' => MemberApplication::query()->count(),
                'applications_submitted' => MemberApplication::query()->where('status', 'submitted')->count(),
                'applications_approved' => MemberApplication::query()->where('status', 'approved')->count(),
                'applications_needs_correction' => MemberApplication::query()->where('status', 'needs_correction')->count(),
                'payments_total' => FeePayment::query()->count(),
                'payments_validated' => FeePayment::query()->where('validation_status', 'validated')->count(),
                'payments_pending' => FeePayment::query()->where('validation_status', 'pending')->count(),
                'activity_logs_total' => ActivityLog::query()->count(),
            ],
            'active_annual_fee' => $activeAnnualFee ? [
                'year' => $activeAnnualFee->year,
                'amount' => $activeAnnualFee->amount,
                'due_date' => optional($activeAnnualFee->due_date)->toDateString(),
                'description' => $activeAnnualFee->description,
            ] : null,
            'recent_applications' => $recentApplications,
            'recent_contacts' => $recentContacts,
            'recent_logs' => $recentLogs,
            'upcoming_activities' => $upcomingActivities,
            'analytics' => [
                'available_years' => $availableYears,
                'default_year' => $availableYears[0] ?? (int) now()->format('Y'),
                'members' => $memberAnalytics,
                'payments' => $paymentAnalytics,
            ],
            'generated_at' => now()->toISOString(),
            'viewer' => [
                'name' => $request->user()?->name,
                'email' => $request->user()?->email,
            ],
        ]);
    }

    private function buildMemberAnalytics(): array
    {
        $dateExpression = "COALESCE(joined_at, DATE(created_at))";

        $monthly = Member::query()
            ->selectRaw("YEAR($dateExpression) as year")
            ->selectRaw("MONTH($dateExpression) as month")
            ->selectRaw('COUNT(*) as total')
            ->whereNotNull(DB::raw($dateExpression))
            ->groupByRaw("YEAR($dateExpression), MONTH($dateExpression)")
            ->orderByRaw("YEAR($dateExpression)")
            ->orderByRaw("MONTH($dateExpression)")
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->year,
                'month' => (int) $row->month,
                'label' => sprintf('%02d/%d', $row->month, $row->year),
                'short_label' => sprintf('%02d', $row->month),
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        $yearly = Member::query()
            ->selectRaw("YEAR($dateExpression) as year")
            ->selectRaw('COUNT(*) as total')
            ->whereNotNull(DB::raw($dateExpression))
            ->groupByRaw("YEAR($dateExpression)")
            ->orderByRaw("YEAR($dateExpression)")
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->year,
                'label' => (string) $row->year,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        return [
            'monthly' => $monthly,
            'yearly' => $yearly,
        ];
    }

    private function buildPaymentAnalytics(): array
    {
        $dateExpression = "COALESCE(paid_at, DATE(created_at))";

        $baseQuery = FeePayment::query()
            ->where('validation_status', 'validated')
            ->whereNotNull(DB::raw($dateExpression));

        $monthly = (clone $baseQuery)
            ->selectRaw("YEAR($dateExpression) as year")
            ->selectRaw("MONTH($dateExpression) as month")
            ->selectRaw('COUNT(*) as total_payments')
            ->selectRaw('COALESCE(SUM(amount_paid), 0) as total_amount')
            ->groupByRaw("YEAR($dateExpression), MONTH($dateExpression)")
            ->orderByRaw("YEAR($dateExpression)")
            ->orderByRaw("MONTH($dateExpression)")
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->year,
                'month' => (int) $row->month,
                'label' => sprintf('%02d/%d', $row->month, $row->year),
                'short_label' => sprintf('%02d', $row->month),
                'total_payments' => (int) $row->total_payments,
                'total_amount' => (float) $row->total_amount,
            ])
            ->values()
            ->all();

        $yearly = (clone $baseQuery)
            ->selectRaw("YEAR($dateExpression) as year")
            ->selectRaw('COUNT(*) as total_payments')
            ->selectRaw('COALESCE(SUM(amount_paid), 0) as total_amount')
            ->groupByRaw("YEAR($dateExpression)")
            ->orderByRaw("YEAR($dateExpression)")
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->year,
                'label' => (string) $row->year,
                'total_payments' => (int) $row->total_payments,
                'total_amount' => (float) $row->total_amount,
            ])
            ->values()
            ->all();

        return [
            'monthly' => $monthly,
            'yearly' => $yearly,
        ];
    }
}
