import React, { useState, useCallback, useEffect } from 'react';
import { Field, Button, InputBox, ButtonGroup, TextInput, FieldGroup } from '@rocket.chat/fuselage';
import DatePicker from 'react-datepicker';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import { validateAgendaSection, createAgendaSection } from './lib';

require('react-datepicker/dist/react-datepicker.css');

export function EditSection({ agendaId = null, councilId, onEditDataClick, close, onChange, personsOptions, data = null, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [editData, setEditData] = useState({
		item: '',
		initiatedBy: {},
		issueConsideration: '',
		// date: new Date(),
		speakers: [],
	});

	useEffect(() => {
		if (data) {
			// console.log(data);
			setEditData({
				item: data.item ?? '',
				initiatedBy: data.initiatedBy,
				issueConsideration: data.issueConsideration,
				// date: new Date(data.date),
				speakers: data.speakers,
			});
		}
	}, [data]);

	const insertOrUpdateAgendaSection = useMethod('insertOrUpdateAgendaSection');

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setEditData({ ...editData, [field]: getValue(e) });
		onChange();
	};
	const handleSpeakers = (value) => {
		// console.log(value);
		setEditData({ ...editData, speakers: value });
	};

	const saveAction = useCallback(async (item, initiatedBy, issueConsideration, speakers, previousData) => {
		const agendaData = createAgendaSection({ item, initiatedBy, issueConsideration, speakers, previousData });
		const validation = validateAgendaSection(agendaData);
		// console.log(agendaData);
		if (validation.length === 0) {
			const result = await insertOrUpdateAgendaSection(agendaId, agendaData);
			// console.log(result);
			if (result && result._id) {
				agendaData._id = result._id;
			}
			onEditDataClick(agendaData, data?._id && 'edit');
			onChange();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateAgendaSection, t, councilId]);

	const handleSave = useCallback(async () => {
		try {
			// console.log(editData);
			editData.speakers.forEach((speaker) => speaker.value && delete speaker.value);
			await saveAction(
				editData.item,
				editData.initiatedBy,
				editData.issueConsideration,
				// editData.date,
				editData.speakers,
				data,
			);
			dispatchToastMessage({ type: 'success', message: !data ? t('Agenda_item_added_successfully') : t('Agenda_item_edited_successfully') });
			onChange();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, close, onChange, t, editData, data]);

	return <FieldGroup {...props}>
		<Field>
			<Field.Label>{t('Proposal_for_the_agenda_item')}</Field.Label>
			<Field.Row>
				<InputBox value={editData.item} onChange={handleChange('item')} placeholder={t('Proposal_for_the_agenda_item')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Agenda_issue_consideration')}</Field.Label>
			<Field.Row>
				<InputBox value={editData.issueConsideration} onChange={handleChange('issueConsideration')} placeholder={t('Agenda_issue_consideration')} />
			</Field.Row>
		</Field>
		{/*<Field>*/}
		{/*	<Field.Label>{t('Date')}</Field.Label>*/}
		{/*	<Field.Row>*/}
		{/*		<DatePicker*/}
		{/*			dateFormat='dd.MM.yyyy HH:mm'*/}
		{/*			selected={editData.date}*/}
		{/*			onChange={(newDate) => setEditData({ ...editData, date: newDate })}*/}
		{/*			showTimeSelect*/}
		{/*			timeFormat='HH:mm'*/}
		{/*			timeIntervals={5}*/}
		{/*			timeCaption='Время'*/}
		{/*			customInput={<TextInput />}*/}
		{/*			locale='ru'*/}
		{/*			popperClassName='date-picker'/>*/}
		{/*	</Field.Row>*/}
		{/*</Field>*/}
		<Field>
			<Field.Label>{t('Agenda_speakers')}</Field.Label>
			<Autocomplete
				multiple
				id='tags-standard'
				options={personsOptions}
				value={editData.speakers ?? []}
				forcePopupIcon={false}
				getOptionLabel={(userData) => [constructPersonFIO(userData), `, ${ userData.organization ?? '' }`].join('')}
				filterSelectedOptions
				filterOptions={createFilterOptions({ limit: 10 })}
				onChange={(event, value) => handleSpeakers(value)}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<Chip style={{ backgroundColor: '#e0e0e0', margin: '3px', borderRadius: '16px', color: '#000000DE' }}
							label={constructPersonFIO(option)} {...getTagProps({ index })} />
					))
				}
				renderInput={(params) => (
					<TextField
						{...params}
						variant='outlined'
						placeholder={t('Agenda_speakers')}
					/>
				)}
			/>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</FieldGroup>;
}
