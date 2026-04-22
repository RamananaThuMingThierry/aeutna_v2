<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportAttendance extends Model
{
    use HasFactory;

    protected $table = 'report_attendances';

    protected $fillable = [
        'report_id',
        'member_id',
        'attendance_status',
        'check_in_at',
        'entry_method',
        'notes',
        'recorded_by',
        'marked_by',
    ];

    protected $casts = [
        'check_in_at' => 'datetime',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function marker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by');
    }
}
