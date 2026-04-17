<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class EducationLevel extends Model
{
    public $table = 'education_levels';

    public $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }
}
