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

class SendNotificationController implements RequestHandlerInterface
{
    public function __construct(
        protected UserRepository $users,
        protected NotificationSyncer $notificationSyncer
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $translator = resolve(Translator::class);

        $data = (array) $request->getParsedBody();
        $groupIds = Arr::get($data, 'groupIds', []);
        $userIds = Arr::get($data, 'userIds', []);

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
        $allUserIds = $userIds;

        if ($groupIds) {
            $userQuery = $this->users->query();

            if (!in_array(Group::MEMBER_ID, $groupIds)) {
                $userQuery->whereHas('groups', function (Builder $query) use ($groupIds) {
                    $query->whereIn('id', $groupIds);
                });
            }

            $userQuery->pluck('id')->each(function ($userId) use (&$allUserIds) {
                $allUserIds[] = $userId;
            });
        }

        $allUserIds = array_unique($allUserIds);

        $notificationHub = NotificationHub::find($subjectId);
        if (!$notificationHub) {
            throw new ValidationException(['subjectId' => [$translator->trans('huseyinfiliz-notificationhub.api.subject_id_required')]]);
        }

        $recipientCount = 0;
        foreach ($allUserIds as $userId) {
            $user = User::find($userId);
            if ($user) {
                $blueprint = new CustomNotificationBlueprint(
                    $messageText,
                    $fromUser,
                    'custom_admin_notification',
                    $subjectId,
                    $url,
                    $icon
                );
                $this->notificationSyncer->sync($blueprint, [$user]);
                $recipientCount++;
            }
        }

        if ($recipientCount === 0) {
            throw new ValidationException(['userIds' => [$translator->trans('huseyinfiliz-notificationhub.api.no_valid_recipients')]]);
        }

        return new JsonResponse([
            'recipientsCount' => $recipientCount,
        ]);
    }
}
