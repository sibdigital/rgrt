import React, { useMemo } from 'react';
import 'react-phone-input-2/lib/style.css';
import _ from 'underscore';

import { useForm } from '../../../../../client/hooks/useForm';
import { ErrandTypes } from '../../utils/ErrandTypes';
import { ErrandStatuses } from '../../utils/ErrandStatuses';
import { DefaultErrandFields, ErrandByProtocolItemFields, ErrandByRequestFields } from './ErrandFields';
import { t } from '../../../../utils';

require('react-datepicker/dist/react-datepicker.css');

export const defaultErrandFields = Object.freeze({
	errandType: { value: ErrandTypes.default, required: true },
	status: { value: ErrandStatuses.OPENED, required: true },
	ts: { value: new Date(), required: false },
	initiatedBy: { value: {}, required: false },
	chargedTo: { value: {}, required: false },
	desc: { value: '', required: true },
	expireAt: { value: new Date(), required: true },
	commentary: { value: '', required: false },
});

export const defaultErrandByProtocolItemFields = Object.freeze({
	...defaultErrandFields,
	errandType: { value: ErrandTypes.byProtocolItem, required: true },
	protocol: { value: {}, required: true },
});

export const defaultErrandByRequestFields = Object.freeze({
	...defaultErrandFields,
	errandType: { value: ErrandTypes.byRequestAnswer, required: true },
	commentary: { value: '', required: true },
	sender: { value: { group: '', organization: '', phone: '', email: '' }, required: true },
	answerType: { value: {}, required: true },
	protocol: { value: {}, required: false },
	mail: { value: '', required: false },
	documents: { value: [], required: true },
});

export function getDefaultErrandFields({ errand, errandType = ErrandTypes.default }) {
	let fields = defaultErrandFields;

	switch (errandType.key) {
		case ErrandTypes.byProtocolItem.key:
			fields = defaultErrandByProtocolItemFields;
			break;
		case ErrandTypes.byRequestAnswer.key:
			fields = defaultErrandByRequestFields;
			break;
		default:
			break;
	}

	if (!errand || typeof errand !== 'object' || errand.length) {
		return fields;
	}

	const newErrand = { ...errand };

	const errandKeys = Object.keys(errand);

	const defaultErrandFieldsKeys = Object.keys(fields);

	defaultErrandFieldsKeys.forEach((key) => {
		if (errandKeys.includes(key)) {
			newErrand[key] = { value: errand[key], required: fields[key].required };
		} else {
			newErrand[key] = fields[key];
		}
	});
	if (!newErrand.errandType.key) {
		newErrand.errandType = { value: errandType, required: fields.errandType.required };
	}

	errand.expireAt && fields.expireAt && Object.assign(newErrand, { expireAt: { value: errand.expireAt ? new Date(errand.expireAt) : new Date(), required: fields.expireAt.required } });
	errand.ts && fields.ts && Object.assign(newErrand, { ts: { value: errand.ts ? new Date(errand.ts) : new Date(), required: fields.ts.required } });

	return newErrand;
}

export function useDefaultErrandForm({ defaultValues = null, errandType = ErrandTypes.default }) {
	const {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	} = useForm(defaultValues ? getDefaultErrandFields({ errand: defaultValues, errandType }) : defaultErrandFields);

	const allFieldAreFilled = useMemo(() => Object.entries(values).filter((val) => {
		const [key, _value] = val;
		const { value, required } = _value;
		// console.log({ _value });

		if (!required) { return false; }
		if (typeof value === 'string' && value.trim() !== '') { return false; }
		if (typeof value === 'object' && value !== undefined && value !== null) { return false; }
		if (value && _.isArray(value) && value.length > 0) { return false; }
		return value?.toString().trim() === '';
	}).length === 0, [values]);

	const senderFieldAreFilled = useMemo(() => (errandType === ErrandTypes.byRequestAnswer ? Object.entries(values?.sender ?? {}).filter((val) => {
		const [key, value] = val;

		console.dir({ key, value });

		if (typeof value === 'string' && value.trim() !== '') { return false; }
		if (typeof value === 'object' && value !== undefined && value !== null) { return false; }
		if (value && _.isArray(value) && value.length > 0) { return false; }
		return value?.toString().trim() === '';
	}) : true), [errandType, values.sender]);

	return {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
		allFieldAreFilled,
		allRequiredFieldAreFilled: senderFieldAreFilled,
	};
}

export function getErrandFieldsForSave({ errand, errandType = ErrandTypes.default }) {
	if (!errand || typeof errand !== 'object' || errand.length) {
		return {};
	}

	let fields = defaultErrandFields;

	switch (errandType.key) {
		case ErrandTypes.default.key:
			break;
		case ErrandTypes.byProtocolItem.key:
			fields = defaultErrandByProtocolItemFields;
			break;
		case ErrandTypes.byRequestAnswer.key:
			fields = defaultErrandByRequestFields;
			break;
		default:
			break;
	}
	// console.dir({ fieldsGet: fields, errand });

	const newErrand = { ...errand, createdAt: new Date(errand.createdAt && errand.createdAt) };

	const errandKeys = Object.keys(errand);
	const fieldsKeys = Object.keys(fields);

	fieldsKeys.forEach((key) => {
		if (errandKeys.includes(key)) {
			newErrand[key] = errand[key]?.value ?? '';
		} else {
			newErrand[key] = fields[key].value;
		}
	});
	if (newErrand.documents && errand.documents) {
		newErrand.documents = errand.documents.value?.filter((doc) => doc._id);
	}

	newErrand.status = { ...newErrand.status, i18nLabel: t(newErrand.status.i18nLabel) };
	newErrand.errandType = { key: newErrand.errandType.key, state: newErrand.errandType.state, title: newErrand.errandType.title, i18nLabel: t(newErrand.errandType.i18nLabel) };
	newErrand.answerType && Object.assign(newErrand, { answerType: { ...newErrand.answerType, i18nLabel: t(newErrand.answerType.i18nLabel) } });
	newErrand.chargedTo && Object.assign(newErrand, { chargedTo: { person: { ...newErrand.chargedTo } } });
	errand.expireAt?.value && Object.assign(newErrand, { expireAt: new Date(errand.expireAt.value) });
	errand.ts?.value && Object.assign(newErrand, { ts: new Date(errand.ts.value) });

	return newErrand;
}

function ErrandForm({
	defaultValues = null,
	defaultHandlers = null,
	onReadOnly = false,
	errandType = ErrandTypes.default,
	request = null,
	setContext,
	items,
	setItems,
	errandId,
}) {
	const {
		newValues,
		newHandlers,
	} = useDefaultErrandForm({ });

	const values = useMemo(() => defaultValues ?? newValues, [defaultValues, newValues]);
	const handlers = useMemo(() => defaultHandlers ?? newHandlers, [defaultHandlers, newHandlers]);

	const inputStyles = useMemo(() => ({ wordBreak: 'break-word', whiteSpace: 'pre-wrap', border: onReadOnly ? '' : '1px solid #4fb0fc' }), [onReadOnly]);
	const marginBlockEnd = useMemo(() => ({ marginBlockEnd: '1rem !important' }), []);

	let view = <DefaultErrandFields inputStyles={inputStyles} marginBlockEnd={marginBlockEnd} handlers={handlers} values={values} setContext={setContext}/>;

	switch (errandType) {
		case ErrandTypes.default:
			break;
		case ErrandTypes.byProtocolItem:
			view = <ErrandByProtocolItemFields inputStyles={inputStyles} marginBlockEnd={marginBlockEnd} handlers={handlers} values={values}/>;
			break;
		case ErrandTypes.byRequestAnswer:
			view = <ErrandByRequestFields errandId={errandId} inputStyles={inputStyles} marginBlockEnd={marginBlockEnd} handlers={handlers} values={values} request={request} setItems={setItems} items={items} setContext={setContext}/>;
			break;
		default:
			break;
	}

	return view;
}

export default ErrandForm;
