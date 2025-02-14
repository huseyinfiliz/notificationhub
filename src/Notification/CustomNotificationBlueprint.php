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
    protected int $subjectId;
    protected string $url;
    protected string $icon;

    public NotificationHub $notificationhub;

    public function __construct(
        string $message,
        ?User $fromUser = null,
        string $notificationType = 'default',
        int $subjectId = null,
        string $url = '#',
        string $icon = 'fas fa-bell'
    ) {
        $this->message = $message;
        $this->fromUser = $fromUser;
        $this->notificationType = $notificationType;
        $this->subjectId = $subjectId;
        $this->url = $url;
        $this->icon = $icon;
        $this->notificationhub = NotificationHub::find($this->subjectId);
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
        $notificationHub = $this->notificationhub;
        $excerptText = $notificationHub ? $notificationHub->excerpt_key : null;

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
