<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class StatuteTitle extends Model
{
    use HasFactory;

    protected $fillable = [
        'statute_id',
        'number',
        'heading',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function statute(): BelongsTo
    {
        return $this->belongsTo(Statute::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(StatuteArticle::class)->orderBy('sort_order')->orderBy('id');
    }
}
