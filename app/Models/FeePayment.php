<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class FeePayment extends Model
{
    use HasFactory;

    public $table = 'fee_payments';

    public $fillable = [
        'member_id',
        'annual_fee_id',
        'amount_due',
        'amount_paid',
        'payment_status',
        'validation_status',
        'payment_method',
        'reference',
        'paid_at',
        'proof_path',
        'validated_by',
        'validated_at',
        'cancelled_by',
        'cancelled_at',
        'cancel_reason',
        'notes',
    ];

    protected $casts = [
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'paid_at' => 'date',
        'validated_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected $appends = ['encrypted_id', 'status'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function getStatusAttribute(): string
    {
        if ($this->payment_status === 'cancelled' || $this->validation_status === 'cancelled') {
            return 'cancelled';
        }

        if ($this->validation_status === 'pending') {
            return 'pending_validation';
        }

        return (string) ($this->payment_status ?: 'unpaid');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function annualFee(): BelongsTo
    {
        return $this->belongsTo(AnnualFee::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}
