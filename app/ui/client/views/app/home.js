import { Template } from 'meteor/templating';

import { settings } from '../../../../settings';
import { t } from '/app/utils';
import { FlowRouter } from "meteor/kadira:flow-router";
import { AccountBox, menu, modal, popover } from '/app/ui-utils';
import { hasAtLeastOnePermission, hasPermission } from '/app/authorization';


const toolbarButtons = () => [
	{
		name: t('Directory'),
		icon: 'discover',
		action: () => {
			menu.close();
			FlowRouter.go('directory');
		},
	},
	{
		name: t('Send_email'),
		icon: 'mail',
		condition: () => hasPermission('send-mail-manually'),
		action: () => {
			menu.close();
			FlowRouter.go('manual-mail-sender');
		},
	},
	{
		name: t('Councils'),
		icon: 'team',
		condition: () => hasPermission('manage-councils'),
		action: () => {
			menu.close();
			FlowRouter.go('councils');
		},
	},
	{
		name: t('Working_group'),
		icon: 'team',
		condition: () => hasPermission('manage-working-group'),
		action: () => {
			menu.close();
			FlowRouter.go('working-group');
		},
	},
	{
		name: t('Working_group_composition'),
		icon: 'team',
		condition: () => hasPermission('manage-working-group'),
		action: () => {
			menu.close();
			FlowRouter.go('composition-of-the-working-group');
		},
	},
	{
		name: t('Working_group_meetings'),
		icon: 'team',
		condition: () => hasPermission('manage-working-group'),
		action: () => {
			menu.close();
			FlowRouter.go('working-group-meetings');
		},
	},
	{
		name: t('Create_new'),
		icon: 'edit-rounded',
		condition: () => hasAtLeastOnePermission(['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user']),
		hasPopup: true,
		action: (e) => {
			const action = (title, content) => (e) => {
				e.preventDefault();
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

			const createChannel = action('Create_A_New_Channel', 'createChannel');
			const createDirectMessage = action('Direct_Messages', 'CreateDirectMessage');
			const createDiscussion = action('Discussion_title', 'CreateDiscussion');


			const items = [
				hasAtLeastOnePermission(['create-c', 'create-p'])
				&& {
					icon: 'hashtag',
					name: t('Channel'),
					action: createChannel,
				},
				hasPermission('create-d')
				&& {
					icon: 'team',
					name: t('Direct_Messages'),
					action: createDirectMessage,
				},
				settings.get('Discussion_enabled') && hasAtLeastOnePermission(['start-discussion', 'start-discussion-other-user'])
				&& {
					icon: 'discussion',
					name: t('Discussion'),
					action: createDiscussion,
				},
			].filter(Boolean);

			if (items.length === 1) {
				return items[0].action(e);
			}

			const config = {
				columns: [
					{
						groups: [
							{
								items,
							},
						],
					},
				],
				currentTarget: e.currentTarget,
				offsetVertical: e.currentTarget.clientHeight + 10,
			};
			popover.open(config);
		},
	},
	{
		name: t('Administration'),
		icon: 'customize',
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			menu.close();
			FlowRouter.go('admin', { group: 'info' });
		},
	},
	{
		name: t('Errands_from_me'),
		icon: 'errand',
		//condition: () => hasPermission('manage-working-errand'),
		action: () => {
			menu.close();
			FlowRouter.go('/errands/initiated_by_me');
		},
	},
	{
		name: t('Errands_for_me'),
		icon: 'errand',
		//condition: () => hasPermission('manage-working-errand'),
		action: () => {
			menu.close();
			FlowRouter.go('/errands/charged_to_me');
		},
	}];

Template.home.helpers({
	title() {
		return settings.get('Layout_Home_Title');
	},
	body() {
		return settings.get('Layout_Home_Body');
	},
	toolbarButtons() {
		return toolbarButtons().filter((button) => !button.condition || button.condition());
	},
});

Template.gridOfIcons.helpers({
	toolbarButtons() {
		return toolbarButtons().filter((button) => !button.condition || button.condition());
	},
});

Template.gridOfIcons.events({
	'click .js-button'(e) {
		if (document.activeElement === e.currentTarget) {
			e.currentTarget.blur();
		}
		return this.action && this.action.apply(this, [e]);
	},
});
