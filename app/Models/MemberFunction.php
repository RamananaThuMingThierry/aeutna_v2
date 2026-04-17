<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class MemberFunction extends Model
{
    use HasFactory;

    public $table = 'member_functions';

    public $fillable = [
        'member_id',
        'function_id',
        'start_date',
        'end_date',
        'is_current',
        'notes',
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function function(): BelongsTo
    {
        return $this->belongsTo(Functions::class, 'function_id');
    }
}
