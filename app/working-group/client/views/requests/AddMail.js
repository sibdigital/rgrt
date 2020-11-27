import React, { useCallback, useState } from 'react';
import { Button, ButtonGroup, Field, InputBox, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { createWorkingGroupRequestMessageData, validateWorkingGroupRequestMessageData } from '../lib';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';

export function AddMail({ goToNew, close, onChange, requestId, data, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [description, setDescription] = useState(data?.description ?? '');
	const [number, setNumber] = useState(data?.number ?? '');

	const insertOrUpdateWorkingGroupRequestMail = useMethod('insertOrUpdateWorkingGroupRequestMail');

	const saveAction = useCallback(async (description, number) => {
		const messageData = createWorkingGroupRequestMessageData(description, number, data);
		const validation = validateWorkingGroupRequestMessageData(messageData);
		if (validation.length === 0) {
			const result = await insertOrUpdateWorkingGroupRequestMail(requestId, messageData);
			return result;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateWorkingGroupRequestMail, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(description, number);
			dispatchToastMessage({ type: 'success', message: !data ? t('Working_group_request_mail_added_successfully') : t('Working_group_request_mail_edited_successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, description, number, onChange, saveAction, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Protocol_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Protocol_Number')} />
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
					<Button primary onClick={handleSave} disabled={description === '' || number === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
