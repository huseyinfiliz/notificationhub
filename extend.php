<?php

namespace huseyinfiliz\notificationhub;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Api\Serializer\UserSerializer;
use Flarum\Extend;
use huseyinfiliz\notificationhub\Notification\CustomNotificationBlueprint;
use huseyinfiliz\notificationhub\Controller\SendNotificationController;
use huseyinfiliz\notificationhub\Controller\UpdateNotificationController;
use huseyinfiliz\notificationhub\Controller\CreateNotificationController;
use huseyinfiliz\notificationhub\Controller\ListNotificationController;
use huseyinfiliz\notificationhub\Controller\DeleteNotificationController;
use huseyinfiliz\notificationhub\Serializer\NotificationTypeSerializer;
use huseyinfiliz\notificationhub\Model\NotificationHub;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->content(function (\Flarum\Frontend\Document $document) {
            $document->payload['notificationTypes']['customNotification'] = 'Custom Notification';
        }),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/resources/less/admin.less'),

    (new Extend\Locales(__DIR__ . '/resources/locale')),

    (new Extend\Notification())
        ->type(CustomNotificationBlueprint::class, NotificationTypeSerializer::class, ['alert']),

    (new Extend\Routes('api'))
        ->get('/notification-types', 'huseyinfiliz.notification-types.list', ListNotificationController::class)
        ->post('/notification-types-create', 'huseyinfiliz.notification-types.create', CreateNotificationController::class)
        ->delete('/notification-types-delete/{id}', 'huseyinfiliz.notification-types.delete', DeleteNotificationController::class)
        ->patch('/notification-types/{id}', 'huseyinfiliz.notification-types.update', UpdateNotificationController::class)
        ->post('/notifications/send', 'huseyinfiliz.notification.send', SendNotificationController::class),

    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(function (ForumSerializer $serializer): array {
            $actor = $serializer->getActor();

            return [
                'huseyinfilizNotificationAll' => $actor->can('huseyinfiliz-notificationhub.send-all'),
                'huseyinfilizNotificationUser' => $actor->can('huseyinfiliz-notificationhub.send-user'),
            ];
        }),
];
