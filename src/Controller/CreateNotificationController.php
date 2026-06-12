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
use huseyinfiliz\notificationhub\Utils\UrlValidator;

class CreateNotificationController extends AbstractCreateController
{
    public $serializer = NotificationTypeSerializer::class;

    protected $translator;

    public function __construct(Translator $translator)
    {
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

        $url = UrlValidator::validate((string) Arr::get($attributes, 'default_url'), $this->translator, 'default_url');

        $sortOrder = Arr::get($attributes, 'sort_order', 0);
        if (!is_numeric($sortOrder) || (int) $sortOrder < 0) {
            throw new ValidationException(['sort_order' => [$this->translator->trans('huseyinfiliz-notificationhub.api.sort_order_invalid')]]);
        }

        $excerptKey = (string) Arr::get($attributes, 'excerpt_key', '');
        if (mb_strlen($excerptKey, 'UTF-8') > 255) {
            throw new ValidationException(['excerpt_key' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
        }

        $defaultIcon = (string) Arr::get($attributes, 'default_icon', '');
        if (mb_strlen($defaultIcon, 'UTF-8') > 255) {
            throw new ValidationException(['default_icon' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
        }

        $defaultMessageKey = (string) Arr::get($attributes, 'default_message_key', '');
        if (mb_strlen($defaultMessageKey, 'UTF-8') > 500) {
            throw new ValidationException(['default_message_key' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
        }

        $description = (string) Arr::get($attributes, 'description', '');
        if (mb_strlen($description, 'UTF-8') > 1000) {
            throw new ValidationException(['description' => [$this->translator->trans('huseyinfiliz-notificationhub.api.field_too_long')]]);
        }

        $notificationType = new NotificationHub();
        $notificationType->name = $name;
        $notificationType->excerpt_key = $excerptKey !== '' ? $excerptKey : null;
        $notificationType->default_icon = $defaultIcon !== '' ? $defaultIcon : null;
        $notificationType->default_message_key = $defaultMessageKey !== '' ? $defaultMessageKey : null;
        $notificationType->description = $description !== '' ? $description : null;
        $notificationType->is_active = (bool) Arr::get($attributes, 'is_active', true);
        $notificationType->sort_order = (int) $sortOrder;
        $notificationType->permission = Arr::get($attributes, 'permission');
        $notificationType->color = Arr::get($attributes, 'color');
        $notificationType->default_url = $url;
        $notificationType->default_recipients = Arr::get($attributes, 'default_recipients');

        $notificationType->save();

        return $notificationType;
    }
}