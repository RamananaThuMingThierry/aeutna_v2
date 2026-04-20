<?php

namespace App\Mail;

use App\Models\ContactUs;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactUsReplyMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public ContactUs $contact,
        public string $responseMessage
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->contact->response_subject ?: ('Re: ' . $this->contact->subject),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-reply',
        );
    }
}
