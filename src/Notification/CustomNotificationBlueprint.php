<?php

namespace HuseyinFiliz\NotificationHub\Notification;

use Flarum\Notification\AlertableInterface;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\User\User;
use Illuminate\Support\Str;
use HuseyinFiliz\NotificationHub\Model\NotificationHub;

class CustomNotificationBlueprint implements BlueprintInterface, AlertableInterface
{
    public function __construct(protected string $message, public NotificationHub $notificationhub, protected ?User $fromUser = null, protected string $notificationType = 'default', protected string $url = '#', protected string $icon = 'fas fa-bell')
    {
    }

    public function getFromUser(): ?\Flarum\User\User
    {
        return $this->fromUser;
    }

    public function getSubject(): ?\Flarum\Database\AbstractModel
    {
        return $this->notificationhub;
    }

    public function getData(): mixed
    {
        $excerptText = $this->notificationhub ? $this->notificationhub->excerpt_key : null;
        $colorText = $this->notificationhub ? $this->notificationhub->color : null;

        return [
            'message' => $this->message,
            'excerpt' => $excerptText,
            'url' => $this->url,
            'icon' => $this->icon,
            'color' => $colorText,
            'unique' => (string) Str::orderedUuid(),
        ];
    }

    public static function getType(): string
    {
        return 'customNotification';
    }

    public static function getSubjectModel(): string
    {
        return NotificationHub::class;
    }
}