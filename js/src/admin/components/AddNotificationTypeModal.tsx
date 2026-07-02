import app from 'flarum/admin/app';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Switch from 'flarum/common/components/Switch';
import Group from 'flarum/common/models/Group';
import NotificationType from '../../forum/models/NotificationType';
import RecipientPicker from '../../common/components/RecipientPicker';
import { parseRecipients, resolveRecipients, serializeRecipients, Recipient } from '../../common/utils/recipients';
import { getContrastTextColor } from '../../common/utils/color';

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

interface NotificationTypeModalAttrs extends IInternalModalAttrs {
    notificationType?: NotificationType;
    onSave: (notificationType: NotificationType) => void;
}

export default class AddNotificationTypeModal extends Modal<NotificationTypeModalAttrs> {
    private formData: any = {};
    private sending: boolean = false;
    private recipients: Recipient[] = [];
    private permissionGroups: Group[] = [];
    private loadingRecipients: boolean = false;
    private colorTouched: boolean = false;

    /** Discards stale async recipient/permission-group lookups (mirrors NotificationUserModal). */
    private recipientsLoadToken = 0;

    oninit(vnode: any) {
        super.oninit(vnode);
        this.recipients = [];
        this.permissionGroups = [];

        if (this.attrs.notificationType) {
            this.formData = {
                name: this.attrs.notificationType.attribute('name'),
                description: this.attrs.notificationType.attribute('description'),
                default_icon: this.attrs.notificationType.attribute('default_icon'),
                default_message_key: this.attrs.notificationType.attribute('default_message_key'),
                default_url: this.attrs.notificationType.attribute('default_url'),
                excerpt_key: this.attrs.notificationType.attribute('excerpt_key'),
                is_active: this.attrs.notificationType.attribute('is_active'),
                sort_order: this.attrs.notificationType.attribute('sort_order') || 1,
                permission: this.attrs.notificationType.attribute('permission'),
                color: this.attrs.notificationType.attribute('color'),
                default_recipients: this.attrs.notificationType.attribute('default_recipients'),
            };

            this.loadDefaultRecipients(this.formData.default_recipients);
            this.loadPermissionGroups(this.formData.permission);
        } else {
            this.formData = {
                name: '',
                excerpt_key: '',
                default_icon: 'fas fa-bell',
                default_message_key: null,
                description: null,
                is_active: true,
                sort_order: 1,
                permission: null,
                color: null,
                default_url: null,
                default_recipients: null,
            };
        }
    }

    /** permission is stored as a plain comma-separated list of group ids (no "group:" prefix, unlike default_recipients). */
    private loadPermissionGroups(raw: string | null) {
        this.permissionGroups = [];
        if (!raw) {
            return;
        }

        raw.split(',')
            .map((id) => id.trim())
            .filter(Boolean)
            .forEach((id) => {
                const group = app.store.getById<Group>('groups', id);
                if (group) {
                    this.permissionGroups.push(group);
                }
            });
    }

    private loadDefaultRecipients(raw: string | null) {
        const refs = parseRecipients(raw);

        this.recipientsLoadToken += 1;
        const token = this.recipientsLoadToken;
        const isStale = () => token !== this.recipientsLoadToken;

        if (refs.length === 0) {
            this.recipients = [];
            this.loadingRecipients = false;
            return;
        }

        this.recipients = [];
        this.loadingRecipients = true;

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

    /** Empty is allowed (no color set); anything non-empty must be a valid hex code. */
    private get isColorValid(): boolean {
        const color = (this.formData.color || '').trim();
        return color === '' || HEX_COLOR_RE.test(color);
    }

    className() {
        return 'NotificationTypeModal Modal--large';
    }

    title() {
        return app.translator.trans('huseyinfiliz-notificationhub.admin.settings.' + (this.attrs.notificationType ? 'edit_notification_type' : 'add_notification_type'));
    }

    content() {
        const t = (key: string) => app.translator.trans('huseyinfiliz-notificationhub.admin.settings.' + key);

        return m('.Modal-body', [
            m(
                'form.Form',
                {
                    onsubmit: this.onsubmit.bind(this),
                },
                [
                    this.buildFormGroup('name', 'text', t('fields.name')),
                    this.buildFormGroup('description', 'text', t('fields.description')),
                    this.buildFormGroup('default_icon', 'text', t('fields.icon')),
                    this.buildFormGroup('default_message_key', 'text', t('fields.default_message_key')),
                    this.buildFormGroup('default_url', 'text', t('fields.default_url')),
                    this.buildFormGroup('excerpt_key', 'text', t('fields.excerpt_key')),
                    this.colorField(t),
                    this.buildFormGroup('sort_order', 'number', t('fields.sort_order')),

                    m('.Form-group', [
                        m('label', t('fields.default_recipients')),
                        this.loadingRecipients
                            ? LoadingIndicator.component({ size: 'small' })
                            : m(RecipientPicker, {
                                  recipients: this.recipients,
                                  onChange: (recipients: Recipient[]) => {
                                      this.recipients = recipients;
                                  },
                                  searchGroups: true,
                                  searchUsers: true,
                                  disabled: this.sending,
                                  translationPrefix: 'huseyinfiliz-notificationhub.admin',
                              }),
                    ]),

                    m('.Form-group', [
                        m('label', t('fields.permission')),
                        m('.helpText.permission-help', t('fields.permission_help')),
                        m(RecipientPicker, {
                            recipients: this.permissionGroups,
                            onChange: (groups: Recipient[]) => {
                                this.permissionGroups = groups.filter((g) => g.id() !== Group.MEMBER_ID) as Group[];
                            },
                            searchGroups: true,
                            searchUsers: false,
                            disabled: this.sending,
                            placeholder: t('fields.permission_placeholder'),
                            translationPrefix: 'huseyinfiliz-notificationhub.admin',
                        }),
                    ]),

                    m('.Form-group', [
                        Switch.component(
                            {
                                state: this.formData.is_active,
                                onchange: (checked: boolean) => {
                                    this.formData.is_active = checked;
                                },
                                disabled: this.sending,
                            },
                            t('fields.active')
                        ),
                    ]),

                    this.previewField(t),

                    m('.Form-group', [
                        Button.component(
                            {
                                type: 'submit',
                                className: 'Button Button--primary',
                                loading: this.sending,
                                disabled: !this.formData.name || this.loadingRecipients || !this.isColorValid,
                            },
                            t('save')
                        ),
                    ]),
                ]
            ),
        ]);
    }

    private colorField(t: (key: string) => string) {
        const invalid = this.colorTouched && !this.isColorValid;

        return m('.Form-group', [
            m('label', t('fields.color')),
            m('input.FormControl', {
                type: 'text',
                className: invalid ? 'color-field-invalid' : '',
                value: this.formData.color || '',
                placeholder: '#ff0000',
                oninput: (e: InputEvent) => {
                    this.formData.color = (e.target as HTMLInputElement).value;
                    this.colorTouched = true;
                },
                onblur: () => {
                    this.colorTouched = true;
                },
                disabled: this.sending,
            }),
            invalid ? m('.helpText.color-field-error', t('fields.color_invalid')) : null,
        ]);
    }

    private previewField(t: (key: string) => string) {
        const color = this.isColorValid ? this.formData.color || null : null;
        const textColor = getContrastTextColor(color);

        return m('.Form-group', [
            m('label', t('fields.preview')),
            m(
                '.NotificationTypePreview',
                m(
                    'ul.NotificationGroup-content',
                    m(
                        'li',
                        m(
                            'a.Notification.Notification--customNotification',
                            {
                                style: color ? { backgroundColor: color, ...(textColor ? { '--notificationhub-text-color': textColor } : {}) } : {},
                            },
                            [
                                m('i.icon.Notification-icon', {
                                    className: this.formData.default_icon ? `icon ${this.formData.default_icon} Notification-icon` : 'icon fas fa-bell Notification-icon',
                                }),
                                m('span.Notification-title', [
                                    m('span.Notification-content', this.formData.name || t('fields.preview_placeholder')),
                                    m('span.Notification-title-spring'),
                                ]),
                                m('div.Notification-excerpt', this.formData.excerpt_key || ''),
                            ]
                        )
                    )
                )
            ),
        ]);
    }

    private buildFormGroup(field: string, type: string, label: string) {
        return m('.Form-group', [
            m('label', label),
            m('input.FormControl', {
                type: type,
                value: this.formData[field] || '',
                oninput: (e: InputEvent) => {
                    const value = (e.target as HTMLInputElement).value;
                    this.formData[field] = type === 'number' ? parseInt(value, 10) : value;
                },
                disabled: this.sending,
            }),
        ]);
    }

    onsubmit(e: SubmitEvent) {
        e.preventDefault();

        this.colorTouched = true;
        if (!this.isColorValid) {
            m.redraw();
            return;
        }

        this.sending = true;

        this.formData.default_recipients = serializeRecipients(this.recipients);
        this.formData.permission = this.permissionGroups.map((g) => g.id()).join(',') || null;

        const isNew = !this.attrs.notificationType;
        const url = isNew ? `${app.forum.attribute('apiUrl')}/notification-types-create` : `${app.forum.attribute('apiUrl')}/notification-types/${this.attrs.notificationType?.id()}`;

        app.request({
            method: isNew ? 'POST' : 'PATCH',
            url: url,
            body: { data: { type: 'notification-types', attributes: this.formData, ...(isNew ? {} : { id: this.attrs.notificationType!.id() }) } },
        })
            .then((response: any) => {
                const typeModel = app.store.pushObject(response.data);
                this.attrs.onSave(typeModel);
                this.hide();
            })
            .catch((error) => {
                this.sending = false;
                console.error('Error saving notification type:', error);
                this.onerror(error);
                m.redraw();
            });
    }
}
