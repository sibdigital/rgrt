import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { popover, AccountBox, menu, SideNav, modal } from '../../ui-utils';
import { t } from '../../utils';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';
import { hasAtLeastOnePermission } from '../../authorization';
import { userStatus } from '../../user-status';
import { hasPermission } from '../../authorization/client';
import { createTemplateForComponent } from '../../../client/reactAdapters';


const setStatus = (status, statusText) => {
	AccountBox.setStatus(status, statusText);
	callbacks.run('userStatusManuallySet', status);
	popover.close();
};

const showToolbar = new ReactiveVar(false);

export const toolbarSearch = {
	shortcut: false,
	show(fromShortcut) {
		menu.open();
		showToolbar.set(true);
		this.shortcut = fromShortcut;
	},
	close() {
		showToolbar.set(false);
		if (this.shortcut) {
			menu.close();
		}
	},
};

const toolbarButtons = (/* user */) => [
	{
		name: t('Home'),
		icon: 'home',
		condition: () => settings.get('Layout_Show_Home_Button'),
		action: () => {
			menu.close();
			FlowRouter.go('home');
		},
	},
	{
		name: t('Search'),
		icon: 'magnifier',
		action: () => {
			toolbarSearch.show(false);
		},
	},
	{
		name: t('Sort'),
		icon: 'sort',
		hasPopup: true,
		action: async (e) => {
			const options = [];
			const config = {
				template: createTemplateForComponent('SortList', () => import('../../../client/components/SortList')),
				currentTarget: e.currentTarget,
				data: {
					options,
				},
				offsetVertical: e.currentTarget.clientHeight + 10,
			};
			popover.open(config);
		},
	}];
Template.sidebarHeader.helpers({
	myUserInfo() {
		const id = Meteor.userId();

		if (id == null && settings.get('Accounts_AllowAnonymousRead')) {
			return {
				username: 'anonymous',
				status: 'online',
			};
		}
		return id && Meteor.users.findOne(id, { fields: {
			username: 1, status: 1, statusText: 1,
		} });
	},
	toolbarButtons() {
		return toolbarButtons(/* Meteor.userId() */).filter((button) => !button.condition || button.condition());
	},
	homeButton(titleButton) {
		return titleButton === 'Home';
	},
	getButtonStyle(titleButton) {
		if (titleButton === 'Home') {
			return 'margin-left: auto;';
		}
		return '';
	},
	showToolbar() {
		return showToolbar.get();
	},
});

Template.sidebarHeader.events({
	'click .js-button'(e) {
		if (document.activeElement === e.currentTarget) {
			e.currentTarget.blur();
		}
		return this.action && this.action.apply(this, [e]);
	},
	'click .sidebar__header .avatar'(e) {
		if (!(Meteor.userId() == null && settings.get('Accounts_AllowAnonymousRead'))) {
			const user = Meteor.user();
			const STATUS_MAP = [
				'offline',
				'online',
				'away',
				'busy',
			];
			const userStatusList = Object.keys(userStatus.list).map((key) => {
				const status = userStatus.list[key];
				const name = status.localizeName ? t(status.name) : status.name;
				const modifier = status.statusType || user.status;
				const defaultStatus = STATUS_MAP.includes(status.id);
				const statusText = defaultStatus ? null : name;

				return {
					icon: 'circle',
					name,
					modifier,
					action: () => setStatus(status.statusType, statusText),
				};
			});

			const statusText = user.statusText || t(user.status);

			userStatusList.push({
				icon: 'edit',
				name: t('Edit_Status'),
				type: 'open',
				action: (e) => {
					e.preventDefault();
					modal.open({
						title: t('Edit_Status'),
						content: 'editStatus',
						data: {
							onSave() {
								modal.close();
							},
						},
						modalClass: 'modal',
						showConfirmButton: false,
						showCancelButton: false,
						confirmOnEnter: false,
					});
				},
			});

			const config = {
				popoverClass: 'sidebar-header',
				columns: [
					{
						groups: [
							{
								title: user.name,
								items: [{
									icon: 'circle',
									name: statusText,
									modifier: user.status,
								}],
							},
							{
								title: t('User'),
								items: userStatusList,
							},
							{
								items: [
									{
										icon: 'user',
										name: t('My_Account'),
										type: 'open',
										id: 'account',
										action: () => {
											FlowRouter.go('account');
											popover.close();
										},
									},
									{
										icon: 'sign-out',
										name: t('Logout'),
										type: 'open',
										id: 'logout',
										action: () => {
											Meteor.logout(() => {
												callbacks.run('afterLogoutCleanUp', user);
												Meteor.call('logoutCleanUp', user);
												FlowRouter.go('home');
												popover.close();
											});
										},
									},
								],
							},
						],
					},
				],
				currentTarget: e.currentTarget,
				offsetVertical: e.currentTarget.clientHeight + 10,
			};

			popover.open(config);
		}
	},
});
