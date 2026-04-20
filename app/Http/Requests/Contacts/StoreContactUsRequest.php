<?php

namespace App\Http\Requests\Contacts;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactUsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est requis.',
            'name.max' => 'Le nom ne doit pas depasser 255 caracteres.',
            'email.required' => 'L adresse email est requise.',
            'email.email' => 'L adresse email doit etre valide.',
            'email.max' => 'L adresse email ne doit pas depasser 255 caracteres.',
            'phone.max' => 'Le telephone ne doit pas depasser 30 caracteres.',
            'subject.required' => 'Le sujet est requis.',
            'subject.max' => 'Le sujet ne doit pas depasser 255 caracteres.',
            'message.required' => 'Le message est requis.',
            'message.max' => 'Le message ne doit pas depasser 5000 caracteres.',
        ];
    }
}
