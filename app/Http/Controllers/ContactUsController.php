<?php

namespace App\Http\Controllers;

use App\Http\Requests\Contacts\StoreContactUsRequest;
use App\Models\ContactUs;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Throwable;

class ContactUsController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    public function store(StoreContactUsRequest $request): JsonResponse
    {
        try {
            $contact = ContactUs::query()->create($request->validated());

            $this->activityLogService->logSuccess(
                $request,
                'contact_us_store',
                'Message de contact enregistre avec succes.',
                $request->user(),
                ContactUs::class,
                $contact->id,
                201,
                [
                    'email' => $contact->email,
                    'subject' => $contact->subject,
                ]
            );

            return response()->json([
                'message' => 'Votre message a été envoye avec succes.',
                'contact' => $contact,
            ], 201);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'contact_us_store_validation_failed',
                'Echec de validation lors de l envoi du message de contact.',
                $request->user(),
                ContactUs::class,
                null,
                422,
                [
                    'email' => $request->input('email'),
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'contact_us_store_error',
                'Erreur lors de l enregistrement du message de contact.',
                $exception,
                $request->user(),
                ContactUs::class,
                null,
                500,
                [
                    'email' => $request->input('email'),
                    'subject' => $request->input('subject'),
                ]
            );

            throw $exception;
        }
    }
}
