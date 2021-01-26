import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { settings } from '../../../../settings';
import { t } from '../../../../utils';
import { AccountBox, menu, modal } from '../../../../ui-utils';
import { hasAtLeastOnePermission, hasPermission } from '../../../../authorization';

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

const toolbarButtons = () => [
	{
		name: t('Councils'),
		icon: 'events',
		context: 'home',
		// condition: () => hasPermission('manage-councils'),
		action: () => {
			FlowRouter.go('councils');
		},
	},
	{
		name: t('Protocols'),
		icon: 'errand',
		context: 'home',
		//condition: () => hasPermission('manage-working-errand'),
		action: () => {
			menu.close();
			FlowRouter.go('/protocols');
		},
	},
	{
		name: t('Working_group_requests'),
		icon: 'working_group',
		context: 'home',
		action: () => {
			menu.close();
			FlowRouter.go('working-groups-requests');
		},
	},
	{
		name: t('Errands_from_me'),
		icon: 'errands_from_me',
		context: 'home',
		action: () => {
			menu.close();
			FlowRouter.go('/errands/initiated_by_me');
		},
	},
	{
		name: t('Errands_for_me'),
		icon: 'errands_to_me',
		context: 'home',
		action: () => {
			menu.close();
			FlowRouter.go('/errands/charged_to_me');
		},
	},
	{
		name: t('Interaction'),
		icon: 'plus',
		context: 'home',
		openContext: 'interaction',
	},
	{
		name: t('Handbooks'),
		icon: 'help',
		context: 'home',
		openContext: 'handbooks',
		// condition: () => hasPermission('handbooks-home-page'),
	},
	// {
	// 	name: t('Counsel'),
	// 	icon: 'events',
	// 	context: 'councils',
	// 	condition: () => hasPermission('manage-councils'),
	// 	action: () => {
	// 		menu.close();
	// 		FlowRouter.go('councils');
	// 	},
	// },
	{
		name: t('Working_group_meetings'),
		icon: 'working_group_meetings',
		context: 'councils',
		condition: () => hasPermission('manage-working-group'),
		action: () => {
			menu.close();
			FlowRouter.go('working-group-meetings');
		},
	},
	{
		name: t('Directory'),
		icon: 'discover',
		context: 'handbooks',
		action: () => {
			menu.close();
			FlowRouter.go('directory');
		},
	},
	{
		name: t('Send_email'),
		icon: 'mail',
		context: 'interaction',
		condition: () => hasPermission('send-mail-manually'),
		action: () => {
			menu.close();
			FlowRouter.go('manual-mail-sender');
		},
	},
	{
		name: t('Working_group'),
		icon: 'working_group',
		context: 'handbooks',
		action: () => {
			menu.close();
			FlowRouter.go('working-group');
		},
	},
	{
		name: t('Working_group_composition'),
		icon: 'team',
		context: 'handbooks',
		condition: () => hasPermission('manage-working-group'),
		action: () => {
			menu.close();
			FlowRouter.go('composition-of-the-working-group');
		},
	},
	{
		name: t('Persons'),
		icon: 'team',
		context: 'handbooks',
		// condition: () => hasPermission('manage-persons'),
		action: () => {
			FlowRouter.go('persons');
		},
	},
	{
		name: t('Create_new') + ' ' + t('Channel'),
		icon: 'hashtag',
		context: 'interaction',
		condition: () => hasAtLeastOnePermission(['administration-home-page', 'create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user']),
		// hasPopup: true,
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
			}, () => {
				// console.log(Template.instance().context.set(context));
				// if (!confirm) {
				//
				// 	return;
				// }
			});
			// return cretateInteractionActions('Create_A_New_Channel', 'createChannel')(e);
		},
	},
	{
		name: t('Create_new') + ' ' + t('Direct_Messages'),
		icon: 'team',
		context: 'interaction',
		condition: () => hasAtLeastOnePermission(['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user']),
		// hasPopup: true,
		action: (e) => {
			return cretateInteractionActions('Direct_Messages', 'CreateDirectMessage')(e);
		},
	},
	{
		name: t('Create_new') + ' ' + t('Discussion'),
		icon: 'discussion',
		context: 'interaction',
		condition: () => hasAtLeastOnePermission(['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user']),
		// hasPopup: true,
		action: (e) => {
			return cretateInteractionActions('Discussion_title', 'CreateDiscussion')(e);
		},
	},
	{
		name: t('Administration'),
		icon: 'customize',
		context: 'home',
		openContext: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		// action: () => {
		// 	menu.close();
		// 	FlowRouter.go('admin', { group: 'info' });
		// },
	},
	{
		name: t('Info'),
		icon: 'info-circled',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'info' });
		},
	},
	{
		name: t('Import'),
		icon: 'import',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'import' });
		},
	},
	{
		name: t('Users'),
		icon: 'team',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'users' });
		},
	},
	{
		name: t('Rooms'),
		icon: 'hashtag',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'rooms' });
		},
	},
	{
		name: t('Invites'),
		icon: 'user-plus',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'invites' });
		},
	},
	{
		name: t('Custom_Sounds'),
		icon: 'volume',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'custom-sounds' });
		},
	},
	{
		name: t('Apps'),
		icon: 'cube',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'apps' });
		},
	},
	{
		name: t('Permissions'),
		icon: 'lock',
		context: 'administration',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'permissions' });
		},
	},
];

Template.home.helpers({
	body() {
		return settings.get('Layout_Home_Body');
	},
	toolbarButtons() {
		return toolbarButtons().filter((button) => !button.condition || button.condition());
	},
});

Template.gridOfIcons.helpers({
	toolbarButtons() {
		let context = Template.instance().context.get();
		if (!context) {
			context = 'interactions';
		}
		return toolbarButtons().filter((button) => (!button.condition || button.condition()) && context === button.context);
	},
	notHome() {
		return Template.instance().context.get() !== 'home';
	},
	title() {
		let title = t('Layout_Home_Title');
		const context = Template.instance().context.get();
		switch (context) {
			case 'councils':
				title = t('Councils');
				break;
			case 'interaction':
				title = t('Interaction');
				break;
			case 'handbooks':
				title = t('Handbooks');
				break;
			case 'administration':
				title = t('Administration');
				break;
			default:
				break;
		}
		return title;
	},
});

Template.gridOfIcons.onCreated(function() {
	this.context = new ReactiveVar('home');
});

Template.gridOfIcons.events({
	'click .js-button'(e, instance) {
		console.log(instance.context.get());
		console.log(this);
		instance.context.set(this.openContext);

		if (document.activeElement === e.currentTarget) {
			e.currentTarget.blur();
		}
		return this.action && this.action.apply(this, [e]);
	},
	'click .js-button-back'(e) {
		Template.instance().context.set('home');
	},
});
