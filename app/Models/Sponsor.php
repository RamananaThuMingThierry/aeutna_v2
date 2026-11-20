<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Sponsor extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'phone2',
        'note',
        'image_url',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }
}
