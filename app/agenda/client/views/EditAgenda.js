import React, { useState, useCallback, useEffect } from 'react';
import { Field, Button, InputBox, ButtonGroup } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import { validateAgenda, createAgenda } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

export function EditAgenda({ councilId, onEditDataClick, close, onChange, data = null, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [number, setNumber] = useState('');

	useEffect(() => {
		if (data) {
			setName(data.name);
			setNumber(data.number);
		}
	}, [data]);

	const insertOrUpdateAgenda = useMethod('insertOrUpdateAgenda');

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
			onChange();
		}
	};

	const saveAction = useCallback(async (number, name, previousData) => {
		const agendaData = createAgenda({ number, name, previousData });
		const validation = validateAgenda(agendaData);
		if (validation.length === 0) {
			if (councilId) {
				agendaData.councilId = councilId;
			}
			const agenda = await insertOrUpdateAgenda(agendaData);
			agendaData._id = agenda._id;
			onEditDataClick(agendaData);
			onChange();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateAgenda, t, councilId]);

	const handleSave = useCallback(async () => {
		try {
			await saveAction(number, name, data);
			dispatchToastMessage({ type: 'success', message: !data ? t('Agenda_added_successfully') : t('Agenda_edited_successfully') });
			onChange();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, close, onChange, t, name, number, data]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Section_Name')}</Field.Label>
			<Field.Row>
				<InputBox value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Section_Name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Section_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Section_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
