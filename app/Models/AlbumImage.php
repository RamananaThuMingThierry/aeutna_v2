<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class AlbumImage extends Model
{
    use HasFactory;

    protected $table = 'album_images';

    protected $fillable = [
        'album_id',
        'image_url',
        'name',
        'description',
        'position',
        'status',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
