<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Functions extends Model
{
    use HasFactory;

    public $table = 'functions';

    public $fillable = [
        'name',
        'code',
        'description',
        'is_executive',
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

    public function memberFunctions(): HasMany
    {
        return $this->hasMany(MemberFunction::class, 'function_id');
    }
}
