import app from 'flarum/admin/app';
import SettingsPage from './Pages/SettingsPage';
import { Extend } from 'flarum/common/extenders';
import NotificationType from '../forum/models/NotificationType';

app.initializers.add('huseyinfiliz-notificationhub', () => {
    app.store.models['notification-types'] = NotificationType;

    app.extensionData
        .for('huseyinfiliz-notificationhub')
        .registerPage(SettingsPage)
        .registerPermission({
            icon: 'fas fa-bell',
            label: app.translator.trans('huseyinfiliz-notificationhub.admin.permissions.send_all'),
            permission: 'huseyinfiliz-notificationhub.send-all',
        }, 'moderate')
        .registerPermission({
            icon: 'fas fa-bell',
            label: app.translator.trans('huseyinfiliz-notificationhub.admin.permissions.send_user'),
            permission: 'huseyinfiliz-notificationhub.send-user',
        }, 'moderate');
});