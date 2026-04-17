<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class ActivityLogController extends Controller
{
    public function __construct(private ActivityLogService $activityLogService) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $logs = $this->activityLogService->getAllActivityLogs(
                null,
                null,
                ['*'],
                ['user'],
                $request->integer('per_page'),
                ['id' => 'desc']
            );

            return response()->json($logs);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'activity_logs_index_error',
                'Erreur lors de la consultation des activity logs.',
                $exception,
                $request->user(),
                ActivityLog::class,
                null,
                500
            );

            throw $exception;
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        try {
            $log = $this->activityLogService->getByIdActivityLog($id, ['*'], ['user']);

            return response()->json([
                'activity_log' => $log,
            ]);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'activity_logs_show_error',
                'Erreur lors de la consultation d un activity log.',
                $exception,
                $request->user(),
                ActivityLog::class,
                (int) $id,
                500
            );

            throw $exception;
        }
    }
}
