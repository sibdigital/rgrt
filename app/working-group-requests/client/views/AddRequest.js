import React, { useCallback, useMemo, useState } from 'react';
import { Button, ButtonGroup, Field, TextInput, TextAreaInput } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function AddRequest({ editData, onChange, onRequestChanged = null }) {
	const data = {
		_id: null,
		number: '',
		desc: '',
		date: new Date(),
		mails: [],
	};
	console.log(editData);

	return <AddRequestWithData mode={'edit'} request={editData ?? data} onChange={onChange} onRequestChanged={onRequestChanged}/>;
}

function AddRequestWithData({ mode, request, onChange, onRequestChanged, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, number: previousNumber, desc: previousDescription, date: previousDate } = request || {};
	const previousRequest = request || {};

	const [number, setNumber] = useState(previousNumber);
	const [description, setDescription] = useState(previousDescription);
	const [date, setDate] = useState(previousDate ? new Date(previousDate) : new Date());

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');
	const goBack = () => {
		window.history.back();
	};

	const hasUnsavedChanges = useMemo(() => (description !== '' && number !== '') && (previousDescription !== description || previousNumber !== number || new Date(previousDate).getTime() !== new Date(date).getTime()),
		[description, previousDescription, number, previousNumber, date, previousDate]);

	const resetData = () => {
		setDescription(previousDescription);
		setNumber(previousNumber);
		onChange();
	};

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const saveAction = useCallback(async (number, description, date) => {
		console.log(number);
		console.log(description);
		const requestData = createWorkingGroupRequestData(number, description, date, { previousNumber, previousDescription, _id });
		const validation = validateWorkingGroupRequestData(requestData);
		if (validation.length === 0) {
			await insertOrUpdateWorkingGroupRequest(requestData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateWorkingGroupRequest, number, description, previousNumber, previousDescription, previousRequest, t]);

	const handleSaveRequest = useCallback(async () => {
		await saveAction(number, description, date);
		if (!request._id) {
			dispatchToastMessage({
				type: 'success',
				message: t('Working_group_request_added'),
			});
		} else {
			dispatchToastMessage({
				type: 'success',
				message: t('Working_group_request_edited'),
			});
		}
		if (onRequestChanged) {
			onRequestChanged({ number, date, desc: description });
		}
		onChange();
		goBack();
	}, [saveAction, onChange, number, description, date]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Number')}</Field.Label>
			<Field.Row>
				<TextInput border='1px solid #4fb0fc' value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Number')}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput style={ { whiteSpace: 'normal' } } row='10' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Date')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy HH:mm'
					selected={date}
					onChange={(newDate) => setDate(newDate)}
					showTimeSelect
					timeFormat='HH:mm'
					timeIntervals={5}
					timeCaption='Время'
					customInput={<TextInput />}
					locale='ru'
					popperClassName='date-picker'/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary small aria-label={t('Cancel')} onClick={resetData}>
						{t('Cancel')}
					</Button>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;

	// return <Page flexDirection='row'>
	// 	<Page>
	// 		<Page.Content>
	// 			<ButtonGroup mis='auto'>
	// 				<Button primary small aria-label={t('Cancel')} disabled={!hasUnsavedChanges} onClick={resetData}>
	// 					{t('Cancel')}
	// 				</Button>
	// 				<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveRequest}>
	// 					{t('Save')}
	// 				</Button>
	// 			</ButtonGroup>
	// 			{/*<Field mbe='x8'>*/}
	// 			{/*	<Field.Label>{t('Number')}</Field.Label>*/}
	// 			{/*	<Field.Row>*/}
	// 			{/*		<TextInput border='1px solid #4fb0fc' value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Number')} />*/}
	// 			{/*	</Field.Row>*/}
	// 			{/*</Field>*/}
	// 			<Field mbe='x8'>
	// 				<Field.Label>{t('Description')}</Field.Label>
	// 				<Field.Row>
	// 					<TextAreaInput style={ { whiteSpace: 'normal' } } row='10' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
	// 				</Field.Row>
	// 			</Field>
	// 		</Page.Content>
	// 	</Page>
	// </Page>;
}
