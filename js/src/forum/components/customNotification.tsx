import app from 'flarum/forum/app';
import Notification from 'flarum/forum/components/Notification';

export default class CustomNotification extends Notification {
  icon() {
    return this.attrs.notification?.content()?.icon;
  }

  href() {
    return this.attrs.notification?.content()?.url;
  }

  excerpt() {
    return this.attrs.notification?.content()?.excerpt;
  }

  content() {
    const message = this.attrs.notification?.content()?.message;


    return m('div', message);
  }
}
