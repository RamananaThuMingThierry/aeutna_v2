<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class AnnualFee extends Model
{
    use HasFactory;

    public $table = 'annual_fees';

    public $fillable = [
        'year',
        'amount',
        'due_date',
        'description',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'is_active' => 'boolean',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function feePayments(): HasMany
    {
        return $this->hasMany(FeePayment::class);
    }
}
