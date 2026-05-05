<?php

namespace App\Http\Controllers;

use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Requests\Documents\UpdateDocumentRequest;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DocumentController extends Controller
{
    private function resolveEncryptedDocumentId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant document invalide.'],
            ]);
        }

        return $id;
    }

    private function uploadFile(StoreDocumentRequest|UpdateDocumentRequest $request, ?string $currentPath = null): ?array
    {
        if (!$request->hasFile('file')) {
            return null;
        }

        if ($currentPath && str_starts_with($currentPath, 'uploads/documents/')) {
            $currentFile = public_path($currentPath);

            if (File::exists($currentFile)) {
                File::delete($currentFile);
            }
        }

        $directory = public_path('uploads/documents');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $mimeType = $file->getClientMimeType();
        $fileSize = $file->getSize();
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return [
            'file_name' => $originalName,
            'file_path' => 'uploads/documents/' . $filename,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $documents = Document::query()
            ->with('uploader:id,name,email')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($documents);
    }

    public function show(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedDocumentId($encryptedId);
        $document = Document::query()
            ->with('uploader:id,name,email')
            ->findOrFail($id);

        return response()->json([
            'document' => $document,
        ]);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $document = DB::transaction(function () use ($validated, $request) {
            $fileData = $this->uploadFile($request);

            return Document::query()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'document_type' => $validated['document_type'],
                'visibility' => $validated['visibility'],
                'publication_status' => $validated['publication_status'],
                'published_at' => ($validated['publication_status'] ?? null) === 'published'
                    ? ($validated['published_at'] ?? now())
                    : ($validated['published_at'] ?? null),
                'uploaded_by' => $request->user()?->id,
                'file_name' => $fileData['file_name'] ?? null,
                'file_path' => $fileData['file_path'] ?? null,
                'mime_type' => $fileData['mime_type'] ?? null,
                'file_size' => $fileData['file_size'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Document cree avec succes.',
            'document' => $document->fresh('uploader:id,name,email'),
        ], 201);
    }

    public function update(UpdateDocumentRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedDocumentId($encryptedId);
        $document = Document::query()->findOrFail($id);
        $validated = $request->validated();

        DB::transaction(function () use ($request, $validated, $document) {
            $payload = [
                'title' => $validated['title'] ?? $document->title,
                'description' => array_key_exists('description', $validated) ? $validated['description'] : $document->description,
                'document_type' => $validated['document_type'] ?? $document->document_type,
                'visibility' => $validated['visibility'] ?? $document->visibility,
                'publication_status' => $validated['publication_status'] ?? $document->publication_status,
                'published_at' => array_key_exists('published_at', $validated)
                    ? $validated['published_at']
                    : $document->published_at,
            ];

            if (($payload['publication_status'] ?? null) === 'published' && empty($payload['published_at'])) {
                $payload['published_at'] = now();
            }

            $fileData = $this->uploadFile($request, $document->file_path);

            if ($fileData) {
                $payload = array_merge($payload, $fileData);
            }

            $document->update($payload);
        });

        return response()->json([
            'message' => 'Document mis a jour avec succes.',
            'document' => $document->fresh('uploader:id,name,email'),
        ]);
    }

    public function destroy(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedDocumentId($encryptedId);
        $document = Document::query()->findOrFail($id);

        if ($document->file_path && str_starts_with($document->file_path, 'uploads/documents/')) {
            $file = public_path($document->file_path);

            if (File::exists($file)) {
                File::delete($file);
            }
        }

        $document->delete();

        return response()->json([
            'message' => 'Document supprime avec succes.',
        ]);
    }
}
