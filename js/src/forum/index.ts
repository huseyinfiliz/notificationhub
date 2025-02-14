import { extend } from 'flarum/common/extend';
import app from 'flarum/forum/app';
import addNotificationLinks from './addNotificationLinks';
import CustomNotification from './components/customNotification';

export {default as extend} from './extend';

app.initializers.add('huseyinfiliz-notificationhub', () => {
    addNotificationLinks();
	app.notificationComponents.customNotification = CustomNotification;
});
