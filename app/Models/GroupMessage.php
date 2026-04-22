<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class GroupMessage extends Model
{
    protected $fillable = [
        'sender_id',
        'title',
        'content',
        'target_type',
        'target_label',
        'target_id',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(GroupMessageRecipient::class);
    }
}
