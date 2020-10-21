import mem from 'mem';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';
import toastr from 'toastr';

import { KonchatNotification } from '../app/ui';
import { ChatSubscription } from '../app/models';
import { roomTypes, handleError } from '../app/utils';
import { call } from '../app/ui-utils';
import { renderRouteComponent } from './reactAdapters';

const getRoomById = mem((rid) => call('getRoomById', rid));

FlowRouter.goToRoomById = async (rid) => {
	if (!rid) {
		return;
	}
	const subscription = ChatSubscription.findOne({ rid });
	if (subscription) {
		return roomTypes.openRouteLink(subscription.t, subscription, FlowRouter.current().queryParams);
	}

	const room = await getRoomById(rid);
	return roomTypes.openRouteLink(room.t, room, FlowRouter.current().queryParams);
};


BlazeLayout.setRoot('body');

FlowRouter.wait();

FlowRouter.route('/', {
	name: 'index',
	action() {
		BlazeLayout.render('main', { center: 'loading' });
		if (!Meteor.userId()) {
			return FlowRouter.go('home');
		}

		Tracker.autorun(function(c) {
			if (FlowRouter.subsReady() === true) {
				Meteor.defer(function() {
					if (Meteor.user() && Meteor.user().defaultRoom) {
						const room = Meteor.user().defaultRoom.split('/');
						FlowRouter.go(room[0], { name: room[1] }, FlowRouter.current().queryParams);
					} else {
						FlowRouter.go('home');
					}
				});
				c.stop();
			}
		});
	},
});

FlowRouter.route('/login', {
	name: 'login',

	action() {
		FlowRouter.go('home');
	},
});

FlowRouter.route('/home', {
	name: 'home',

	action(params, queryParams) {
		KonchatNotification.getDesktopPermission();
		if (queryParams.saml_idp_credentialToken !== undefined) {
			Accounts.callLoginMethod({
				methodArguments: [{
					saml: true,
					credentialToken: queryParams.saml_idp_credentialToken,
				}],
				userCallback(error) {
					if (error) {
						if (error.reason) {
							toastr.error(error.reason);
						} else {
							handleError(error);
						}
					}
					BlazeLayout.render('main', { center: 'home' });
				},
			});
		} else {
			BlazeLayout.render('main', { center: 'home' });
		}
	},
});

FlowRouter.route('/errands/:type?', {
	name: 'errands',
	action: () => {
		renderRouteComponent(() => import('../app/errand/client/views/errandsPage/index'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/invite/council/:id/:step?', {
	name: 'council-invite',
	action: () => {
		renderRouteComponent(() => import('../app/councils/client/views/invite/InviteStepperRoute'));
	},
});

FlowRouter.route('/council/:id', {
	name: 'council',
	action: () => {
		renderRouteComponent(() => import('../app/councils/client/views/Council'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/councils/:context?/:id?', {
	name: 'councils',
	action: () => {
		renderRouteComponent(() => import('../app/councils/client/views/index'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/working-group/:context?/:id?', {
	name: 'working-group',
	action: () => {
		renderRouteComponent(() => import('../app/working-group/client/views/index'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/manual-mail-sender', {
	name: 'manual-mail-sender',
	action: () => {
		renderRouteComponent(() => import('../app/manual-mail-sender/client/views/index'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/protocols/:context?/:id?', {
	name: 'protocols',
	action: () => {
		renderRouteComponent(() => import('../app/protocols/client/views/index'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/protocol/:id/:context?/:sectionId?/:itemId?', {
	name: 'protocol',
	action: () => {
		renderRouteComponent(() => import('../app/protocols/client/views/Protocol'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/directory/:tab?', {
	name: 'directory',
	action: () => {
		renderRouteComponent(() => import('./views/directory/DirectoryPage'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/account/:group?', {
	name: 'account',
	action: () => {
		renderRouteComponent(() => import('./account/AccountRoute'), { template: 'main', region: 'center' });
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}],
});

FlowRouter.route('/terms-of-service', {
	name: 'terms-of-service',
	action: () => {
		Session.set('cmsPage', 'Layout_Terms_of_Service');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/privacy-policy', {
	name: 'privacy-policy',
	action: () => {
		Session.set('cmsPage', 'Layout_Privacy_Policy');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/legal-notice', {
	name: 'legal-notice',
	action: () => {
		Session.set('cmsPage', 'Layout_Legal_Notice');
		BlazeLayout.render('cmsPage');
	},
});

FlowRouter.route('/room-not-found/:type/:name', {
	name: 'room-not-found',
	action: ({ type, name }) => {
		Session.set('roomNotFound', { type, name });
		BlazeLayout.render('main', { center: 'roomNotFound' });
	},
});

FlowRouter.route('/register/:hash', {
	name: 'register-secret-url',
	action: () => {
		BlazeLayout.render('secretURL');
	},
});

FlowRouter.route('/invite/:hash', {
	name: 'invite',
	action: () => {
		BlazeLayout.render('invite');
	},
});

FlowRouter.route('/setup-wizard/:step?', {
	name: 'setup-wizard',
	action: () => {
		renderRouteComponent(() => import('./views/setupWizard/SetupWizardRoute'));
	},
});

FlowRouter.notFound = {
	action: () => {
		renderRouteComponent(() => import('./views/notFound/NotFoundPage'));
	},
};

Meteor.startup(() => {
	FlowRouter.initialize();
});
