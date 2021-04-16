import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { t } from '../../utils';
import { AccountBox } from '../../ui-utils';
import { hasAtLeastOnePermission } from '../../authorization';
import { Users } from '../../models';

const menuItems = () => [
	{
		name: t('Home'),
		icon: 'home',
		action: () => {
			Session.set('gridOfIcons/context', 'home');
			FlowRouter.go('/');
		},
	},
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
		// condition: () => hasPermission('manage-working-group-requests'),
		action: () => {
			FlowRouter.go('working-groups-requests');
		},
	},
	{
		name: t('Errands_from_me'),
		condition: () => Users.isUserInRole(Meteor.userId(), 'secretary') || Users.isUserInRole(Meteor.userId(), 'admin'),
		action: () => {
			FlowRouter.go('/errands/initiated_by_me');
		},
	},
	{
		name: t('Errands_for_me'),
		condition: () => !Users.isUserInRole(Meteor.userId(), 'secretary') || Users.isUserInRole(Meteor.userId(), 'admin'),
		action: () => {
			FlowRouter.go('/errands/charged_to_me');
		},
	},
	{
		name: t('Interaction'),
		action: () => {
			Session.set('gridOfIcons/context', 'interaction');
			FlowRouter.go('/');
		},
	},
	{
		name: t('Council Commission'),
		action: () => {
			FlowRouter.go('/council-commission');
		},
	},
	{
		name: t('Administration'),
		condition: () => AccountBox.getItems().length || hasAtLeastOnePermission(['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions']),
		action: () => {
			Session.set('gridOfIcons/context', 'administration');
			FlowRouter.go('/');
		},
	},
]

Template.menuBar.helpers({
	menuItems() {
		return menuItems().filter((button) => (!button.condition || button.condition()));
	},
})

Template.menuBar.events({
	'click .nav-item'(e, instance) {
		return this.action && this.action.apply(this, [e]);
	},
});
