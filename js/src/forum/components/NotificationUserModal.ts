import { Vnode } from 'mithril';
import app from 'flarum/forum/app';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Group from 'flarum/common/models/Group';
import User from 'flarum/common/models/User';
import Select from 'flarum/common/components/Select';
import NotificationType from '../models/NotificationType';
import RecipientPicker from '../../common/components/RecipientPicker';
import { parseRecipients, resolveRecipients, Recipient } from '../../common/utils/recipients';
import { getContrastTextColor } from '../../common/utils/color';

interface NotificationUserModalAttrs extends IInternalModalAttrs {
  user?: User;
  forAll?: boolean;
}

export default class NotificationUserModal extends Modal<NotificationUserModalAttrs> {
  sending: boolean = false;
  recipients: Recipient[] = [];
  messageText: string = '';
  notificationUrl: string = '';
  notificationIcon: string = '';
  allUsersText: string | null = null;
  notificationTypes: NotificationType[] | null = null;
  selectedNotificationType: string = '';
  loadingTypes = false;
  loadingRecipients = false;

  /** Incremented every time updateFields() runs; used to discard stale async recipient lookups. */
  private recipientsLoadToken = 0;

  oninit(vnode: Vnode) {
    super.oninit(vnode);
    this.recipients = [];

    if (this.attrs.user) {
      this.recipients.push(this.attrs.user);
    }

    if (this.attrs.forAll) {
      const membersGroup = app.store.getById<Group>('groups', Group.MEMBER_ID)!;
      this.recipients.push(membersGroup);
      this.allUsersText = app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.preview_all_members');
    } else {
      this.allUsersText = null;
    }

    this.loadNotificationTypes();
  }

  async loadNotificationTypes() {
    this.loadingTypes = true;
    m.redraw();

    try {
      await app.store.find('notification-types');
      const allTypes = app.store.all<NotificationType>('notification-types');
      const activeTypes = allTypes.filter((item: NotificationType) => item.attribute('is_active'));

      const userGroups = app.session.user ? (app.session.user.groups() || []).map((g: any) => g.id()) : [];
      const isAdmin = app.session.user && app.session.user.isAdmin();

      const allowedTypes = activeTypes.filter((item: NotificationType) => {
        if (isAdmin) return true;
        const perm = item.attribute('permission');
        if (!perm) return true;

        const allowedGroupIds = perm.split(',');
        return allowedGroupIds.some((id: string) => userGroups.includes(id));
      });

      this.notificationTypes = allowedTypes.sort(
        (a: NotificationType, b: NotificationType) => (a.attribute('sort_order') ?? 0) - (b.attribute('sort_order') ?? 0)
      );

      if (this.notificationTypes.length > 0) {
        this.selectedNotificationType = this.notificationTypes[0].id()!;
        this.updateFields(this.notificationTypes[0]);
      }
    } catch (error) {
      console.error('Failed to load notification types:', error);
    } finally {
      this.loadingTypes = false;
      m.redraw();
    }
  }

  updateFields(type: NotificationType) {
    this.notificationUrl = type.attribute('default_url') || '';
    this.notificationIcon = type.attribute('default_icon') || '';
    this.messageText = type.attribute('default_message_key') || '';

    // Bump the token so any in-flight lookups from a previous type selection
    // discard their results instead of mutating the (now stale) recipients list.
    this.recipientsLoadToken += 1;
    const token = this.recipientsLoadToken;
    const isStale = () => token !== this.recipientsLoadToken;

    const defaultRecipients = type.attribute('default_recipients');
    const refs = parseRecipients(defaultRecipients);

    if (refs.length === 0) {
      this.recipients = [];
      if (this.attrs.user) {
        this.recipients.push(this.attrs.user);
      }
      if (this.attrs.forAll) {
        const membersGroup = app.store.getById<Group>('groups', Group.MEMBER_ID)!;
        this.recipients.push(membersGroup);
      }
      this.loadingRecipients = false;
      m.redraw();
      return;
    }

    this.recipients = [];
    this.loadingRecipients = true;
    m.redraw();

    resolveRecipients(
      refs,
      (recipient) => {
        this.recipients.push(recipient);
      },
      () => {
        this.loadingRecipients = false;
        m.redraw();
      },
      isStale
    );
  }

  className() {
    return 'huseyinfilizNotificationModal Modal--large';
  }

  title() {
    return app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.title_text');
  }

  onready() {
    this.$('form').find('.js-focus-on-load').first().focus().select();
  }

  content() {
    return m(
      '.Modal-body',
      m(
        'form.Form',
        {
          onsubmit: this.onsubmit.bind(this),
        },
        [this.recipientsField(), this.typeSelectorField(), this.messageField(), this.urlField(), this.previewField(), this.submitButtonField()]
      )
    );
  }

  private recipientsField() {
    return m('.Form-group', [
      m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.recipients_label')),
      this.loadingRecipients
        ? LoadingIndicator.component({ size: 'small' })
        : m(RecipientPicker, {
            recipients: this.recipients,
            onChange: (recipients: Recipient[]) => {
              this.recipients = recipients;
            },
            searchGroups: app.forum.huseyinfilizNotificationAll(),
            searchUsers: true,
            disabled: this.sending,
            translationPrefix: 'huseyinfiliz-notificationhub.forum',
          }),
    ]);
  }

  private typeSelectorField() {
    const notificationTypeOptions: { [key: string]: string } = {};
    let selectBody: any = 'Custom';

    if (this.notificationTypes && this.notificationTypes.length > 0) {
      this.notificationTypes.forEach((type) => {
        notificationTypeOptions[type.id()!] = type.attribute('name');
      });

      selectBody = m(Select, {
        options: notificationTypeOptions,
        value: this.selectedNotificationType,
        onchange: (value: string) => {
          this.selectedNotificationType = value;
          const selectedType = this.notificationTypes!.find((type) => type.id() === value);
          if (selectedType) {
            this.updateFields(selectedType);
          }
        },
        disabled: this.sending,
      });
    } else {
      selectBody = m('p', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.no_notification_types'));
    }

    return m('.Form-group', [
      m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.notification_type_label')),
      this.loadingTypes ? m(LoadingIndicator, { size: 'small' }) : selectBody,
    ]);
  }

  private messageField() {
    return m('.Form-group', [
      m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.message_label')),
      m('textarea.FormControl', {
        rows: 5,
        value: this.messageText,
        oninput: (event: InputEvent) => {
          this.messageText = (event.target as HTMLInputElement).value;
        },
        placeholder: app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.preview_message_placeholder'),
        disabled: this.sending,
      }),
    ]);
  }

  private urlField() {
    return m('.Form-group', [
      m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.url_label')),
      m('input[type=text].FormControl', {
        value: this.notificationUrl,
        oninput: (event: InputEvent) => {
          this.notificationUrl = (event.target as HTMLInputElement).value;
        },
        placeholder: app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.url_placeholder'),
        disabled: this.sending,
      }),
    ]);
  }

  private previewField() {
    const selectedType = this.notificationTypes?.find((type) => type.id() === this.selectedNotificationType);
    const previewColor = selectedType?.attribute('color') || null;
    const textColor = getContrastTextColor(previewColor);

    return m('.Form-group', [
      m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.preview_title')),
      m(
        '.NotificationPreview-content',
        m(
          'ul.NotificationGroup-content',
          m(
            'li',
            m(
              `a.Notification.Notification--customNotification`,
              {
                style: previewColor ? { backgroundColor: previewColor, ...(textColor ? { '--notificationhub-text-color': textColor } : {}) } : {},
              },
              [
                m(
                  'span.Avatar.Notification-avatar',
                  {
                    className: 'Avatar Notification-avatar',
                    style: app.session.user
                      ? {
                          'background-image': app.session.user.avatarUrl() ? `url(${app.session.user.avatarUrl()})` : null,
                          'background-color': !app.session.user.avatarUrl() ? '#e5a2a0' : null,
                        }
                      : {},
                  },
                  app.session.user && !app.session.user.avatarUrl() ? app.session.user.username()?.charAt(0).toUpperCase() : null
                ),
                m('i.icon.Notification-icon', {
                  className: this.notificationIcon ? `icon ${this.notificationIcon} Notification-icon` : 'icon fas fa-bell Notification-icon',
                }),
                m(
                  'span.Notification-title',
                  m(
                    'span.Notification-content',
                    m(
                      'div.NotificationPreview-messageText',
                      this.messageText ||
                        m('em', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.preview_message_placeholder'))
                    )
                  ),
                  m('span.Notification-title-spring')
                ),
                m('div.Notification-excerpt', this.selectedNotificationType ? String(selectedType?.attribute('excerpt_key') || '') : ''),
              ]
            )
          )
        )
      ),
    ]);
  }

  private submitButtonField() {
    return m('.Form-group', [
      Button.component(
        {
          type: 'submit',
          className: 'Button Button--primary SendNotificationModal-send',
          loading: this.sending,
          disabled: this.recipients.length === 0 || this.messageText === '' || !this.selectedNotificationType || this.loadingRecipients,
        },
        app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.submit_button')
      ),
    ]);
  }

  onsubmit(event: SubmitEvent) {
    event.preventDefault();
    this.sending = true;
    m.redraw();

    const selectedUsers = this.recipients.filter((r) => r.data.type === 'users').map((r) => r.id());
    const selectedGroups = this.recipients.filter((r) => r.data.type === 'groups').map((r) => r.id());
    this.sendNotification(selectedUsers as number[], selectedGroups as number[]);
  }

  sendNotification(selectedUsers: number[], selectedGroups: number[]) {
    this.sending = true;
    m.redraw();

    const requestBody = {
      message: this.messageText,
      fromUserId: app.session.user.id(),
      userIds: selectedUsers,
      groupIds: selectedGroups,
      url: this.notificationUrl,
      icon: this.notificationIcon,
      subjectId: this.selectedNotificationType,
    };

    app
      .request<any>({
        method: 'POST',
        url: app.forum.attribute('apiUrl') + '/notifications/send',
        body: requestBody,
      })
      .then(
        (response) => {
          m.redraw();
          const successMessage = app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.notification_sent_message', {
            recipientsCount: response.recipientsCount,
          });
          app.alerts.show({ type: 'success' }, successMessage);
          this.hide();
        },
        (response) => {
          this.sending = false;
          m.redraw();
          this.onerror(response);
          console.error('Error', response);
        }
      );
  }
}
