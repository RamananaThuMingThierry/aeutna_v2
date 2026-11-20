<?php

namespace App\Http\Controllers;

use App\Models\Sponsor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SponsorController extends Controller
{
    private function resolveEncryptedSponsorId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant parrain invalide.'],
            ]);
        }

        return $id;
    }

    private function validationRules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'phone2' => ['nullable', 'string', 'max:30'],
            'note' => ['nullable', 'string', 'max:5000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_image' => ['nullable', 'boolean'],
        ];
    }

    private function saveImage(Request $request): ?string
    {
        if (!$request->hasFile('image')) {
            return null;
        }

        $directory = public_path('uploads/sponsors');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $file = $request->file('image');
        $filename = Str::uuid() . '.' . $file->extension();
        $file->move($directory, $filename);

        return 'uploads/sponsors/' . $filename;
    }

    private function deleteImage(?string $imageUrl): void
    {
        if (!$imageUrl || !preg_match('~^uploads/sponsors/[\w-]+\.(?:jpe?g|png|webp)$~i', $imageUrl)) {
            return;
        }

        $imagePath = public_path($imageUrl);

        if (File::exists($imagePath)) {
            File::delete($imagePath);
        }
    }

    public function index(): JsonResponse
    {
        return response()->json(
            Sponsor::query()->orderBy('last_name')->orderBy('first_name')->get()
        );
    }

    public function show(string $encryptedId): JsonResponse
    {
        $sponsor = Sponsor::query()->findOrFail($this->resolveEncryptedSponsorId($encryptedId));

        return response()->json(['sponsor' => $sponsor]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->validationRules());
        $validated['image_url'] = $this->saveImage($request);
        unset($validated['image'], $validated['remove_image']);

        $sponsor = Sponsor::query()->create($validated);

        return response()->json([
            'message' => 'Parrain ajouté à l’annuaire.',
            'sponsor' => $sponsor,
        ], 201);
    }

    public function update(Request $request, string $encryptedId): JsonResponse
    {
        $sponsor = Sponsor::query()->findOrFail($this->resolveEncryptedSponsorId($encryptedId));
        $validated = $request->validate($this->validationRules());
        $oldImage = $sponsor->image_url;
        $newImage = $this->saveImage($request);
        $removeImage = $request->boolean('remove_image');

        $validated['image_url'] = $newImage ?? ($removeImage ? null : $oldImage);
        unset($validated['image'], $validated['remove_image']);

        $sponsor->update($validated);

        if ($newImage || $removeImage) {
            $this->deleteImage($oldImage);
        }

        return response()->json([
            'message' => 'Fiche du parrain mise à jour.',
            'sponsor' => $sponsor->refresh(),
        ]);
    }

    public function destroy(string $encryptedId): JsonResponse
    {
        $sponsor = Sponsor::query()->findOrFail($this->resolveEncryptedSponsorId($encryptedId));
        $this->deleteImage($sponsor->image_url);
        $sponsor->delete();

        return response()->json(['message' => 'Fiche du parrain supprimée.']);
    }
}
