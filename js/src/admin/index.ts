import app from 'flarum/admin/app';
import SettingsPage from './Pages/SettingsPage';

app.initializers.add('huseyinfiliz-notificationhub', () => {
    app.extensionData
        .for('huseyinfiliz-notificationhub')
        .registerPage(
            SettingsPage
        )
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
