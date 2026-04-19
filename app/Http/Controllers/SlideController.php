<?php

namespace App\Http\Controllers;

use App\Http\Requests\Slides\StoreSlideRequest;
use App\Http\Requests\Slides\UpdateSlideRequest;
use App\Models\Slide;
use App\Services\SlideService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SlideController extends Controller
{
    public function __construct(private SlideService $slideService) {}

    private function resolveEncryptedSlideId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant slide invalide.'],
            ]);
        }

        return $id;
    }

    private function uploadImage(StoreSlideRequest|UpdateSlideRequest $request, ?string $currentImage = null): ?string
    {
        if (!$request->hasFile('image')) {
            return $currentImage;
        }

        if ($currentImage && str_starts_with($currentImage, 'uploads/slides/')) {
            $currentImagePath = public_path($currentImage);

            if (File::exists($currentImagePath)) {
                File::delete($currentImagePath);
            }
        }

        $directory = public_path('uploads/slides');

        if (!File::exists($directory)) {
            File::makeDirectory($directory, 0755, true);
        }

        $file = $request->file('image');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move($directory, $filename);

        return 'uploads/slides/' . $filename;
    }

    public function index(Request $request): JsonResponse
    {
        $keys = [];
        $values = [];

        if ($request->filled('is_active')) {
            $keys[] = 'is_active';
            $values[] = $request->boolean('is_active');
        }

        $slides = $this->slideService->getAllSlides(
            keys: !empty($keys) ? $keys : null,
            values: !empty($values) ? $values : null,
            paginate: $request->integer('per_page')
        );

        return response()->json($slides);
    }

    public function show(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedSlideId($encryptedId);
        $slide = $this->slideService->getByIdSlide($id);

        return response()->json([
            'slide' => $slide,
        ]);
    }

    public function store(StoreSlideRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['image_url'] = $this->uploadImage($request);
        $slide = $this->slideService->createSlide($validated);

        return response()->json([
            'message' => 'Slide enregistre avec succes.',
            'slide' => $slide,
        ], 201);
    }

    public function update(UpdateSlideRequest $request, string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedSlideId($encryptedId);
        $slide = $this->slideService->getByIdSlide($id);
        $validated = $request->validated();
        $validated['image_url'] = $this->uploadImage($request, $slide->image_url);
        unset($validated['image']);
        $slide = $this->slideService->updateSlide($slide, $validated);

        return response()->json([
            'message' => 'Slide mis a jour avec succes.',
            'slide' => $slide,
        ]);
    }

    public function destroy(string $encryptedId): JsonResponse
    {
        $id = $this->resolveEncryptedSlideId($encryptedId);
        $slide = $this->slideService->getByIdSlide($id);

        if ($slide instanceof Slide && $slide->image_url && str_starts_with($slide->image_url, 'uploads/slides/')) {
            $imagePath = public_path($slide->image_url);

            if (File::exists($imagePath)) {
                File::delete($imagePath);
            }
        }

        $this->slideService->deleteSlide($slide);

        return response()->json([
            'message' => 'Slide supprime avec succes.',
        ]);
    }
}
