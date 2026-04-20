<?php

namespace App\Http\Requests\Contacts;

use Illuminate\Foundation\Http\FormRequest;

class ReplyContactUsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'response_subject' => ['required', 'string', 'max:255'],
            'response_message' => ['required', 'string', 'max:10000'],
        ];
    }

    public function messages(): array
    {
        return [
            'response_subject.required' => 'Le sujet de la reponse est requis.',
            'response_subject.max' => 'Le sujet de la reponse ne doit pas depasser 255 caracteres.',
            'response_message.required' => 'Le message de reponse est requis.',
            'response_message.max' => 'Le message de reponse ne doit pas depasser 10000 caracteres.',
        ];
    }
}
