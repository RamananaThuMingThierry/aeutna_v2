<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class StatuteArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'statute_title_id',
        'article_number',
        'title',
        'content',
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

    public function statuteTitle(): BelongsTo
    {
        return $this->belongsTo(StatuteTitle::class);
    }
}
