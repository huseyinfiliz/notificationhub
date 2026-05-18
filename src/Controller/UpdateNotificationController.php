<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractShowController;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;
use huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;

class UpdateNotificationController extends AbstractShowController
{
    public $serializer = NotificationTypeSerializer::class;

    protected $notificationHub;

    public function __construct(NotificationHub $notificationHub)
    {
        $this->notificationHub = $notificationHub;
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

        $notificationType->update($attributes);

        return $notificationType;
    }
}