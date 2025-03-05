import { Vnode } from 'mithril';
import app from 'flarum/forum/app';
import Modal, { IInternalModalAttrs } from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Group from 'flarum/common/models/Group';
import User from 'flarum/common/models/User';
import username from 'flarum/common/helpers/username';
import icon from 'flarum/common/helpers/icon';
import KeyboardNavigatable from 'flarum/common/utils/KeyboardNavigatable';
import Select from 'flarum/common/components/Select';

interface NotificationTypeAttributes {
    id?: number;
    name: string;
    excerpt_key: string;
    default_icon: string | null;
    default_message_key: string | null;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    permission: string | null;
    color: string | null;
    default_url: string | null;
    default_recipients: string | null;
}

interface NotificationType {
    id: string;
    type: string;
    attributes: NotificationTypeAttributes;
}

interface NotificationUserModalAttrs extends IInternalModalAttrs {
    user?: User;
    forAll?: boolean;
}

type Recipient = Group | User;

export default class NotificationUserModal extends Modal<NotificationUserModalAttrs> {
    sending: boolean = false;
    recipients: Recipient[] = [];
    messageText: string = '';
    notificationUrl: string = '';
    notificationIcon: string = '';
    searchIndex: number = 0;
    navigator: KeyboardNavigatable = new KeyboardNavigatable();
    filter: string = '';
    focused: boolean = false;
    loadingResults: boolean = false;
    searchResults: any[] = [];
    searchTimeout: number = -1;
    allUsersText: string | null = null;
    notificationTypes: NotificationType[] | null = null;
    selectedNotificationType: string = '';
    loadingTypes = false;

    oninit(vnode: Vnode) {
        super.oninit(vnode);

        this.recipients = [];

        if (this.attrs.user) {
            this.recipients.push(this.attrs.user);
        }

        if (this.attrs.forAll) {
            const membersGroup = app.store.getById<Group>('groups', Group.MEMBER_ID)!;
            this.recipients.push(membersGroup);
        }

        if (this.attrs.forAll) {
            this.allUsersText = app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.preview_all_members');
        } else {
            this.allUsersText = null;
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

        this.loadNotificationTypes();
    }

    async loadNotificationTypes() {
        this.loadingTypes = true;
        m.redraw();

        try {
            const response = await app.request<any>({
                method: 'GET',
                url: `${app.forum.attribute('apiUrl')}/notification-types`,
            });

            const activeTypes = response.data.filter((item: NotificationType) => item.attributes.is_active);
            this.notificationTypes = activeTypes.sort((a: NotificationType, b: NotificationType) => (a.attributes?.sort_order ?? 0) - (b.attributes?.sort_order ?? 0));

            if (this.notificationTypes.length > 0) {
                this.selectedNotificationType = this.notificationTypes[0].id;
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
        this.notificationUrl = type.attributes.default_url || '';
        this.notificationIcon = type.attributes.default_icon || '';
        this.messageText = type.attributes.default_message_key || '';
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

    recipientLabel(recipient: Recipient) {
        switch (recipient.data.type) {
            case 'users':
                return m('.RecipientLabel', username(recipient as User));
            case 'groups':
                const group = recipient as Group;
                return m('.RecipientLabel', group.color() ? {
                    className: 'colored',
                    style: {
                        backgroundColor: group.color(),
                    },
                } : {}, [
                    group.icon() ? [
                        icon(group.icon()!),
                        ' ',
                    ] : null,
                    group.namePlural(),
                ]);
        }

        return '[unknown]';
    }

    searchResultKind(recipient: Recipient) {
        switch (recipient.data.type) {
            case 'users':
                return app.translator.trans('huseyinfiliz-notificationhub.forum.recipient_kinds.user');
            case 'groups':
                return app.translator.trans('huseyinfiliz-notificationhub.forum.recipient_kinds.group');
        }

        return '[unknown]';
    }

    selectResult(result: Recipient | null) {
        if (!result) {
            return;
        }

        this.recipients.push(result);
        this.filter = '';
        this.searchResults = [];
        m.redraw();
    }
    content() {
        const notificationTypeOptions: { [key: string]: string } = {};
        let notificationTypeSelect = "Custom";

        if (this.notificationTypes && this.notificationTypes.length > 0) {
            this.notificationTypes.forEach(type => {
                notificationTypeOptions[type.id] = type.attributes.name;
            });

            notificationTypeSelect = m(Select, {
                options: notificationTypeOptions,
                value: this.selectedNotificationType,
                onchange: (value: string) => {
                    this.selectedNotificationType = value;
                    const selectedType = this.notificationTypes!.find(type => type.id === value);
                    if (selectedType) {
                        this.updateFields(selectedType);
                    }
                },
                disabled: this.sending,
            });
        } else {
            notificationTypeSelect = m('p', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.no_notification_types'));
        }

        return m('.Modal-body', m('form.Form', {
            onsubmit: this.onsubmit.bind(this),
        }, [
            m('.Form-group', [
                m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.recipients_label')),
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
                        placeholder: app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.recipients_placeholder'),
                        value: this.filter,
                        oninput: (event: InputEvent) => {
                            this.filter = (event.target as HTMLInputElement).value;
                            this.performNewSearch();
                        },
                        onkeydown: this.navigator.navigate.bind(this.navigator),
                        onfocus: () => {
                            this.focused = true;
                        },
                        onblur: () => {
                            this.focused = false;
                        },
                        disabled: this.sending,
                    }),
                    this.loadingResults ? LoadingIndicator.component({
                        size: 'small',
                    }) : null,
                    this.searchResults.length ? m('ul.Dropdown-menu', this.searchResults.map(
                        (result, index) => m('li', {
                            className: this.searchIndex === index ? 'active' : '',
                            onclick: () => {
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
                m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.notification_type_label')),
                this.loadingTypes
                    ? m(LoadingIndicator, { size: 'small' })
                    : notificationTypeSelect,
            ]),
            m('.Form-group', [
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
            ]),

            m('.Form-group', [
                m('label', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.url_label')),
                m('input[type=text].FormControl', {
                    value: this.notificationUrl,
                    oninput: (event: InputEvent) => {
                        this.notificationUrl = (event.target as HTMLInputElement).value;
                    },
                    placeholder: app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.url_placeholder'),
                    disabled: this.sending,
                }),
            ]),
            m('.Form-group', [
                m('label',
                    app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.preview_title')
                ),
                m('.NotificationPreview-content',
                    m('ul.NotificationGroup-content',
                        m('li',
                            m('a.Notification.Notification--customNotification', [
                                m('span.Avatar.Notification-avatar',
                                    {
                                        className: 'Avatar Notification-avatar',
                                        style: app.session.user
                                            ? {
                                              'background-image': app.session.user.avatarUrl() ? `url(${app.session.user.avatarUrl()})` : null,
                                              'background-color': !app.session.user.avatarUrl() ? '#e5a2a0' : null
                                            }
                                            : {} // Varsayılan stil veya boş obje
                                    },
                                    app.session.user && !app.session.user.avatarUrl()
                                        ? app.session.user.username()?.charAt(0).toUpperCase()
                                        : null
                                ),
                                m('i.icon.Notification-icon', { className: this.notificationIcon ? `icon ${this.notificationIcon} Notification-icon` : 'icon fas fa-bell Notification-icon' }),
                                m('span.Notification-title',
                                    m('span.Notification-content',
                                        m('div.NotificationPreview-messageText', this.messageText || m('em', app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.preview_message_placeholder')))
                                    ),
                                    m('span.Notification-title-spring')
                                ),
                                m('div.Notification-excerpt', this.selectedNotificationType ? String(this.notificationTypes?.find(type => type.id === this.selectedNotificationType)?.attributes.excerpt_key) : "")
                            ])
                        )
                    )
                ),
            ]),
            m('.Form-group', [
                Button.component({
                    type: 'submit',
                    className: 'Button Button--primary SendNotificationModal-send',
                    loading: this.sending,
                    disabled: this.recipients.length === 0 || this.messageText === '' || !this.selectedNotificationType,
                }, app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.submit_button'))
            ]),
        ]));
    }

    performNewSearch() {
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
                }).then(() => {
                    this.loadingResults = false;
                    this.buildSearchResults(query);
                    m.redraw();
                });
            }, 250) as any;
        }
    }

    buildSearchResults(query: string) {
        if (!query) {
            this.searchResults = [];
            return;
        }

        const results: Recipient[] = [];

        if (app.forum.huseyinfilizNotificationAll()) {
            app.store.all<Group>('groups').forEach(group => {
                if (group.id() === Group.GUEST_ID) {
                    return;
                }

                if (group.nameSingular().toLowerCase().indexOf(query) !== -1 || group.namePlural().toLowerCase().indexOf(query) !== -1) {
                    results.push(group);
                }
            });
        }

        app.store.all<User>('users').forEach(user => {
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

    onsubmit(event: SubmitEvent) {
        event.preventDefault();
        this.sending = true;
        m.redraw();

        const selectedUsers = this.recipients.filter(r => r.data.type === 'users').map(r => r.id());
        const selectedGroups = this.recipients.filter(r => r.data.type === 'groups').map(r => r.id());
        this.sendNotification(selectedUsers, selectedGroups);
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

        app.request<any>({
            method: 'POST',
            url: app.forum.attribute('apiUrl') + '/notifications/send',
            body: requestBody,
        }).then(
            (response) => {
                m.redraw();

                const successMessage = app.translator.trans('huseyinfiliz-notificationhub.forum.modal_notification.notification_sent_message', {
                    recipientsCount: response.recipientsCount,
                });

                app.alerts.show({ type: 'success' }, successMessage)
                this.hide();
            },
            response => {
                this.sending = false;
                m.redraw();
                this.onerror(response);
                console.error("Error", response);
            }
        );
    }
}
