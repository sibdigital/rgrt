import React, { useCallback, useMemo, useState } from 'react';
import { Button, ButtonGroup, Field, TextAreaInput } from '@rocket.chat/fuselage';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from '../lib';

export function AddRequest({ editData, onChange }) {
	const data = {
		_id: '',
		desc: '',
		mails: [],
	};
	console.log(editData);

	return <AddRequestWithData request={editData ?? data} onChange={onChange}/>;
}

function AddRequestWithData({ request, onChange }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, number: previousNumber, desc: previousDescription } = request || {};
	const previousRequest = request || {};

	const [description, setDescription] = useState(previousDescription);
	//const [number, setNumber] = useState(previousNumber);

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');
	const goBack = () => {
		window.history.back();
	};

	const hasUnsavedChanges = useMemo(() => previousDescription !== description,
		[description, previousDescription]);

	const resetData = () => {
		setDescription(previousDescription);
		//setNumber(previousNumber);
		onChange();
	};

	const saveAction = useCallback(async (description) => {
		const requestData = createWorkingGroupRequestData(description, { previousDescription, _id });
		const validation = validateWorkingGroupRequestData(requestData);
		if (validation.length === 0) {
			await insertOrUpdateWorkingGroupRequest(requestData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateWorkingGroupRequest, description, previousDescription, previousRequest, t]);

	const handleSaveRequest = useCallback(async () => {
		await saveAction(description);
		dispatchToastMessage({ type: 'success', message: t('Council_edited') });
		onChange();
		goBack();
	}, [saveAction, onChange]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Content>
				<ButtonGroup mis='auto'>
					<Button primary small aria-label={t('Cancel')} disabled={!hasUnsavedChanges} onClick={resetData}>
						{t('Cancel')}
					</Button>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				{/*<Field mbe='x8'>*/}
				{/*	<Field.Label>{t('Number')}</Field.Label>*/}
				{/*	<Field.Row>*/}
				{/*		<TextInput border='1px solid #4fb0fc' value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Number')} />*/}
				{/*	</Field.Row>*/}
				{/*</Field>*/}
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput style={ { whiteSpace: 'normal' } } row='10' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
					</Field.Row>
				</Field>
			</Page.Content>
		</Page>
	</Page>;
}
