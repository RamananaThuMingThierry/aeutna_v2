<?php

namespace App\Http\Controllers;

use App\Http\Requests\Contacts\ReplyContactUsRequest;
use App\Mail\ContactUsReplyMail;
use App\Models\ContactUs;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class ContactAdminController extends Controller
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    private function resolveEncryptedContactId(string $encryptedId): int
    {
        $id = decrypt_to_int_or_null($encryptedId);

        if (is_null($id)) {
            throw ValidationException::withMessages([
                'encrypted_id' => ['Identifiant contact invalide.'],
            ]);
        }

        return $id;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $contacts = ContactUs::query()
                ->with(['responder:id,name,email'])
                ->latest()
                ->get();

            return response()->json($contacts);
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'contacts_index_error',
                'Erreur lors de la consultation des messages de contact.',
                $exception,
                $request->user(),
                ContactUs::class,
                null,
                500
            );

            throw $exception;
        }
    }

    public function show(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedContactId($encryptedId);
            $contact = ContactUs::query()
                ->with(['responder:id,name,email'])
                ->findOrFail($id);

            return response()->json([
                'contact' => $contact,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'contacts_show_validation_failed',
                'Echec de validation lors de la consultation d un message de contact.',
                $request->user(),
                ContactUs::class,
                null,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'contacts_show_error',
                'Erreur lors de la consultation d un message de contact.',
                $exception,
                $request->user(),
                ContactUs::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }

    public function reply(ReplyContactUsRequest $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedContactId($encryptedId);
            $contact = ContactUs::query()->findOrFail($id);
            $validated = $request->validated();

            $contact->fill([
                'response_subject' => $validated['response_subject'],
                'response_message' => $validated['response_message'],
                'responded_at' => now(),
                'responded_by' => $request->user()?->id,
            ]);
            $contact->save();

            Mail::to($contact->email)->send(new ContactUsReplyMail($contact, $validated['response_message']));

            $contact->load(['responder:id,name,email']);

            $this->activityLogService->logSuccess(
                $request,
                'contacts_reply',
                'Reponse au message de contact envoyee avec succes.',
                $request->user(),
                ContactUs::class,
                $contact->id,
                200,
                [
                    'target_email' => $contact->email,
                    'response_subject' => $contact->response_subject,
                ]
            );

            return response()->json([
                'message' => 'Reponse envoyee avec succes.',
                'contact' => $contact,
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'contacts_reply_validation_failed',
                'Echec de validation lors de l envoi de la reponse contact.',
                $request->user(),
                ContactUs::class,
                $id,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'contacts_reply_error',
                'Erreur lors de l envoi de la reponse contact.',
                $exception,
                $request->user(),
                ContactUs::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                    'target_email' => $request->input('email'),
                ]
            );

            throw $exception;
        }
    }

    public function destroy(Request $request, string $encryptedId): JsonResponse
    {
        $id = null;

        try {
            $id = $this->resolveEncryptedContactId($encryptedId);
            $contact = ContactUs::query()->findOrFail($id);
            $targetEmail = $contact->email;

            $contact->delete();

            $this->activityLogService->logInfo(
                $request,
                'contacts_delete',
                'Suppression du message de contact reussie.',
                $request->user(),
                ContactUs::class,
                $id,
                200,
                [
                    'target_email' => $targetEmail,
                ]
            );

            return response()->json([
                'message' => 'Message de contact supprime avec succes.',
            ]);
        } catch (ValidationException $exception) {
            $this->activityLogService->logWarning(
                $request,
                'contacts_delete_validation_failed',
                'Echec de validation lors de la suppression d un message de contact.',
                $request->user(),
                ContactUs::class,
                null,
                422,
                [
                    'encrypted_id' => $encryptedId,
                    'errors' => $exception->errors(),
                ]
            );

            throw $exception;
        } catch (Throwable $exception) {
            $this->activityLogService->logError(
                $request,
                'contacts_delete_error',
                'Erreur lors de la suppression d un message de contact.',
                $exception,
                $request->user(),
                ContactUs::class,
                $id,
                500,
                [
                    'encrypted_id' => $encryptedId,
                ]
            );

            throw $exception;
        }
    }
}
