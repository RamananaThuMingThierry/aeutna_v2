<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Axe extends Model
{
    use HasFactory;

    public $table = 'axes';

    public $fillable = [
        'name',
        'code',
        'description',
        'is_active'
    ];

    protected $dates = [
        'created_at',
        'updated_at'
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }
}
