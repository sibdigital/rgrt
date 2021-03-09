import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Field, Button, InputBox, ButtonGroup, FieldGroup, TextAreaInput, Callout } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import { validateAgenda, createAgenda } from './lib';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';

export function EditAgenda({ councilId, onEditDataClick, close, onChange, data = null, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDate = useFormatDate();

	const [name, setName] = useState('');
	const [number, setNumber] = useState('');

	const { data: councilData, state: councilState, error: councilError } = useEndpointDataExperimental('councils.findOne', useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
		fields: JSON.stringify({ ts: 1, d: 1, type: 1 }),
	}), [councilId]));

	const { data: numberCountData, state: numberCountState } = useEndpointDataExperimental('agendas.numberCount');

	useEffect(() => {
		if (data) {
			setName(data.name);
			setNumber(data.numberCount);
		} else if (councilData && numberCountData) {
			setName([councilData.type.title, ' от ', formatDate(councilData.d)].join(''));
			setNumber(numberCountData.numberCount);
		}
	}, [data, councilData, numberCountData]);

	const insertOrUpdateAgenda = useMethod('insertOrUpdateAgenda');

	const allFieldAreFilled = useMemo(() => name === '' || number === '', [name, number]);

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
			if (data && data._id) {
				agendaData._id = data._id;
			}

			const agenda = await insertOrUpdateAgenda(agendaData);
			if (!agendaData._id) {
				agendaData._id = agenda._id;
			}
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

	if ([councilState, numberCountState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{ t('Loading') }</Callout>;
	}

	return <FieldGroup {...props}>
		<Field>
			<Field.Label>{t('Section_Name')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='5' value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Section_Name')} />
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
					<Button primary onClick={handleSave} disabled={allFieldAreFilled}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</FieldGroup>;
}
