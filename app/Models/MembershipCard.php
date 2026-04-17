<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class MembershipCard extends Model
{
    use HasFactory;

    public $table = 'membership_cards';

    public $fillable = [
        'member_id',
        'card_number',
        'qr_code',
        'issue_year',
        'issued_at',
        'expires_at',
        'status',
        'pdf_path',
    ];

    protected $casts = [
        'issue_year' => 'integer',
        'issued_at' => 'date',
        'expires_at' => 'date',
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
}
