<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class MaterialMovement extends Model
{
    use HasFactory;

    protected $table = 'material_movements';

    protected $fillable = [
        'material_id',
        'material_loan_id',
        'movement_type',
        'quantity',
        'movement_date',
        'source_location',
        'destination_location',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'movement_date' => 'datetime',
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

    public function materialLoan(): BelongsTo
    {
        return $this->belongsTo(MaterialLoan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
