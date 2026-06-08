<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractShowController;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;
use huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Flarum\Foundation\ValidationException;
use Illuminate\Contracts\Translation\Translator;

class UpdateNotificationController extends AbstractShowController
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

        if (!$actor->can('huseyinfiliz-notificationhub.send-all')) {
            throw new \Flarum\User\Exception\PermissionDeniedException();
        }

        $id = Arr::get($request->getAttribute('routeParameters'), 'id');
        $notificationType = $this->notificationHub->findOrFail($id);

        $data = $request->getParsedBody();
        $attributes = Arr::get($data, 'data.attributes', []);

        if (Arr::has($attributes, 'default_url')) {
            $url = Arr::get($attributes, 'default_url');
            if ($url && preg_match('/^\s*javascript:/i', $url)) {
                throw new ValidationException(['default_url' => [$this->translator->trans('huseyinfiliz-notificationhub.api.invalid_url')]]);
            }
        }

        if (Arr::has($attributes, 'is_active')) {
            $attributes['is_active'] = (bool) Arr::get($attributes, 'is_active');
        }
        if (Arr::has($attributes, 'sort_order')) {
            $attributes['sort_order'] = (int) Arr::get($attributes, 'sort_order');
        }

        $notificationType->update($attributes);

        return $notificationType;
    }
}