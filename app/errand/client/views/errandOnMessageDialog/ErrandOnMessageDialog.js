import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';
import moment from 'moment';

import { APIClient, t } from '../../../../utils/client';
import { modal } from '../../../../ui-utils/client';

import './ErrandOnMessageDialog.html';

const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.ErrandOnMessageDialog.helpers({
	errands() {
		return Template.instance().errands.get();
	},
	formatDate(date) {
		return moment(date).format(moment.localeData().longDateFormat('L'));
	},
});


Template.ErrandOnMessageDialog.events({
	'input #errand_name'(e, t) {
		t.errandDescription.set(e.target.value);
	},
	'input #errand_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},

	'change [name=to__date]'(e, instance) {
		instance.expiredDate.set(e.target.value);
	},

	'click .table-row'(e, target) {
		console.log(e.currentTarget.dataset);
		const { id, index } = e.currentTarget.dataset;
		let errand = target.errands.get();
		errand = _.findWhere(errand, {
			_id: id,
		});
		modal.open({
			title: t('Errand_details'),
			modifier: 'modal',
			content: 'ErrandDetails',
			data: {
				errand,
				updateRecord: target.updateRecord(Number(index)),
				onCreate() {
					modal.close();
				},
			},
			showConfirmButton: false,
			showCancelButton: false,
			confirmOnEnter: false,
		});
	},
});

Template.ErrandOnMessageDialog.onRendered(function() {

});


Template.ErrandOnMessageDialog.onCreated(function() {
	this.errands = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.query = new ReactiveVar({});
	this.isLoading = new ReactiveVar(false);
	this.filter = new ReactiveVar('');

	this.updateRecord = (index) => (newRecord) => {
		const errands = this.errands.get();

		if (newRecord._id !== errands[index]._id) {
			console.log('Изменяется не тот объект!', 'Новый', newRecord._id, 'старый:', errands[index]._id);
		} else {
			errands[index] = newRecord;
			this.errands.set(errands);
		}
	};

	const { errand } = this.data;

	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadErrands(this.query.get(), this.offset.get());
	};

	this.loadErrands = _.debounce(async (query, offset) => {
		this.isLoading.set(true);
		this.query.set({ _id: { $in: errand } });
		const { errands, total } = await APIClient.v1.get(`errands-on-message.list?count=${ 10 }&offset=${ offset }&query=${ JSON.stringify(query) }`);
		console.log('errands from server', errands);
		this.total.set(total);
		if (offset === 0) {
			this.errands.set(errands);
		} else {
			this.errands.set(this.errands.get().concat(errands));
		}
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(() => {
		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadErrands({ name: regex }, offset);
		}
		return this.loadErrands({ _id: { $in: errand } }, offset);
	});
});
