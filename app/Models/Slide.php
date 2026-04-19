<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Slide extends Model
{
    use HasFactory;

    public $table = 'slides';

    public $fillable = [
        'title',
        'subtitle',
        'image_url',
        'position',
        'is_active',
    ];

    protected $casts = [
        'position' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }
}
