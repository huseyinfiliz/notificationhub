<?php

namespace HuseyinFiliz\NotificationHub\Jobs;

use Flarum\User\User;
use Flarum\Notification\NotificationSyncer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use HuseyinFiliz\NotificationHub\Notification\CustomNotificationBlueprint;
use HuseyinFiliz\NotificationHub\Model\NotificationHub;

class SendCustomNotifications implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected array $selectionCriteria, protected string $messageText, protected ?int $fromUserId, protected int $subjectId, protected string $url, protected string $icon)
    {
    }

    public function handle(NotificationSyncer $notificationSyncer)
    {
        $fromUser = $this->fromUserId ? User::find($this->fromUserId) : null;

        $notificationHub = NotificationHub::find($this->subjectId);
        if (!$notificationHub) {
            return;
        }

        $userIds = $this->selectionCriteria['userIds'] ?? [];

        if (empty($userIds)) {
            return;
        }

        User::whereIn('id', $userIds)->chunk(100, function ($users) use ($notificationSyncer, $fromUser, $notificationHub) {
            $blueprint = new CustomNotificationBlueprint(
                $this->messageText,
                $notificationHub,
                $fromUser,
                'custom_admin_notification',
                $this->url,
                $this->icon
            );
            $notificationSyncer->sync($blueprint, $users->all());
        });
    }
}