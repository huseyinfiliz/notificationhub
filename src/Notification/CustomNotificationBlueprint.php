<?php

namespace huseyinfiliz\notificationhub\Notification;

use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\User\User;
use Illuminate\Support\Str;
use huseyinfiliz\notificationhub\Model\NotificationHub;

class CustomNotificationBlueprint implements BlueprintInterface
{
    protected string $message;
    protected ?User $fromUser;
    protected string $notificationType;
    protected string $url;
    protected string $icon;

    public NotificationHub $notificationhub;

    public function __construct(
        string $message,
        NotificationHub $notificationhub,
        ?User $fromUser = null,
        string $notificationType = 'default',
        string $url = '#',
        string $icon = 'fas fa-bell'
    ) {
        $this->message = $message;
        $this->notificationhub = $notificationhub;
        $this->fromUser = $fromUser;
        $this->notificationType = $notificationType;
        $this->url = $url;
        $this->icon = $icon;
    }

    public function getFromUser()
    {
        return $this->fromUser;
    }

    public function getSubject()
    {
        return $this->notificationhub;
    }

    public function getData()
    {
        $excerptText = $this->notificationhub ? $this->notificationhub->excerpt_key : null;

        return [
            'message' => $this->message,
            'excerpt' => $excerptText,
            'url' => $this->url,
            'icon' => $this->icon,
            'unique' => (string) Str::orderedUuid(),
        ];
    }

    public static function getType()
    {
        return 'customNotification';
    }

    public static function getSubjectModel()
    {
        return NotificationHub::class;
    }
}