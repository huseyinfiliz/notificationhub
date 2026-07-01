import app from 'flarum/admin/app';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import KeyboardNavigatable from 'flarum/common/utils/KeyboardNavigatable';
import username from 'flarum/common/helpers/username';
import icon from 'flarum/common/helpers/icon';
import Group from 'flarum/common/models/Group';
import User from 'flarum/common/models/User';
import NotificationType from '../../forum/models/NotificationType';

interface NotificationTypeModalAttrs extends IInternalModalAttrs {
    notificationType?: NotificationType;
    onSave: (notificationType: NotificationType) => void;
}

type Recipient = Group | User;

export default class AddNotificationTypeModal extends Modal<NotificationTypeModalAttrs> {
    private formData: any = {};
    private sending: boolean = false;
    private recipients: Recipient[] = [];
    private filter: string = '';
    private focused: boolean = false;
    private loadingResults: boolean = false;
    private searchResults: any[] = [];
    private searchIndex: number = 0;
    private searchTimeout: number = -1;
    private navigator: KeyboardNavigatable = new KeyboardNavigatable();
    private lastApiResults: User[] = [];

    oninit(vnode: any) {
        super.oninit(vnode);
        this.recipients = [];
        this.lastApiResults = [];
        
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

            const rawRecipients = this.formData.default_recipients;
            if (rawRecipients) {
                rawRecipients.split(',').forEach((item: string) => {
                    const [type, id] = item.trim().split(':');
                    if (type === 'group') {
                        const group = app.store.getById('groups', id);
                        if (group) this.recipients.push(group);
                    } else if (type === 'user') {
                        app.store.find('users', id).then((user: any) => {
                            this.recipients.push(user);
                            m.redraw();
                        });
                    }
                });
            }
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
                default_recipients: null
            };
        }

        this.navigator
            .when(event => event.key !== 'Tab' || !!this.filter)
            .onUp(() => {
                if (this.searchIndex > 0) {
                    this.searchIndex--;
                    m.redraw();
                }
            })
            .onDown(() => {
                if (this.searchIndex < this.searchResults.length - 1) {
                    this.searchIndex++;
                    m.redraw();
                }
            })
            .onSelect(() => this.selectResult(this.searchResults[this.searchIndex]))
            .onRemove(() => {
                this.recipients.pop();
                m.redraw();
            });
    }

    className() {
        return 'NotificationTypeModal Modal--large';
    }

    title() {
        return app.translator.trans(
            'huseyinfiliz-notificationhub.admin.settings.' +
            (this.attrs.notificationType ? 'edit_notification_type' : 'add_notification_type')
        );
    }

    content() {
        const t = (key: string) => app.translator.trans('huseyinfiliz-notificationhub.admin.settings.' + key);

        return m('.Modal-body', [
            m('form.Form', {
                onsubmit: this.onsubmit.bind(this)
            }, [
                this.buildFormGroup('name', 'text', t('fields.name')),
                this.buildFormGroup('description', 'text', t('fields.description')),
                this.buildFormGroup('default_icon', 'text', t('fields.icon')),
                this.buildFormGroup('default_message_key', 'text', t('fields.default_message_key')),
                this.buildFormGroup('default_url', 'text', t('fields.default_url')),
                this.buildFormGroup('excerpt_key', 'text', t('fields.excerpt_key')),
                this.buildFormGroup('color', 'text', t('fields.color')),
                this.buildFormGroup('sort_order', 'number', t('fields.sort_order')),

                m('.Form-group', [
                    m('label', t('fields.default_recipients')),
                    m('.RecipientsInput.FormControl', {
                        className: this.focused ? 'focus' : '',
                    }, [
                        m('span.RecipientsInput-selected', this.recipients.map((recipient, index) => m('span.RecipientsInput-recipient', {
                            onclick: () => {
                                this.recipients.splice(index, 1);
                                m.redraw();
                            },
                            title: this.searchResultKind(recipient),
                        }, this.recipientLabel(recipient)))),
                        m('input.FormControl', {
                            placeholder: app.translator.trans('huseyinfiliz-notificationhub.admin.modal_notification.recipients_placeholder'),
                            value: this.filter,
                            oninput: (event: InputEvent) => {
                                this.filter = (event.target as HTMLInputElement).value;
                                this.performNewSearch();
                            },
                            onkeydown: this.navigator.navigate.bind(this.navigator),
                            onfocus: () => { this.focused = true; },
                            onblur: () => { this.focused = false; },
                            disabled: this.sending,
                        }),
                        this.loadingResults ? LoadingIndicator.component({ size: 'small' }) : null,
                        this.searchResults.length ? m('ul.Dropdown-menu.search-dropdown', this.searchResults.map(
                            (result, index) => m('li', {
                                className: this.searchIndex === index ? 'active' : '',
                                onmousedown: (e: MouseEvent) => {
                                    e.preventDefault();
                                    this.selectResult(result);
                                },
                            }, m('button[type=button]', [
                                m('span.SearchResultKind', this.searchResultKind(result)),
                                this.recipientLabel(result),
                            ]))
                        )) : null,
                    ]),
                ]),

                m('.Form-group', [
                    m('label', t('fields.permission')),
                    m('.helpText.permission-help', t('fields.permission_help')),
                    app.store.all('groups')
                        .filter(group => group.id() !== '2')
                        .map(group => {
                            const groupReferenced = this.formData.permission ? this.formData.permission.split(',') : [];
                            const isChecked = groupReferenced.includes(group.id());
                            return m('label.checkbox.permission-checkbox', [
                                m('input[type=checkbox]', {
                                    checked: isChecked,
                                    disabled: this.sending,
                                    onchange: (e: Event) => {
                                        let currentIds = this.formData.permission ? this.formData.permission.split(',').filter(Boolean) : [];
                                        const target = e.target as HTMLInputElement;
                                        if (target.checked) {
                                            if (!currentIds.includes(group.id())) currentIds.push(group.id());
                                        } else {
                                            currentIds = currentIds.filter(id => id !== group.id());
                                        }
                                        this.formData.permission = currentIds.join(',') || null;
                                    }
                                }),
                                ' ',
                                group.namePlural()
                            ]);
                        })
                ]),

                m('.Form-group', [
                    m('label.checkbox', [
                        m('input[type=checkbox]', {
                            checked: this.formData.is_active,
                            onchange: (e: InputEvent) => {
                                this.formData.is_active = (e.target as HTMLInputElement).checked;
                            },
                            disabled: this.sending
                        }),
                        ' ',
                        t('fields.active')
                    ])
                ]),

                m('.Form-group', [
                    Button.component({
                        type: 'submit',
                        className: 'Button Button--primary',
                        loading: this.sending,
                        disabled: !this.formData.name
                    }, t('save'))
                ])
            ])
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
                disabled: this.sending
            })
        ]);
    }

    private recipientLabel(recipient: Recipient) {
        if (recipient.data.type === 'users') {
            return m('.RecipientLabel', username(recipient as User));
        } else if (recipient.data.type === 'groups') {
            const group = recipient as Group;
            return m('.RecipientLabel', group.color() ? {
                className: 'colored',
                style: { backgroundColor: group.color() },
            } : {}, [
                group.icon() ? [icon(group.icon()!), ' '] : null,
                group.namePlural(),
            ]);
        }
        return '[unknown]';
    }

    private searchResultKind(recipient: Recipient) {
        if (recipient.data.type === 'users') {
            return app.translator.trans('huseyinfiliz-notificationhub.admin.recipient_kinds.user');
        } else if (recipient.data.type === 'groups') {
            return app.translator.trans('huseyinfiliz-notificationhub.admin.recipient_kinds.group');
        }
        return '[unknown]';
    }

    private selectResult(result: Recipient | null) {
        if (!result) return;
        this.recipients.push(result);
        this.filter = '';
        this.searchResults = [];
        m.redraw();
    }

    private performNewSearch() {
        this.searchIndex = 0;
        const query = this.filter.toLowerCase();
        this.buildSearchResults(query);

        clearTimeout(this.searchTimeout);
        if (query.length >= 3) {
            this.searchTimeout = setTimeout(() => {
                this.loadingResults = true;
                m.redraw();

                app.store.find('users', {
                    filter: { q: query },
                    page: { limit: 5 }
                }).then((results: any) => {
                    this.loadingResults = false;
                    this.lastApiResults = results || [];
                    this.buildSearchResults(query);
                    m.redraw();
                });
            }, 250) as any;
        }
    }

    private buildSearchResults(query: string) {
        if (!query) {
            this.searchResults = [];
            return;
        }

        const results: Recipient[] = [];

        app.store.all<Group>('groups').forEach(group => {
            if (group.id() === Group.GUEST_ID) return;
            if (group.nameSingular().toLowerCase().indexOf(query) !== -1 || group.namePlural().toLowerCase().indexOf(query) !== -1) {
                results.push(group);
            }
        });

        this.lastApiResults.forEach(user => {
            if (user.username().toLowerCase().indexOf(query) !== -1) {
                results.push(user);
            }
        });

        this.searchResults = results.filter(result => {
            return !this.recipients.some(
                recipient => recipient.data.type === result.data.type && recipient.id() === result.id()
            );
        });

        m.redraw();
    }

    onsubmit(e: SubmitEvent) {
        e.preventDefault();
        this.sending = true;

        const serializedRecipients = this.recipients.map(r => {
            const type = r.data.type === 'users' ? 'user' : 'group';
            return `${type}:${r.id()}`;
        }).join(',');
        this.formData.default_recipients = serializedRecipients || null;

        const isNew = !this.attrs.notificationType;
        const url = isNew
            ? `${app.forum.attribute('apiUrl')}/notification-types-create`
            : `${app.forum.attribute('apiUrl')}/notification-types/${this.attrs.notificationType?.id()}`;

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
        .catch(error => {
            this.sending = false;
            console.error("Error saving notification type:", error);
            this.onerror(error);
            m.redraw();
        });
    }
}