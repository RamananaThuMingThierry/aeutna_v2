<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class MaterialLoan extends Model
{
    use HasFactory;

    protected $table = 'material_loans';

    protected $fillable = [
        'material_id',
        'member_id',
        'quantity',
        'loaned_at',
        'expected_return_at',
        'returned_at',
        'status',
        'notes',
        'approved_by',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'loaned_at' => 'datetime',
        'expected_return_at' => 'datetime',
        'returned_at' => 'datetime',
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

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(MaterialMovement::class);
    }
}
