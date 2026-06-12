<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Api\Controller\AbstractListController;
use Flarum\Http\RequestUtil;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class ListNotificationController extends AbstractListController
{
    public $serializer = \huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer::class;

    protected function data(Request $request, Document $document)
    {
        $actor = RequestUtil::getActor($request);

        if (!$actor->can('huseyinfiliz-notificationhub.send-all') && !$actor->can('huseyinfiliz-notificationhub.send-user')) {
            throw new \Flarum\User\Exception\PermissionDeniedException();
        }

        return NotificationHub::get();
    }
}