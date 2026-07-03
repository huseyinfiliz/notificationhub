<?php

namespace huseyinfiliz\notificationhub;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;
use huseyinfiliz\notificationhub\Notification\CustomNotificationBlueprint;
use huseyinfiliz\notificationhub\Controller\SendNotificationController;
use huseyinfiliz\notificationhub\Controller\UpdateNotificationController;
use huseyinfiliz\notificationhub\Controller\CreateNotificationController;
use huseyinfiliz\notificationhub\Controller\ListNotificationController;
use huseyinfiliz\notificationhub\Controller\DeleteNotificationController;
use huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer;
use huseyinfiliz\notificationhub\Content\AddForumPayload;
use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource;
use Flarum\Api\Schema;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->content(AddForumPayload::class),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/resources/less/admin.less'),

    (new Extend\Locales(__DIR__ . '/resources/locale')),

    (new Extend\Notification())
        ->type(CustomNotificationBlueprint::class, ['alert']),

    (new Extend\Routes('api'))
        ->get('/notification-types', 'huseyinfiliz.notification-types.list', ListNotificationController::class)
        ->post('/notification-types-create', 'huseyinfiliz.notification-types.create', CreateNotificationController::class)
        ->delete('/notification-types-delete/{id}', 'huseyinfiliz.notification-types.delete', DeleteNotificationController::class)
        ->patch('/notification-types/{id}', 'huseyinfiliz.notification-types.update', UpdateNotificationController::class)
        ->post('/notifications/send', 'huseyinfiliz.notification.send', SendNotificationController::class),

    // @TODO: Replace with the new implementation https://docs.flarum.org/2.x/extend/api#extending-api-resources
    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(function (ForumSerializer $serializer): array {
            $actor = $serializer->getActor();

            return [
                'huseyinfilizNotificationAll' => $actor->can('huseyinfiliz-notificationhub.send-all'),
                'huseyinfilizNotificationUser' => $actor->can('huseyinfiliz-notificationhub.send-user'),
                new Extend\ApiResource(Api\Resource\NotificationTypeResource::class),
            ];
        }),
    new Extend\ApiResource(Api\Resource\NotificationTypeResource::class),
];