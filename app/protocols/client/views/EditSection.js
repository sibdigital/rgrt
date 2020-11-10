import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	Skeleton,
	Throbber,
	InputBox,
} from '@rocket.chat/fuselage';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/ru';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validateSectionData, createSectionData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

require('react-datepicker/dist/react-datepicker.css');

export function EditSection({ protocolId, _id, cache, onChange, ...props }) {
	const query = useMemo(() => ({
		query: JSON.stringify({ _id: protocolId }),
	}), [protocolId, _id, cache]);

	const { data, state, error } = useEndpointDataExperimental('protocols.findOne', query);

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
		</Box>;
	}

	if (error || !data) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditSectionWithData protocol={data} sectionId={_id} onChange={onChange} {...props}/>;
}

function EditSectionWithData({ close, onChange, protocol, sectionId, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const section = protocol.sections.find(s => s._id === sectionId);

	const { _id, num: previousNumber, name: previousName } = section || {};
	const previousSection = section || {};

	const [number, setNumber] = useState('');
	const [name, setName] = useState('');

	useEffect(() => {
		setNumber(previousNumber || '');
		setName(previousName || '');
	}, [previousNumber, previousName, _id]);

	const insertOrUpdateSection = useMethod('insertOrUpdateSection');

	const hasUnsavedChanges = useMemo(() => previousNumber !== number || previousName !== name,
		[number, name]);

	const saveAction = useCallback(async (number, name) => {
		const sectionData = createSectionData(number, name, { previousNumber, previousName, _id });
		const validation = validateSectionData(sectionData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateSection(protocol._id, sectionData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateSection, number, name, previousNumber, previousName, previousSection, t]);

	const handleSave = useCallback(async () => {
		saveAction(number, name);
		onChange();
	}, [saveAction, onChange]);

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
				<CKEditor
					editor={ ClassicEditor }
					config={ {
						language: 'ru',
						toolbar: [ 'bold', 'italic', 'link' ]
					} }
					data={name}
					onChange={ (event, editor) => {
						const data = editor.getData();
						setName(data);
					} }
				/>
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
