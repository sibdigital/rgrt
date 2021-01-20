import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	Skeleton,
	Throbber,
	InputBox,
	TextInput,
} from '@rocket.chat/fuselage';
import ru from 'date-fns/locale/ru';

import { registerLocale } from 'react-datepicker';
registerLocale('ru', ru);

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../client/hooks/useEndpointDataExperimental';
import { validateWorkingGroupCompositionData, createWorkingGroupCompositionData } from '../lib';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';

require('react-datepicker/dist/react-datepicker.css');

export function EditWorkingGroupComposition({ _id, cache, onChange, ...props }) {
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
	}), [_id, cache]);

	const { data, state, error } = useEndpointDataExperimental('working-groups.list', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box pb='x20'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button primary danger disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || !data || data.workingGroups.length < 1) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditWorkingGroupWithData workingGroupComposition={data.workingGroups[0]} onChange={onChange} {...props}/>;
}

function EditWorkingGroupWithData({ close, onChange, workingGroupComposition, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		_id,
		title: previousTitle,
	} = workingGroupComposition || {};
	const previousWorkingGroupComposition = workingGroupComposition || {};

	const [title, setTitle] = useState(previousTitle);

	useEffect(() => {
		setTitle(previousTitle || '');
	}, [
		previousTitle,
		_id]);

	const insertOrUpdateWorkingGroupComposition = useMethod('insertOrUpdateWorkingGroupComposition');

	const hasUnsavedChanges = useMemo(() => previousTitle !== title, [title]);

	const saveAction = useCallback(async (title) => {
		const workingGroupData = createWorkingGroupCompositionData(title,{	previousTitle, _id });
		const validation = validateWorkingGroupCompositionData(workingGroupData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroupComposition(workingGroupData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateWorkingGroupComposition, title, previousTitle, previousWorkingGroupComposition]);

	const handleSave = useCallback(async () => {
		saveAction(title);
		onChange();
	}, [saveAction, onChange]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Working_group_type')}</Field.Label>
			<Field.Row>
				<TextInput value={title} onChange={(e) => setTitle(e.currentTarget.value)} placeholder={t('Working_group_type')}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
