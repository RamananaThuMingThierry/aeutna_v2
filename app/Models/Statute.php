<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Statute extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'version',
        'publication_status',
        'visibility',
        'validated_at',
        'effective_at',
        'is_current',
        'document_id',
    ];

    protected $casts = [
        'validated_at' => 'date',
        'effective_at' => 'date',
        'is_current' => 'boolean',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function titles(): HasMany
    {
        return $this->hasMany(StatuteTitle::class)->orderBy('sort_order')->orderBy('id');
    }
}
