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
        protected Queue $queue,
        protected Translator $translator
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        $data = (array) $request->getParsedBody();
        $groupIds = Arr::get($data, 'groupIds', []);
        $userIds = Arr::get($data, 'userIds', []);

        $hasMemberGroup = in_array(Group::MEMBER_ID, $groupIds);

        $actor->assertCan(count($groupIds) > 0 ? 'huseyinfiliz-notificationhub.send-all' : 'huseyinfiliz-notificationhub.send-user');

        $messageText = (string)Arr::get($data, 'message');
        $fromUserId = Arr::get($data, 'fromUserId');
        $subjectId = Arr::get($data, 'subjectId');
        $url = (string)Arr::get($data, 'url', '#');
        $icon = (string)Arr::get($data, 'icon', 'fas fa-bell');

        if (!$messageText) {
            throw new ValidationException(['message' => [$this->translator->trans('huseyinfiliz-notificationhub.api.message_required')]]);
        }

        if (empty($userIds) && empty($groupIds)) {
            throw new ValidationException(['userIds' => [$this->translator->trans('huseyinfiliz-notificationhub.api.user_ids_required')]]);
        }
        if (!$subjectId) {
            throw new ValidationException(['subjectId' => [$this->translator->trans('huseyinfiliz-notificationhub.api.subject_id_required')]]);
        }

        if ($url && preg_match('/^\s*javascript:/i', $url)) {
            throw new ValidationException(['url' => [$this->translator->trans('huseyinfiliz-notificationhub.api.invalid_url')]]);
        }

        if (!$actor->isAdmin() || !$fromUserId) {
            $fromUserId = $actor->id;
        }
        $fromUserId = $fromUserId ? (int) $fromUserId : null;

        $notificationHub = NotificationHub::find($subjectId);
        if (!$notificationHub) {
            throw new ValidationException(['subjectId' => [$this->translator->trans('huseyinfiliz-notificationhub.api.subject_id_required')]]);
        }

        $userQuery = $this->users->query();

        if ($hasMemberGroup) {
            $recipientsCount = User::count();
        } else {
            $filterClosure = function (Builder $query) use ($groupIds, $userIds) {
                $hasCondition = false;
                if (!empty($groupIds)) {
                    $query->whereHas('groups', function (Builder $gQuery) use ($groupIds) {
                        $gQuery->whereIn('id', $groupIds);
                    });
                    $hasCondition = true;
                }
                if (!empty($userIds)) {
                    if ($hasCondition) {
                        $query->orWhereIn('id', $userIds);
                    } else {
                        $query->whereIn('id', $userIds);
                    }
                }
            };

            $recipientsCount = User::where($filterClosure)->count();
            $userQuery->where($filterClosure);
        }

        $userQuery->chunk(1000, function (Collection $users) use ($messageText, $fromUserId, $subjectId, $url, $icon) {
            $userIdsChunk = $users->pluck('id')->toArray();

            $this->queue->push(new SendCustomNotifications(
                ['userIds' => $userIdsChunk],
                $messageText,
                $fromUserId,
                $subjectId,
                $url,
                $icon
            ));
        });

        return new JsonResponse([
            'recipientsCount' => $recipientsCount,
        ]);
    }
}