<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractCreateController;
use Flarum\Http\RequestUtil;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;
use huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer;
use Illuminate\Support\Arr;
use Flarum\Foundation\ValidationException;
use Illuminate\Contracts\Translation\Translator;

class CreateNotificationController extends AbstractCreateController
{
    public $serializer = NotificationTypeSerializer::class;

    protected $notificationHub;
    protected $translator;

    public function __construct(NotificationHub $notificationHub, Translator $translator)
    {
        $this->notificationHub = $notificationHub;
        $this->translator = $translator;
    }

    protected function data(Request $request, Document $document)
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertCan('huseyinfiliz-notificationhub.send-all');

        $data = $request->getParsedBody();
        $attributes = Arr::get($data, 'data.attributes', []);

        $name = trim((string) Arr::get($attributes, 'name'));
        if (empty($name)) {
            throw new ValidationException(['name' => [$this->translator->trans('huseyinfiliz-notificationhub.api.name_required')]]);
        }

        if (mb_strlen($name, 'UTF-8') > 255) {
            throw new ValidationException(['name' => [$this->translator->trans('huseyinfiliz-notificationhub.api.name_too_long')]]);
        }

        $url = trim((string) Arr::get($attributes, 'default_url'));
        if ($url !== '') {
            // Protocol-relative (//) URL'leri engelleyen nihai regex
            $isValidUrl = preg_match('/^(https?:\/\/|\/(?!\/)|mailto:|tel:)/i', $url);
            
            if (!$isValidUrl) {
                throw new ValidationException(['default_url' => [$this->translator->trans('huseyinfiliz-notificationhub.api.invalid_url_scheme')]]);
            }

            if (mb_strlen($url, 'UTF-8') > 2048) {
                throw new ValidationException(['default_url' => [$this->translator->trans('huseyinfiliz-notificationhub.api.url_too_long')]]);
            }
        }

        $notificationType = new NotificationHub();
        $notificationType->name = $name;
        $notificationType->excerpt_key = Arr::get($attributes, 'excerpt_key');
        $notificationType->default_icon = Arr::get($attributes, 'default_icon');
        $notificationType->default_message_key = Arr::get($attributes, 'default_message_key');
        $notificationType->description = Arr::get($attributes, 'description');
        $notificationType->is_active = (bool) Arr::get($attributes, 'is_active', true);
        $notificationType->sort_order = (int) Arr::get($attributes, 'sort_order', 0);
        $notificationType->permission = Arr::get($attributes, 'permission');
        $notificationType->color = Arr::get($attributes, 'color');
        $notificationType->default_url = $url !== '' ? $url : null;
        $notificationType->default_recipients = Arr::get($attributes, 'default_recipients');

        $notificationType->save();

        return $notificationType;
    }
}