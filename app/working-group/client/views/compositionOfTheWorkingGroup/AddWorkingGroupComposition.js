import React, { useState, useCallback } from 'react';
import { Field, TextAreaInput, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { validateWorkingGroupCompositionData, createWorkingGroupCompositionData } from '../lib';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';

require('react-datepicker/dist/react-datepicker.css');

export function AddWorkingGroupComposition({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [title, setTitle] = useState('');

	const insertOrUpdateWorkingGroupComposition = useMethod('insertOrUpdateWorkingGroupComposition');

	const saveAction = useCallback(async (title) => {
		const workingGroupData = createWorkingGroupCompositionData(title);
		const validation = validateWorkingGroupCompositionData(workingGroupData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroupComposition(workingGroupData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateWorkingGroupComposition, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				title,
			);
			dispatchToastMessage({ type: 'success', message: t('Working_group_composition_added_successfully') });
			goToNew();
			close();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, close, onChange, saveAction, title, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Working_group_type')}</Field.Label>
			<Field.Row>
				<TextAreaInput size={'3'} value={title} onChange={(e) => setTitle(e.currentTarget.value)} placeholder={t('Working_group_type')} />
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
