<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Report extends Model
{
    use HasFactory;

    protected $table = 'reports';

    protected $fillable = [
        'title',
        'report_type',
        'report_date',
        'start_time',
        'end_time',
        'location',
        'subject',
        'agenda',
        'content',
        'decisions_summary',
        'is_confidential',
        'status',
        'written_by',
        'approved_by',
    ];

    protected $casts = [
        'report_date' => 'date',
        'is_confidential' => 'boolean',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function writer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'written_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(ReportAttendance::class)->latest('id');
    }
}
