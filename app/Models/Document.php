<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'document_type',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'visibility',
        'publication_status',
        'published_at',
        'uploaded_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    protected $appends = ['encrypted_id', 'file_url'];

    public function getEncryptedIdAttribute(): string
    {
        return Crypt::encryptString($this->id);
    }

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        return str_starts_with($this->file_path, '/')
            ? $this->file_path
            : '/' . ltrim($this->file_path, '/');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function statutes(): HasMany
    {
        return $this->hasMany(Statute::class);
    }
}
