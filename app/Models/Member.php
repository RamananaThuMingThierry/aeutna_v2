<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    public $table = 'members';

    public $fillable = [
        'user_id',
        'application_id',
        'member_type',
        'axis_id',
        'education_level_id',
        'member_number',
        'first_name',
        'last_name',
        'gender',
        'cin',
        'facebook',
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
        'is_from_antalaha',
        'status',
        'joined_at',
        'notes',
    ];

    protected $dates = [
        'birth_date',
        'joined_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'member_type' => 'string',
        'is_student' => 'boolean',
        'is_sympathizer' => 'boolean',
        'is_from_antalaha' => 'boolean',
        'birth_date' => 'date',
        'joined_at' => 'date',
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

    public function application(): BelongsTo
    {
        return $this->belongsTo(MemberApplication::class, 'application_id');
    }

    public function axe(): BelongsTo
    {
        return $this->belongsTo(Axe::class, 'axis_id');
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }

    public function memberFunctions(): HasMany
    {
        return $this->hasMany(MemberFunction::class);
    }

    public function currentMemberFunction(): HasOne
    {
        return $this->hasOne(MemberFunction::class)
            ->where('is_current', true)
            ->latestOfMany('start_date');
    }

    public function currentMemberFunctions(): HasMany
    {
        return $this->hasMany(MemberFunction::class)->where('is_current', true);
    }

    public function feePayments(): HasMany
    {
        return $this->hasMany(FeePayment::class);
    }

    public function membershipCards(): HasMany
    {
        return $this->hasMany(MembershipCard::class);
    }

    public function currentMembershipCard(): HasOne
    {
        return $this->hasOne(MembershipCard::class)
            ->where('status', 'active')
            ->latestOfMany('issued_at');
    }
}
