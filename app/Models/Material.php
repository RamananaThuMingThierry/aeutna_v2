<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Material extends Model
{
    use HasFactory;

    protected $table = 'materials';

    protected $fillable = [
        'name',
        'reference',
        'category',
        'description',
        'quantity_total',
        'quantity_available',
        'condition_status',
        'status',
        'storage_location',
        'acquired_at',
        'acquisition_cost',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity_total' => 'integer',
        'quantity_available' => 'integer',
        'acquired_at' => 'date',
        'acquisition_cost' => 'decimal:2',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function loans(): HasMany
    {
        return $this->hasMany(MaterialLoan::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(MaterialMovement::class);
    }

    public function maintenances(): HasMany
    {
        return $this->hasMany(MaterialMaintenance::class);
    }
}
