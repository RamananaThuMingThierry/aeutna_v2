<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class ScanReportAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qr_value' => ['required', 'string', 'max:255'],
            'check_in_at' => ['nullable', 'date'],
        ];
    }
}
