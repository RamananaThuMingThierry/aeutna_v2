<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class MaterialImage extends Model
{
    use HasFactory;

    protected $table = 'material_images';

    protected $fillable = [
        'material_id',
        'image_url',
        'name',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
