import React, { useState, useCallback } from 'react';
import { Field, Button, ButtonGroup, TextInput, TextAreaInput } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validate, createWorkingGroupMeetingData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

require('react-datepicker/dist/react-datepicker.css');

export function AddWorkingGroupMeeting({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [d, setDate] = useState('');
	const [desc, setDesc] = useState('');

	const insertOrUpdateWorkingGroup = useMethod('insertOrUpdateWorkingGroupMeeting');

	const saveAction = useCallback(async (d, desc) => {
		const workingGroupMeetingData = createWorkingGroupMeetingData(d, desc);
		const validation = validate(workingGroupMeetingData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroup(workingGroupMeetingData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateWorkingGroup, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				d,
				desc,
			);
			dispatchToastMessage({ type: 'success', message: t('Working_Group_Meeting_Added_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, onChange, saveAction, d, desc, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Date')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy HH:mm'
					selected={d}
					onChange={(newDate) => setDate(newDate)}
					showTimeSelect
					timeFormat='HH:mm'
					timeIntervals={5}
					timeCaption='Время'
					customInput={<TextInput />}
					locale='ru'
				/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={desc} onChange={(e) => setDesc(e.currentTarget.value)} placeholder={t('Description')} />
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
