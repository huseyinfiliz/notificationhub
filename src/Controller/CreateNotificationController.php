<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractCreateController;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;
use huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer;

class CreateNotificationController extends AbstractCreateController
{
    public $serializer = NotificationTypeSerializer::class;

    protected $notificationHub;

    public function __construct(NotificationHub $notificationHub)
    {
        $this->notificationHub = $notificationHub;
    }

    protected function data(Request $request, Document $document)
    {
        $data = $request->getParsedBody();

        $notificationType = new NotificationHub();
        $notificationType->name = $data['data']['attributes']['name'];
        $notificationType->excerpt_key = $data['data']['attributes']['excerpt_key'];
        $notificationType->default_icon = $data['data']['attributes']['default_icon'];
        $notificationType->default_message_key = $data['data']['attributes']['default_message_key'];
        $notificationType->description = $data['data']['attributes']['description'];
        $notificationType->is_active = $data['data']['attributes']['is_active'];
        $notificationType->sort_order = $data['data']['attributes']['sort_order'];
        $notificationType->permission = $data['data']['attributes']['permission'];
        $notificationType->color = $data['data']['attributes']['color'];
        $notificationType->default_url = $data['data']['attributes']['default_url'];
        $notificationType->default_recipients = $data['data']['attributes']['default_recipients'];

        $notificationType->save();

        return $notificationType;
    }
}

