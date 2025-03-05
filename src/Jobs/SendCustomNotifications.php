<?php

namespace huseyinfiliz\notificationhub\Jobs;

use Flarum\User\User;
use Flarum\Notification\NotificationSyncer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use huseyinfiliz\notificationhub\Notification\CustomNotificationBlueprint;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;

class SendCustomNotifications implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    protected array $selectionCriteria;
    protected string $messageText;
    protected int|null $fromUserId;
    protected int $subjectId;
    protected string $url;
    protected string $icon;

    public function __construct(array $selectionCriteria, string $messageText, int|null $fromUserId, int $subjectId, string $url, string $icon)
    {
        $this->selectionCriteria = $selectionCriteria;
        $this->messageText = $messageText;
        $this->fromUserId = $fromUserId;
        $this->subjectId = $subjectId;
        $this->url = $url;
        $this->icon = $icon;
    }

    public function handle(NotificationSyncer $notificationSyncer)
    {
        $fromUser = $this->fromUserId ? User::find($this->fromUserId) : null;

        $notificationHub = NotificationHub::find($this->subjectId);
        if (!$notificationHub) {
            return;
        }

        $recipientCount = 0;
        $groupIds = $this->selectionCriteria['groupIds'];
        $userIds = $this->selectionCriteria['userIds'];
        $hasMemberGroup = $this->selectionCriteria['hasMemberGroup'];

        $userQuery = User::query();

        if ($groupIds) {
            $groupIdsArray = $groupIds;

            if ($hasMemberGroup) {
            }
            else if (!in_array(Group::MEMBER_ID, $groupIds)) {
                $userQuery->whereHas('groups', function (Builder $query) use ($groupIdsArray) {
                    $query->whereIn('id', $groupIdsArray);
                });
            }
        }

        if ($userIds) {
            $userIdsArray = $userIds;
            $userQuery->whereIn('id', $userIdsArray);
        }


        $userQuery->chunk(20, function ($users) use ($notificationSyncer, &$recipientCount, $fromUser) {
            foreach ($users as $user) {
                $blueprint = new CustomNotificationBlueprint(
                    $this->messageText,
                    $fromUser,
                    'custom_admin_notification',
                    $this->subjectId,
                    $this->url,
                    $this->icon
                );
                $notificationSyncer->sync($blueprint, [$user]);
                $recipientCount++;
            }
        });


        if ($recipientCount === 0) {
            return;
        }
    }
}
