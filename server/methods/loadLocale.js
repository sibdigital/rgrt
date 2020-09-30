import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import moment from 'moment';

import { getMomentLocale } from '../lib/getMomentLocale';

Meteor.methods({
	loadLocale(locale) {
		check(locale, String);
		moment.locale(locale);
		try {
			return getMomentLocale(locale);
		} catch (error) {
			throw new Meteor.Error(error.message, `Moment locale not found: ${ locale }`);
		}
	},
});
