import React, { useCallback, useMemo } from 'react';
import { Box, Field, Margins, Select, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import DatePicker from 'react-datepicker';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../client/hooks/useForm';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';

require('react-datepicker/dist/react-datepicker.css');

export const AnswerTypeEnum = Object.freeze({
	PROTOCOL: 1,
	MAIL: 2,
});

export const AnswerTypes = Object.freeze({
	PROTOCOL: { state: 1, title: 'Working_group_request_for_protocol_item', i18nLabel: 'Working_group_request_for_protocol_item', key: 'Protocol' },
	MAIL: { state: 2, title: 'Working_group_request_for_mail', i18nLabel: 'Working_group_request_for_mail', key: 'Mail' },
});

export const defaultAnswerFields = {
	sender: {},
	unread: false,
	ts: new Date(),
	answerType: AnswerTypes.MAIL,
	protocolId: '',
	sectionItemsId: [],
	protocol: {},
	mail: '',
	commentary: '',
	documents: [],
};

export const defaultErrandAnswerFields = {
	sender: {},
	expireAt: new Date(),
	answerType: {},
	errandType: {},
	protocol: {},
	mail: '',
	commentary: '',
	documents: [],
	chargedTo: {},
	status: {},
};

export function getAnswerErrandFields({ answer }) {
	if (!answer || typeof answer !== 'object' || answer.length) {
		return defaultErrandAnswerFields;
	}
	// eslint-disable-next-line react-hooks/rules-of-hooks
	const formatDateAndTime = useFormatDateAndTime();

	const errandAnswer = {};

	const defaultErrandAnswerFieldsKeys = Object.keys(defaultErrandAnswerFields);

	const errandAnswerKeys = Object.keys(answer);

	defaultErrandAnswerFieldsKeys.forEach((key) => {
		if (key === 'protocol') {
			errandAnswer.protocol = {
				_id: answer?.protocol?._id ?? '',
				title: ['Протокол от ', formatDateAndTime(answer?.protocol?.d ? new Date(answer.protocol.d) : new Date())].join(''),
				num: parseInt(answer?.protocol?.num ?? ''),
				d: answer?.protocol?.d ? new Date(answer.protocol.d) : new Date(),
				sectionItem: { title: ['Пункт протокола №', answer?.protocol?.itemNum ?? ''].join('') },
			};
			return;
		}
		if (!errandAnswerKeys.includes(key)) {
			errandAnswer[key] = defaultErrandAnswerFields[key];
		}
	});
	errandAnswer.expireAt = new Date(answer.expireAt);

	console.dir({ errandAnswer });

	return errandAnswer;
}


export function getAnswerFormFields({ answer = null, onGetAllFieldsFromPrevAnswer = false }) {
	if (!answer || typeof answer !== 'object' || answer.length) {
		return defaultAnswerFields;
	}

	const answerForm = { ...answer };

	const defaultAnswerFieldsKeys = Object.keys(defaultAnswerFields);

	const answerKeys = Object.keys(answer);

	defaultAnswerFieldsKeys.forEach((key) => {
		if (!answerKeys.includes(key)) {
			answerForm[key] = defaultAnswerFields[key];
		}
	});
	answerForm.ts = new Date(answerForm.ts);

	console.dir({ answerForm });
	return answerForm;
}

export function useDefaultAnswerErrandForm({ defaultValues = null }) {
	const {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	} = useForm(defaultValues ?? defaultErrandAnswerFields);

	const allFieldAreFilled = useMemo(() => Object.entries(values).filter((val) => {
		const [key, value] = val;
		if (key === 'mail' || key === 'protocol' || key === 'protocolId' || key === 'sectionItemsId') { return false; }
		if (typeof value === 'string' && value.trim() !== '') { return false; }
		if (typeof value === 'object' && value.length > 0) { return false; }
		return value?.toString().trim() === '';
	}).length === 0, [values]);

	return {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
		allFieldAreFilled,
	};
}

export function useDefaultAnswerForm({ defaultValues = null }) {
	const {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
	} = useForm(defaultValues ?? defaultAnswerFields);

	const allFieldAreFilled = useMemo(() => Object.entries(values).filter((val) => {
		const [key, value] = val;
		if (key === 'mail' || key === 'protocol' || key === 'protocolId' || key === 'sectionItemsId') { return false; }
		if (typeof value === 'string' && value.trim() !== '') { return false; }
		if (typeof value === 'object' && value.length > 0) { return false; }
		return value?.toString().trim() === '';
	}).length === 0, [values]);

	return {
		values,
		handlers,
		reset,
		commit,
		hasUnsavedChanges,
		allFieldAreFilled,
	};
}

function AnswerForm({ defaultValues = null, defaultHandlers = null, onReadOnly = false, onAnswerErrand = false, onErrandHandle = null }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const {
		newValues,
		newHandlers,
	} = useDefaultAnswerForm({ });

	const values = useMemo(() => defaultValues ?? newValues, [defaultValues, newValues]);
	const handlers = useMemo(() => defaultHandlers ?? newHandlers, [defaultHandlers, newHandlers]);
	const typeAnswerOptions = useMemo(() => [['mail', t('Working_group_mail')], ['protocol', t('Working_group_request_invite_select_protocol')]], [t]);
	// const statusAnswerOptions = useMemo(() => [[answerStatusState.ACCEPTED.state, t(answerStatusState.ACCEPTED.title)], [answerStatusState.RECEIVED.state, t(answerStatusState.RECEIVED.title)]], [t]);

	const {
		sender,
		unread,
		ts,
		answerType,
		protocolId,
		sectionItemsId,
		protocol,
		mail,
		commentary,
		documents,
		expireAt,
		errandType,
		chargedTo,
		status,
	} = values;

	const {
		handleSender,
		handleUnread,
		handleExpireAt,
		handleErrandType,
		handleChargedTo,
		handleStatus,
		handleTs,
		handleAnswerType,
		handleProtocolId,
		handleSectionItemsId,
		handleProtocol,
		handleMail,
		handleCommentary,
		handleDocuments,
	} = handlers;

	const inputStyles = useMemo(() => ({ wordBreak: 'break-word', whiteSpace: 'normal', border: onReadOnly ? '' : '1px solid #4fb0fc' }), [onReadOnly]);
	const marginBlockEnd = useMemo(() => ({ marginBlockEnd: '1rem !important' }));

	const onChangeField = useCallback((val, handler) => {
		handler(val);
		console.dir({ handler });
		if (onErrandHandle) {
			onErrandHandle(handler.name, val);
		}
	}, [onErrandHandle]);

	const senderOptions = useMemo(() => [
		['Пользователь', 'Пользователь'],
		['Член рабочей группы', 'Член рабочей группы'],
		['Федеральный орган исполнительной власти', 'Федеральный орган исполнительной власти'],
		['Субъект Российской Федерации', 'Субъект Российской Федерации'],
		['Организация', 'Организация'],
		['Иные участники', 'Иные участники'],
		['Другое', 'Другое'],
	], []);

	return <Box display='flex' flexDirection='column'>
		<Margins all='x8'>

			<Field display='flex' flexDirection='row' style={marginBlockEnd}>
				{useMemo(() => <Field display='flex' flexDirection='row' mie='x16'>
					<Field.Label alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Working_group_request_sender')}</Field.Label>
					<Select width='auto' style={inputStyles} options={senderOptions} value={sender?.group ?? ''} onChange={(event) => onChangeField({ ...sender, group: event }, handleSender)} placeholder={t('Working_group_request_sender')}/>
				</Field>, [t, inputStyles, senderOptions, sender, onChangeField, handleSender])}

				{useMemo(() => !onAnswerErrand && <Field display='flex' flexDirection='row'>
					<Field.Label alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Date')}</Field.Label>
					<DatePicker
						mie='x16'
						dateFormat='dd.MM.yyyy HH:mm'
						readOnly={onReadOnly}
						selected={onAnswerErrand ? expireAt : ts}
						onChange={(newDate) => (onAnswerErrand ? handleExpireAt(newDate) : handleTs(newDate))}
						showTimeSelect
						timeFormat='HH:mm'
						timeIntervals={5}
						timeCaption='Время'
						customInput={<TextInput style={inputStyles}/>}
						locale='ru'
						popperClassName='date-picker'/>
				</Field>, [t, onReadOnly, onAnswerErrand, expireAt, ts, inputStyles, handleExpireAt, handleTs])}
			</Field>

			{useMemo(() => <Field display='flex' flexDirection='row' style={marginBlockEnd}>
				<Field.Label alignSelf='center' maxWidth='103px'>{t('Working_group_request_sender_organization')}</Field.Label>
				<TextInput style={inputStyles} value={sender?.organization ?? ''} onChange={(event) => onChangeField({ ...sender, organization: event.currentTarget.value }, handleSender)} readOnly={onReadOnly} placeholder={t('Working_group_request_sender_organization')} fontScale='p1'/>
			</Field>, [marginBlockEnd, t, inputStyles, sender, onReadOnly, onChangeField, handleSender])}

			<Field display='flex' flexDirection='row' style={marginBlockEnd}>
				{useMemo(() => <Field display='flex' flexDirection='row' width='max-content' mie='x16'>
					<Field.Label style={{ whiteSpace: 'pre' }} alignSelf='center' maxWidth='max-content' mie='x16'>{t('Phone_number')}</Field.Label>
					{!onReadOnly
						? <Box alignSelf='center'><PhoneInput
							inputStyle={inputStyles}
							value={sender?.phone ?? ''}
							onChange={(val) => onChangeField({ ...sender, phone: val }, handleSender)}
							country={'ru'}
							countryCodeEditable={false}
							placeholder={'+7 (123)-456-78-90'}/></Box>
						: <TextInput style={inputStyles} value={sender?.phone ?? ''} onChange={(event) => onChangeField({ ...sender, phone: event.currentTarget.value }, handleSender)} placeholder={t('Phone_number')} fontScale='p1'/>
					}
				</Field>, [t, onReadOnly, inputStyles, sender, handleSender, onChangeField])}

				{useMemo(() => <Field display='flex' flexDirection='row' flexWrap='wrap'>
					<Field.Label alignSelf='center' maxWidth='max-content' mie='x16'>{t('Email')}</Field.Label>
					<TextInput style={inputStyles} value={sender?.email ?? ''} onChange={(event) => onChangeField({ ...sender, email: event.currentTarget.value }, handleSender)} readOnly={onReadOnly} placeholder={t('Email')} fontScale='p1'/>
				</Field>, [t, inputStyles, sender, onReadOnly, onChangeField, handleSender])}
			</Field>

			{/*{useMemo(() => onAnswerErrand && <Field display='flex' flexDirection='row' style={marginBlockEnd}>*/}
			{/*	<Box display='flex' flexDirection='row' mie='x16'>*/}
			{/*		<Field.Label mie='x16' alignSelf='center'>{t('Type')}</Field.Label>*/}
			{/*		<Select width='max-content' style={inputStyles} options={typeAnswerOptions} onChange={(val) => handleAnswerType(val)} value={answerType} placeholder={t('Type')}/>*/}
			{/*	</Box>*/}
			{/*	<Box display='flex' flexDirection='row'>*/}
			{/*		<Field.Label mie='x16' alignSelf='center'>{t('Status')}</Field.Label>*/}
			{/*		<Select width='max-content' style={inputStyles} options={statusAnswerOptions}/>*/}
			{/*	</Box>*/}
			{/*</Field>, [answerType, handleAnswerType, marginBlockEnd, onAnswerErrand, t, typeAnswerOptions])}*/}

			{useMemo(() => !onAnswerErrand && <Field style={marginBlockEnd}>
				<Field.Label>{t('Working_group_request_invite_select_protocol')}</Field.Label>
				<Field.Row>
					<TextAreaInput rows='2' value={protocol?.title ?? ''} onChange={(event) => onChangeField({ ...protocol, title: event.currentTarget.value }, handleProtocol)} readOnly={true} placeholder={t('Working_group_request_invite_select_protocol')} fontScale='p1'/>
				</Field.Row>
			</Field>, [onAnswerErrand, marginBlockEnd, t, protocol, onChangeField, handleProtocol])}

			{/*{useMemo(() => !onAnswerErrand && <Field style={marginBlockEnd}>*/}
			{/*	<Field.Label>{t('Working_group_request_invite_select_sections')}</Field.Label>*/}
			{/*	<Field.Row>*/}
			{/*		<TextAreaInput rows='2' value={protocol?.section?.title ?? ''} onChange={(event) => onChangeField({ ...protocol, section: { ...protocol.section, title: event.currentTarget.value } })} readOnly={true} placeholder={t('Working_group_request_invite_select_sections')} fontScale='p1'/>*/}
			{/*	</Field.Row>*/}
			{/*</Field>, [onAnswerErrand, marginBlockEnd, t, inputStyles, protocol, handleProtocol])}*/}

			{useMemo(() => !onAnswerErrand && <Field style={marginBlockEnd}>
				<Field.Label>{t('Working_group_request_invite_select_sections_items')}</Field.Label>
				<Field.Row>
					<TextAreaInput
						rows='2'
						// style={inputStyles}
						value={protocol?.sectionItem?.title ?? ''}
						onChange={(event) => { if (protocol?.sectionItem?.title) { protocol.sectionItem.title = event.currentTarget.value; } }}
						readOnly={true}
						placeholder={t('Working_group_request_invite_select_sections_items')}
						fontScale='p1'/>
				</Field.Row>
			</Field>, [onAnswerErrand, marginBlockEnd, t, protocol])}

			{useMemo(() => !onAnswerErrand && <Field style={marginBlockEnd}>
				<Field.Label>{t('Commentary')}</Field.Label>
				<Field.Row>
					<TextAreaInput rows='4' style={inputStyles} value={commentary ?? ''} onChange={(event) => handleCommentary(event)} readOnly={onReadOnly} placeholder={t('Commentary')} fontScale='p1'/>
				</Field.Row>
			</Field>, [marginBlockEnd, t, inputStyles, commentary, onReadOnly, handleCommentary])}

		</Margins>
	</Box>;
}

export default AnswerForm;
