<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'report_type' => ['required', Rule::in(['bureau_meeting', 'general_meeting', 'gathering', 'celebration', 'event', 'other'])],
            'report_date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'agenda' => ['nullable', 'string'],
            'content' => ['required', 'string'],
            'decisions_summary' => ['nullable', 'string'],
            'is_confidential' => ['nullable', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'validated', 'archived'])],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['integer', 'exists:members,id'],
            'scanned_entries' => ['nullable', 'array'],
            'scanned_entries.*.member_id' => ['required', 'integer', 'exists:members,id'],
            'scanned_entries.*.check_in_at' => ['nullable', 'date'],
        ];
    }
}
