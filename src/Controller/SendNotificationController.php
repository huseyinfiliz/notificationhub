<?php

namespace huseyinfiliz\notificationhub\Controller;

use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\User\UserRepository;
use Flarum\User\User;
use Flarum\Notification\NotificationSyncer;
use Illuminate\Contracts\Translation\Translator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use huseyinfiliz\notificationhub\Notification\CustomNotificationBlueprint;
use Flarum\Group\Group;
use huseyinfiliz\notificationhub\Model\NotificationHub;
use huseyinfiliz\notificationhub\Jobs\SendCustomNotifications;
use Illuminate\Contracts\Queue\Queue;
use Illuminate\Support\Collection;

class SendNotificationController implements RequestHandlerInterface
{
    public function __construct(
        protected UserRepository $users,
        protected NotificationSyncer $notificationSyncer,
        protected Queue $queue
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $translator = resolve(Translator::class);

        $data = (array) $request->getParsedBody();
        $groupIds = Arr::get($data, 'groupIds', []);
        $userIds = Arr::get($data, 'userIds', []);

        $hasMemberGroup = in_array(3, $groupIds);

        $actor->assertCan(count($groupIds) > 0 ? 'huseyinfiliz-notificationhub.send-all' : 'huseyinfiliz-notificationhub.send-user');

        $messageText = (string)Arr::get($data, 'message');
        $fromUserId = Arr::get($data, 'fromUserId');
        $subjectId = Arr::get($data, 'subjectId');
        $url = (string)Arr::get($data, 'url', '#');
        $icon = (string)Arr::get($data, 'icon', 'fas fa-bell');

        if (!$messageText) {
            throw new ValidationException(['message' => [$translator->trans('huseyinfiliz-notificationhub.api.message_required')]]);
        }

        if (empty($userIds) && empty($groupIds)) {
            throw new ValidationException(['userIds' => [$translator->trans('huseyinfiliz-notificationhub.api.user_ids_required')]]);
        }
        if (!$subjectId) {
            throw new ValidationException(['subjectId' => [$translator->trans('huseyinfiliz-notificationhub.api.subject_id_required')]]);
        }

        $fromUser = $fromUserId ? User::find($fromUserId) : $actor;

        $estimatedRecipientsCount = 0;

        if ($groupIds) {
            if ($hasMemberGroup) {
                $estimatedRecipientsCount = User::count();
            } else {
                $estimatedRecipientsCount = 0;

                foreach ($groupIds as $groupId) {
                    $group = Group::find($groupId);
                    if ($group) {
                        $estimatedRecipientsCount += $group->users()->count();
                    }
                }
            }
        }

        if ($userIds) {
            $estimatedRecipientsCount += count($userIds);
        }


        $notificationHub = NotificationHub::find($subjectId);
        if (!$notificationHub) {
            throw new ValidationException(['subjectId' => [$translator->trans('huseyinfiliz-notificationhub.api.subject_id_required')]]);
        }

        $userQuery = $this->users->query();

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


        $userQuery->chunk(1000, function (Collection $users) use (&$allUserIds, $messageText, $fromUserId, $subjectId, $url, $icon) {
            $userIdsChunk = $users->pluck('id')->toArray();

            $this->queue->push(new SendCustomNotifications(
                ['groupIds' => [], 'userIds' => $userIdsChunk, 'hasMemberGroup' => false],
                $messageText,
                $fromUserId,
                $subjectId,
                $url,
                $icon
            ));
        });


        return new JsonResponse([
            'recipientsCount' => $estimatedRecipientsCount,
        ]);
    }
}
