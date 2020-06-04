import React, { useState, useCallback } from 'react';
import { Field, TextAreaInput, Button, InputBox, ButtonGroup } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validate, createCouncilData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

export function AddCouncil({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [date, setDate] = useState('');
	const [description, setDescription] = useState('');

	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');

	const saveAction = async (date, description) => {
		const councilData = createCouncilData(date, description);
		const validation = validate(councilData);
		if (validation.length === 0) {
			let _id = await insertOrUpdateCouncil(councilData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); })
	};

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				date,
				description,
			);
			dispatchToastMessage({ type: 'success', message: t('Council_Added_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [date, description]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Date')}</Field.Label>
			<Field.Row>
				<InputBox type='date' value={date} onChange={(e) => setDate(e.currentTarget.value)} placeholder={t('Date')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={date === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
