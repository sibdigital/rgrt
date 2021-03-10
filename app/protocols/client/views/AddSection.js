import React, { useState, useCallback } from 'react';
import { Field, Button, InputBox, ButtonGroup } from '@rocket.chat/fuselage';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validateSectionData, createSectionData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkRomanNumber } from '../../../utils/client/methods/checkNumber';

export function AddSection({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [number, setNumber] = useState('');
	const [speakers, setSpeakers] = useState('');

	const protocolId = useRouteParameter('id');

	const insertOrUpdateSection = useMethod('insertOrUpdateSection');

	const filterNumber = (value) => {
		if (checkRomanNumber(value.toUpperCase()) !== null) {
			setNumber(value.toUpperCase());
		}
	};

	const saveAction = useCallback(async (number, name, speakers) => {
		const sectionData = createSectionData(number, name, speakers);
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
				name,
				speakers
			);
			dispatchToastMessage({ type: 'success', message: t('Section_Added_Successfully') });
			close()
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, close, number, name, speakers, onChange, saveAction, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Section_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Section_Number')} />
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
			<Field.Label>{t('Protocol_section_speakers')}</Field.Label>
			<Field.Row>
				<InputBox value={speakers} onChange={(e) => setSpeakers(e.currentTarget.value)} placeholder={t('Protocol_section_speakers')} />
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
