import React, { useState, useCallback } from 'react';
import { Field, TextInput, Button, ButtonGroup } from '@rocket.chat/fuselage';

import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { validate, createTagData } from './lib';
import VerticalBar from '../../components/basic/VerticalBar';

export function AddTag({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');

	const insertOrUpdateTag = useMethod('insertOrUpdateTag');

	const saveAction = useCallback(async (name) => {
		const tagData = createTagData(name);
		const validation = validate(tagData);
		if (validation.length === 0) {
			let tagId = await insertOrUpdateTag(tagData);
			return tagId;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); })
	}, [dispatchToastMessage, insertOrUpdateTag, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				name,
			);
			dispatchToastMessage({ type: 'success', message: t('Tag_Added_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, name, onChange, saveAction, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={name === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
