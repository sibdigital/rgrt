import React, { useCallback, useMemo, useState } from 'react';
import { Button, ButtonGroup, Field, TextInput, TextAreaInput } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { createWorkingGroupRequestData, validateWorkingGroupRequestData } from '../lib';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';
import { checkNumberWithDot } from '../../../../utils/client/methods/checkNumber';

export function AddRequest({ editData, onChange }) {
	const data = {
		_id: null,
		number: '',
		desc: '',
		mails: [],
	};
	console.log(editData);

	return <AddRequestWithData request={editData ?? data} onChange={onChange}/>;
}

function AddRequestWithData({ request, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, number: previousNumber, desc: previousDescription } = request || {};
	const previousRequest = request || {};

	const [number, setNumber] = useState(previousNumber);
	const [description, setDescription] = useState(previousDescription);

	const insertOrUpdateWorkingGroupRequest = useMethod('insertOrUpdateWorkingGroupRequest');
	const goBack = () => {
		window.history.back();
	};

	const hasUnsavedChanges = useMemo(() => (description !== '' && number !== '') && (previousDescription !== description || previousNumber !== number),
		[description, previousDescription, number, previousNumber]);

	const resetData = () => {
		setDescription(previousDescription);
		setNumber(previousNumber);
		onChange();
	};

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const saveAction = useCallback(async (number, description) => {
		console.log(number);
		console.log(description);
		const requestData = createWorkingGroupRequestData(number, description, { previousNumber, previousDescription, _id });
		const validation = validateWorkingGroupRequestData(requestData);
		if (validation.length === 0) {
			await insertOrUpdateWorkingGroupRequest(requestData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateWorkingGroupRequest, number, description, previousNumber, previousDescription, previousRequest, t]);

	const handleSaveRequest = useCallback(async () => {
		await saveAction(number, description);
		if (!request._id) {
			dispatchToastMessage({
				type: 'success',
				message: t('Working_group_request_added'),
			});
		} else {
			dispatchToastMessage({
				type: 'success',
				message: t('Working_group_request_edited'),
			});
		}
		onChange();
		goBack();
	}, [saveAction, onChange]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Number')}</Field.Label>
			<Field.Row>
				<TextInput border='1px solid #4fb0fc' value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Number')}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput style={ { whiteSpace: 'normal' } } row='10' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary small aria-label={t('Cancel')} disabled={!hasUnsavedChanges} onClick={resetData}>
						{t('Cancel')}
					</Button>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveRequest}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;

	// return <Page flexDirection='row'>
	// 	<Page>
	// 		<Page.Content>
	// 			<ButtonGroup mis='auto'>
	// 				<Button primary small aria-label={t('Cancel')} disabled={!hasUnsavedChanges} onClick={resetData}>
	// 					{t('Cancel')}
	// 				</Button>
	// 				<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveRequest}>
	// 					{t('Save')}
	// 				</Button>
	// 			</ButtonGroup>
	// 			{/*<Field mbe='x8'>*/}
	// 			{/*	<Field.Label>{t('Number')}</Field.Label>*/}
	// 			{/*	<Field.Row>*/}
	// 			{/*		<TextInput border='1px solid #4fb0fc' value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Number')} />*/}
	// 			{/*	</Field.Row>*/}
	// 			{/*</Field>*/}
	// 			<Field mbe='x8'>
	// 				<Field.Label>{t('Description')}</Field.Label>
	// 				<Field.Row>
	// 					<TextAreaInput style={ { whiteSpace: 'normal' } } row='10' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
	// 				</Field.Row>
	// 			</Field>
	// 		</Page.Content>
	// 	</Page>
	// </Page>;
}
