import React, { useState, useCallback } from 'react';
import { Field, TextAreaInput, Button, InputBox, ButtonGroup, TextInput } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validateSectionData, createSectionData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

export function AddSection({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [number, setNumber] = useState('');

	const protocolId = useRouteParameter('id');

	const insertOrUpdateSection = useMethod('insertOrUpdateSection');

	const saveAction = useCallback(async (number, name) => {
		const sectionData = createSectionData(number, name);
		const validation = validateSectionData(sectionData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateSection(protocolId, sectionData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateSection, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				number,
				name
			);
			dispatchToastMessage({ type: 'success', message: t('Section_Added_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, number, name, onChange, saveAction, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Section_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Section_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Section_Name')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Section_Name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={number === '' || name === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
