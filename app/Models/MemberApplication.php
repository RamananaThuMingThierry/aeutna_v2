<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class MemberApplication extends Model
{
    use HasFactory;

    public $table = 'member_applications';

    public $fillable = [
        'user_id',
        'member_type',
        'axis_id',
        'education_level_id',
        'first_name',
        'last_name',
        'gender',
        'birth_date',
        'birth_place',
        'photo',
        'email',
        'phone',
        'alternative_phone',
        'address',
        'city',
        'institution_name',
        'field_of_study',
        'is_student',
        'is_sympathizer',
        'payment_method',
        'payment_reference',
        'payment_amount',
        'payment_proof_path',
        'payment_date',
        'status',
        'admin_comment',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'is_student' => 'boolean',
        'is_sympathizer' => 'boolean',
        'birth_date' => 'date',
        'payment_date' => 'date',
        'reviewed_at' => 'datetime',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
