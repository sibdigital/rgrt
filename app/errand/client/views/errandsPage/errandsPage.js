import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';
import moment from 'moment';

import { APIClient, t } from '../../../../utils/client';
import { modal } from '../../../../ui-utils/client';
import { settings } from '../../../../settings';
import './errandsPage.html';

const DEBOUNCE_TIME_TO_SEARCH_IN_MS = 500;

Template.ErrandsPage.helpers({
	errands() {
		return Template.instance().errands.get();
	},
	formatDate(date) {
		return moment(date).format(moment.localeData().longDateFormat('L'));
	},
	errandType() {
		return Template.instance().type.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	errandsAreEmpty() {
		return Template.instance().errands.get().length === 0;
	},
	showRealNames() {
		return settings.get('UI_Use_Real_Name');
	},
	currentPage() {
		return Template.instance().offset;
	},
	totalPages() {
		console.log('totalRecords', Template.instance().total.get(), 'recordsPerPage', Template.instance().recordsPerPage.get(), Template.instance().total.get() / Template.instance().recordsPerPage.get(), Math.ceil(Template.instance().total.get() / Template.instance().recordsPerPage.get()));
		return Math.ceil(Template.instance().total.get() / Template.instance().recordsPerPage.get());
	},
});


Template.ErrandsPage.events({
	'input #errand_name'(e, t) {
		t.errandDescription.set(e.target.value);
	},

	'click .table-row'(e, instance) {
		console.log(e.currentTarget.dataset);
		const { id, index } = e.currentTarget.dataset;
		let errand = instance.errands.get();
		errand = _.findWhere(errand, {
			_id: id,
		});
		console.log('click .table-row', errand);
		modal.open({
			title: t('Errand_details'),
			modifier: 'modal',
			content: 'ErrandDetails',
			data: {
				errand,
				updateRecord: instance.updateRecord(Number(index)),
				onCreate() {
					modal.close();
				},
			},
			showConfirmButton: false,
			showCancelButton: false,
			confirmOnEnter: false,
		});
	},

	'input #errand_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},

	'change [name=to__date]'(e, instance) {
		instance.expiredDate.set(e.target.value);
	},
});

Template.ErrandsPage.onRendered(function() {

});


Template.ErrandsPage.onCreated(function() {
	this.errands = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.isLoading = new ReactiveVar(false);
	this.filter = new ReactiveVar('');
	this.recordsPerPage = new ReactiveVar(120);
	this.type = new ReactiveVar(this.data.type && this.data.type() ? this.data.type() : 'all');

	this.updateRecord = (index) => (newRecord) => {
		const errands = this.errands.get();
		console.log(newRecord);
		if (newRecord._id !== errands[index]._id) {
			console.log('Изменяется не тот объект!', 'Новый', newRecord._id, 'старый:', errands[index]._id);
		} else {
			errands[index] = newRecord;
			this.errands.set(errands);
		}
	};

	const userId = Meteor.userId();
	let errandQuerry = {};

	switch (this.type.get()) {
		case 'initiated_by_me':
			errandQuerry = { 'initiatedBy._id': `${ userId }` };
			break;
		case 'charged_to_me':
			errandQuerry = { 'chargedToUser._id': `${ userId }` };
			break;
	}
	this.query = new ReactiveVar(errandQuerry);


	this.onSuccessCallback = () => {
		this.offset.set(0);
		return this.loadErrands(this.query.get(), this.offset.get());
	};

	this.loadErrands = _.debounce(async (query, offset) => {
		this.isLoading.set(true);

		const { errands, total } = await APIClient.v1.get(`errands-on-message.list?count=${ this.recordsPerPage.get() }&offset=${ offset }&query=${ JSON.stringify(query) }`);
		console.log('errands from server', errands);
		this.total.set(total);
		this.errands.set(errands);
		this.isLoading.set(false);
	}, DEBOUNCE_TIME_TO_SEARCH_IN_MS);

	this.autorun(() => {
		const newDataType = this.data.type && this.data.type() ? this.data.type() : 'all';
		if (this.type.get() !== newDataType) {
			let errandQuerry = {};
			this.isLoading.set(true);
			this.errands.set([]);
			const userId = Meteor.userId();
			this.type.set(this.data.type());
			switch (newDataType) {
				case 'initiated_by_me':
					errandQuerry = { 'initiatedBy._id': `${ userId }` };
					break;
				case 'charged_to_me':
					errandQuerry = { 'chargedToUser._id': `${ userId }` };
					break;
			}
			this.query.set(errandQuerry);
		}

		const filter = this.filter.get() && this.filter.get().trim();
		const offset = this.offset.get();
		if (filter) {
			const regex = { $regex: filter, $options: 'i' };
			return this.loadErrands({ name: regex }, offset);
		}
		return this.loadErrands(this.query.get(), offset);
	});
});

const pagesOffset = 2;
Template.Paginator.helpers({

	pages() {
		const totalPages = Template.instance().totalPages.get();
		const currentPage = Template.instance().currentPage.get() + 1;
		const pages = [];
		if (currentPage !== 1) {
			pages.push({
				number: '«',
				classes: 'js-previous-page-button',
				disabled: '',
			});
		}


		let startPage = currentPage - pagesOffset;
		if (startPage <= 0) {
			startPage = 1;
		} else {
			pages.push({
				number: '...',
				classes: '',
				disabled: 'disabled',
			});
		}

		for (let i = startPage; i < currentPage; i++) {
			pages.push({
				number: i,
				classes: 'js-clickable-page-button',
				disabled: '',
			});
		}

		pages.push({
			number: currentPage,
			classes: 'active',
			disabled: '',
		});

		let endPage = currentPage + pagesOffset;
		if (endPage >= totalPages) {
			endPage = totalPages;
		} else {
			pages.push({
				number: '...',
				classes: '',
				disabled: 'disabled',
			});
		}

		for (let i = currentPage + 1; i <= endPage; i++) {
			pages.push({
				number: i,
				classes: 'js-clickable-page-button',
				disabled: '',
			});
		}
		console.log('currentPage', currentPage, 'totalPages', totalPages);
		if (currentPage !== totalPages) {
			pages.push({
				number: '»',
				classes: 'js-next-page-button',
				disabled: '',
			});
		}

		return pages;
	},


});


Template.Paginator.events({

	'click .js-next-page-button'(e, instance) {
		console.log(e.currentTarget.dataset);
		// const { number } = e.currentTarget.dataset;
		const newPage = instance.currentPage.get() + 1;
		instance.currentPage.set(newPage);
	},

	'click .table-row'(e, instance) {
		console.log(e.currentTarget.dataset);
		const { id, index } = e.currentTarget.dataset;
		let errand = instance.errands.get();
		errand = _.findWhere(errand, {
			_id: id,
		});
		modal.open({
			title: t('Errand_details'),
			modifier: 'modal',
			content: 'ErrandDetails',
			data: {
				errand,
				updateRecord: instance.updateRecord(Number(index)),
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

Template.Paginator.onRendered(function() {

});


Template.Paginator.onCreated(function() {
	this.totalPages = new ReactiveVar(this.data.totalPages);
	this.currentPage = this.data.currentPage;
	this.autorun(() => {
		this.totalPages.set(this.data.totalPages);
		this.currentPage = this.data.currentPage;
	});
});
