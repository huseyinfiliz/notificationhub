import {extend} from 'flarum/common/extend';
import app from 'flarum/forum/app';
import NotificationGrid from 'flarum/forum/components/NotificationGrid';

export default function () {
    // settings
    extend(NotificationGrid.prototype, 'notificationTypes', function (items) {
        items.add('customNotification', {
            name: 'customNotification',
            icon: 'fas fa-bell',
            label: app.translator.trans('huseyinfiliz-notificationhub.forum.settings.notify_custom')
        })
    })
}