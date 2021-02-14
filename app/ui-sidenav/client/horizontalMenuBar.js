
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { t } from '../../utils';
import { AccountBox, modal } from '../../ui-utils';
import { hasAtLeastOnePermission, hasPermission } from '../../authorization';

const cretateInteractionActions = (title, content) => (e) => {
	modal.open({
		title: t(title),
		content,
		data: {
			onCreate() {
				modal.close();
			},
		},
		modifier: 'modal',
		showConfirmButton: false,
		showCancelButton: false,
		confirmOnEnter: false,
	});
};

const menuItems = () => [
	{
		name: t('Councils'),
		action: () => {
			FlowRouter.go('councils');
		},
	},
	{
		name: t('Protocols'),
		action: () => {
			FlowRouter.go('/protocols');
		},
	},
	{
		name: t('Working_group_requests'),
		action: () => {
			FlowRouter.go('working-groups-requests');
		},
	},
	{
		name: t('Errands_from_me'),
		action: () => {
			FlowRouter.go('/errands/initiated_by_me');
		},
	},
	{
		name: t('Errands_for_me'),
		action: () => {
			FlowRouter.go('/errands/charged_to_me');
		},
	},
	{
		name: t('Interaction'),
		subItems: [
			{
				name: t('Send_email'),
				action: () => {
					FlowRouter.go('manual-mail-sender');
				},
			},
			{
				name: t('Create_new') + ' ' + t('Channel'),
				action: (e) => {
					e.preventDefault();
					modal.open({
						title: t('Create_A_New_Channel'),
						content: 'createChannel',
						data: {
							onCreate() {
								modal.close();
							},
						},
						modifier: 'modal',
						showConfirmButton: false,
						showCancelButton: false,
						confirmOnEnter: false,
					}, () => {});
					
				},
			},
			{
				name: t('Create_new') + ' ' + t('Direct_Messages'),
				action: (e) => {
					return cretateInteractionActions('Direct_Messages', 'CreateDirectMessage')(e);
				},
			},
			{
				name: t('Create_new') + ' ' + t('Discussion'),

				action: (e) => {
					return cretateInteractionActions('Discussion_title', 'CreateDiscussion')(e);
				},
			},
			{
				name: t('Directory'),
				action: () => {
					FlowRouter.go('directory');
				},
			},
		]
	}, 
	{
		name: 'Комиссия госсовета "Транспорт"',
		//subItems: []
	},
	{
		name: t('Administration'),
		subItems: [
			{
				name: t('Info'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'info' });
				},
			},
			{
				name: t('Import'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'import' });
				},
			},
			{
				name: t('Users'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'users' });
				},
			},
			{
				name: t('Rooms'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'rooms' });
				},
			},
			{
				name: t('Invites'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'invites' });
				},
			},
			{
				name: t('Custom_Sounds'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'custom-sounds' });
				},
			},
			{
				name: t('Apps'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'apps' });
				},
			},
			{
				name: t('Permissions'),
				condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
				action: () => {
					FlowRouter.go('admin', { group: 'permissions' });
				},
			},
			{
				name: t('Working_group'),
				action: () => {
					FlowRouter.go('working-group');
				},
			},
			{
				name: t('Working_group_composition'),
				condition: () => hasPermission('manage-working-group'),
				action: () => {
					FlowRouter.go('composition-of-the-working-group');
				},
			},
			{
				name: t('Persons'),
				action: () => {
					FlowRouter.go('persons');
				},
			},
		]
	},
]

Template.menuBar.helpers({
	menuItems() {
		return menuItems().filter((button) => (!button.condition || button.condition()));
	},
})

Template.menuBar.events({
	'click .goToSection'(e, instance) {
		console.log(this);

		return this.action && this.action.apply(this, [e]);
	},
	'click .submenu-link'(e, instance) {
		console.log(this);
		return this.action && this.action.apply(this, [e]);
	}
})