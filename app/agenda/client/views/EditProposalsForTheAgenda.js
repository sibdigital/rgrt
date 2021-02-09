import React, { useCallback, useState, useEffect } from 'react';
import {
	Box,
	Field,
	Button,
	ButtonGroup, FieldGroup,
	InputBox, TextInput,
} from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { constructPersonFullFIO } from '../../../utils/client/methods/constructPersonFIO';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { createProposalsForTheAgenda, validateProposalsForTheAgenda } from './lib';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function EditProposalsForTheAgenda({ mode = '', onEditDataClick, close, agendaId, userData, data = null, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [editData, setEditData] = useState({
		item: '',
		initiatedBy: { _id: '', surname: '', name: '', patronymic: '', organization: '', value: '' },
		issueConsideration: '',
		date: new Date(),
		status: t('Agenda_status_proposed'),
	});

	useEffect(() => {
		console.log(userData);
		if (data) {
			setEditData({
				_id: data._id,
				item: data.item ?? '',
				initiatedBy: data.initiatedBy ?? '',
				issueConsideration: data.issueConsideration ?? '',
				date: new Date(data.date ?? ''),
				status: data.status ?? t('Agenda_status_proposed'),
			});
		} else {
			setEditData({
				...editData,
				initiatedBy: {
					_id: userData._id ?? '',
					surname: userData.surname ?? '',
					name: userData.name ?? '',
					patronymic: userData.patronymic ?? '',
					organization: userData.organization ?? '',
					value: constructPersonFullFIO(userData),
					type: userData.type ?? '',
				},
			});
		}
	}, [data, userData]);

	const insertOrUpdateProposalsForTheAgenda = useMethod('insertOrUpdateProposalsForTheAgenda');

	const handleEditDateChange = (field, value) => {
		setEditData({ ...editData, [field]: value });
	};

	const saveAction = useCallback(async (item, initiatedBy, issueConsideration, date, status, previousData) => {
		const proposalsData = createProposalsForTheAgenda(item, initiatedBy, issueConsideration, date, status, previousData);
		const validation = validateProposalsForTheAgenda(proposalsData);
		console.log(proposalsData);
		if (validation.length === 0) {
			const result = await insertOrUpdateProposalsForTheAgenda(agendaId, proposalsData);
			console.log(result);

			if (result && result.id) {
				proposalsData._id = result.id;
			}

			onEditDataClick(proposalsData, data?._id ? 'edit' : 'new');
			close();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateProposalsForTheAgenda, t]);

	const handleSave = useCallback(async () => {
		try {
			await saveAction(
				editData.item,
				editData.initiatedBy,
				editData.issueConsideration,
				editData.date,
				editData.status,
				data,
			);
			dispatchToastMessage({ type: 'success', message: !data ? t('Proposal_for_the_agenda_added_successfully') : t('Proposal_for_the_agenda_edited_successfully') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, close, t, editData, data]);

	return <Field {...props}>
		<FieldGroup>
			<Field>
				<Field.Label>{t('Proposal_for_the_agenda_item')}</Field.Label>
				<Field.Row>
					<InputBox value={editData.item} onChange={(e) => handleEditDateChange('item', e.currentTarget.value)} placeholder={t('Proposal_for_the_agenda_item')} />
				</Field.Row>
			</Field>
			{mode !== 'invite' && <Field>
				<Field.Label>{t('Agenda_initiated_by')} <span style={ { color: 'red' } }>*</span></Field.Label>
				<Field.Row>
					<InputBox value={editData.initiatedBy.value} disabled readOnly placeholder={t('Agenda_initiated_by')} />
				</Field.Row>
			</Field>}
			<Field>
				<Field.Label>{t('Agenda_issue_consideration')} <span style={ { color: 'red' } }>*</span></Field.Label>
				<Field.Row>
					<InputBox value={editData.issueConsideration} onChange={(e) => handleEditDateChange('issueConsideration', e.currentTarget.value)} placeholder={t('Agenda_issue_consideration')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Date')} <span style={ { color: 'red' } }>*</span></Field.Label>
				<Field.Row>
					<DatePicker
						dateFormat='dd.MM.yyyy HH:mm'
						selected={editData.date}
						onChange={(newDate) => handleEditDateChange('date', newDate)}
						showTimeSelect
						timeFormat='HH:mm'
						timeIntervals={5}
						timeCaption='Время'
						customInput={<TextInput />}
						locale='ru'
						popperClassName='date-picker'/>
				</Field.Row>
			</Field>
			{mode !== 'invite' && <Field>
				<Field.Label>{t('Status')} <span style={ { color: 'red' } }>*</span></Field.Label>
				<Field.Row>
					<InputBox value={editData.status} disabled readOnly placeholder={t('Section_Name')} />
				</Field.Row>
			</Field>}
			{mode !== 'invite' && <Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave}>{t('Save')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>}
		</FieldGroup>
	</Field>;
}

export function EditFieldProposalsForTheAgenda({ onEditDataClick, close, agendaId, userData, data = null, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [editData, setEditData] = useState({
		item: '',
		initiatedBy: { surname: '', name: '', patronymic: '', organization: '', value: '' },
		issueConsideration: '',
		date: new Date(),
		status: t('Agenda_status_proposed'),
	});

	useEffect(() => {
		console.log(userData);
		if (data) {
			setEditData({
				_id: data._id,
				item: data.item ?? '',
				initiatedBy: data.initiatedBy ?? '',
				issueConsideration: data.issueConsideration ?? '',
				date: new Date(data.date ?? ''),
				status: data.status ?? t('Agenda_status_proposed'),
			});
		} else {
			setEditData({
				...editData,
				initiatedBy: {
					_id: userData._id ?? '',
					surname: userData.surname ?? '',
					name: userData.name ?? '',
					patronymic: userData.patronymic ?? '',
					organization: userData.organization ?? '',
					value: constructPersonFullFIO(userData),
				},
			});
		}
	}, [data, userData]);

	const insertOrUpdateProposalsForTheAgenda = useMethod('insertOrUpdateProposalsForTheAgenda');

	const handleEditDateChange = (field, value) => {
		setEditData({ ...editData, [field]: value });
	};

	const saveAction = useCallback(async (item, initiatedBy, issueConsideration, date, status, previousData) => {
		const proposalsData = createProposalsForTheAgenda(item, initiatedBy, issueConsideration, date, status, previousData);
		const validation = validateProposalsForTheAgenda(proposalsData);
		console.log(proposalsData);
		if (validation.length === 0) {
			const result = await insertOrUpdateProposalsForTheAgenda(agendaId, proposalsData);
			console.log(result);

			if (result && result.id) {
				proposalsData._id = result.id;
			}

			onEditDataClick(proposalsData, data?._id ? 'edit' : 'new');
			close();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateProposalsForTheAgenda, t]);

	const handleSave = useCallback(async () => {
		try {
			await saveAction(
				editData.item,
				editData.initiatedBy,
				editData.issueConsideration,
				editData.date,
				editData.status,
				data,
			);
			dispatchToastMessage({ type: 'success', message: !data ? t('Proposal_for_the_agenda_added_successfully') : t('Proposal_for_the_agenda_edited_successfully') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, close, t, editData, data]);

	return <Box {...props}>
		<Field>
			<Field.Label>{t('Proposal_for_the_agenda_item')}</Field.Label>
			<Field.Row>
				<InputBox value={editData.item} onChange={(e) => handleEditDateChange('item', e.currentTarget.value)} placeholder={t('Proposal_for_the_agenda_item')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Agenda_initiated_by')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field.Row>
				<InputBox value={editData.initiatedBy.value} disabled readOnly placeholder={t('Agenda_initiated_by')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Agenda_issue_consideration')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field.Row>
				<InputBox value={editData.issueConsideration} onChange={(e) => handleEditDateChange('issueConsideration', e.currentTarget.value)} placeholder={t('Agenda_issue_consideration')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Date')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy HH:mm'
					selected={editData.date}
					onChange={(newDate) => handleEditDateChange('date', newDate)}
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
			<Field.Label>{t('Status')} <span style={ { color: 'red' } }>*</span></Field.Label>
			<Field.Row>
				<InputBox value={editData.status} disabled readOnly placeholder={t('Section_Name')} />
			</Field.Row>
		</Field>
	</Box>;
}
