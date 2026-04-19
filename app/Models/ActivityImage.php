<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class ActivityImage extends Model
{
    use HasFactory;

    protected $table = 'activity_images';

    protected $fillable = [
        'activity_id',
        'image_path',
        'caption',
        'sort_order',
        'is_cover',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_cover' => 'boolean',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
