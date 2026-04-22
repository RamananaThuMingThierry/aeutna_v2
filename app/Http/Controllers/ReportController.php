<?php

namespace App\Http\Controllers;

use App\Http\Requests\Reports\StoreReportRequest;
use App\Http\Requests\Reports\UpdateReportRequest;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class ReportController extends Controller
{
    private function resolveEncryptedReportId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant rapport invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        $reports = Report::query()
            ->with(['writer:id,name,email,avatar', 'approver:id,name,email,avatar'])
            ->withCount('attendances')
            ->orderByDesc('report_date')
            ->orderByDesc('id')
            ->get();

        return response()->json($reports);
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedReportId($encryptedId);

        $report = Report::query()
            ->with([
                'writer:id,name,email,avatar',
                'approver:id,name,email,avatar',
                'attendances.member:id,first_name,last_name,member_type,photo,phone,alternative_phone',
                'attendances.marker:id,name,email,avatar',
                'attendances.recorder:id,name,email',
            ])
            ->withCount('attendances')
            ->findOrFail($id);

        return response()->json([
            'report' => $report,
        ]);
    }

    public function store(StoreReportRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $report = DB::transaction(function () use ($validated, $request) {
            $report = Report::query()->create([
                'title' => $validated['title'],
                'report_type' => $validated['report_type'],
                'report_date' => $validated['report_date'],
                'start_time' => $validated['start_time'] ?? null,
                'end_time' => $validated['end_time'] ?? null,
                'location' => $validated['location'] ?? null,
                'subject' => $validated['subject'] ?? null,
                'agenda' => $validated['agenda'] ?? null,
                'content' => $validated['content'],
                'decisions_summary' => $validated['decisions_summary'] ?? null,
                'is_confidential' => (bool) ($validated['is_confidential'] ?? true),
                'status' => $validated['status'],
                'written_by' => $request->user()?->id,
                'approved_by' => $validated['status'] === 'validated' ? $request->user()?->id : null,
            ]);

            $this->syncAttendances(
                $report,
                $validated['member_ids'] ?? [],
                $validated['scanned_entries'] ?? [],
                $request->user()?->id
            );

            return $report;
        });

        return response()->json([
            'message' => 'Rapport cree avec succes.',
            'report' => $this->loadReport($report->id),
        ], 201);
    }

    public function update(UpdateReportRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedReportId($encryptedId);
        $validated = $request->validated();

        $report = DB::transaction(function () use ($id, $validated, $request) {
            $report = Report::query()->findOrFail($id);

            $report->update([
                'title' => $validated['title'],
                'report_type' => $validated['report_type'],
                'report_date' => $validated['report_date'],
                'start_time' => $validated['start_time'] ?? null,
                'end_time' => $validated['end_time'] ?? null,
                'location' => $validated['location'] ?? null,
                'subject' => $validated['subject'] ?? null,
                'agenda' => $validated['agenda'] ?? null,
                'content' => $validated['content'],
                'decisions_summary' => $validated['decisions_summary'] ?? null,
                'is_confidential' => (bool) ($validated['is_confidential'] ?? true),
                'status' => $validated['status'],
                'approved_by' => $validated['status'] === 'validated'
                    ? ($report->approved_by ?: $request->user()?->id)
                    : null,
            ]);

            $this->syncAttendances(
                $report,
                $validated['member_ids'] ?? [],
                $validated['scanned_entries'] ?? [],
                $request->user()?->id
            );

            return $report;
        });

        return response()->json([
            'message' => 'Rapport mis a jour avec succes.',
            'report' => $this->loadReport($report->id),
        ]);
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedReportId($encryptedId);

        try {
            $report = Report::query()->findOrFail($id);
            $report->delete();

            return response()->json([
                'message' => 'Rapport supprime avec succes.',
            ]);
        } catch (Throwable $exception) {
            throw $exception;
        }
    }

    private function syncAttendances(Report $report, array $memberIds, array $scannedEntries, ?int $recordedBy): void
    {
        $report->attendances()->delete();

        if (empty($memberIds)) {
            return;
        }

        $scannedMap = collect($scannedEntries)
            ->filter(fn ($entry) => isset($entry['member_id']))
            ->mapWithKeys(fn ($entry) => [
                (int) $entry['member_id'] => [
                    'check_in_at' => $entry['check_in_at'] ?? now()->toISOString(),
                ],
            ]);

        $report->attendances()->createMany(
            collect($memberIds)
                ->unique()
                ->values()
                ->map(function ($memberId) use ($recordedBy, $scannedMap) {
                    $memberId = (int) $memberId;
                    $scanned = $scannedMap->get($memberId);

                    return [
                        'member_id' => $memberId,
                        'attendance_status' => 'present',
                        'check_in_at' => $scanned['check_in_at'] ?? null,
                        'entry_method' => $scanned ? 'qr_scan' : 'manual',
                        'recorded_by' => $recordedBy,
                        'marked_by' => $recordedBy,
                    ];
                })
                ->all()
        );
    }

    private function loadReport(int $id): Report
    {
        return Report::query()
            ->with([
                'writer:id,name,email,avatar',
                'approver:id,name,email,avatar',
                'attendances.member:id,first_name,last_name,member_type,photo,phone,alternative_phone',
                'attendances.marker:id,name,email,avatar',
            ])
            ->withCount('attendances')
            ->findOrFail($id);
    }
}
