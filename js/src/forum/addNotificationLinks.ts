import {extend} from 'flarum/common/extend';
import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import UserControls from 'flarum/forum/utils/UserControls';
import SessionDropdown from 'flarum/forum/components/SessionDropdown';
import NotificationUserModal from './components/NotificationUserModal';

export default function () {
    extend(UserControls, 'moderationControls', (items, user) => {
        if (app.forum.huseyinfilizNotificationUser()) {
            items.add('huseyinfiliz-notificationhub', Button.component({
                icon: 'fas fa-bell',
                onclick() {
                    app.modal.show(NotificationUserModal, {
                        user,
                    });
                },
            }, app.translator.trans('huseyinfiliz-notificationhub.forum.links.notification_individual')));
        }
    });

    extend(SessionDropdown.prototype, 'items', items => {
        if (app.forum.huseyinfilizNotificationAll()) {
            items.add('huseyinfiliz-notificationuhb', Button.component({
                icon: 'fas fa-bell',
                onclick() {
                    app.modal.show(NotificationUserModal, {
                        forAll: true,
                    });
                },
            }, app.translator.trans('huseyinfiliz-notificationhub.forum.links.notification_all')));
        }
    });

    const userDirectory = flarum.extensions['fof-user-directory'];
    if (userDirectory && userDirectory.UserDirectoryPage) {
        extend(userDirectory.UserDirectoryPage.prototype, 'actionItems', items => {
            if (app.forum.huseyinfilizNotificationAll()) {
                items.add('huseyinfiliz-notificationhub', Button.component({
                    className: 'Button',
                    icon: 'fas fa-bell',
                    onclick() {
                        app.modal.show(NotificationUserModal, {
                            forAll: true,
                        });
                    },
                }, app.translator.trans('huseyinfiliz-notificationhub.forum.links.notification_all')), 10);
            }
        });
    }
}
