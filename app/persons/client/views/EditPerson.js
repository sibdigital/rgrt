import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	Icon,
	Skeleton,
	Throbber,
	InputBox,
	TextInput,
	Select,
	Modal,
} from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useFileInput } from '../../../../client/hooks/useFileInput';
import { validate, createPerson } from './lib';
import { uploadPersonAvatar } from './uploadPersonAvatar';
import PersonForm, { useDefaultPersonForm } from './PersonForm';

export function EditPerson({ person, onChange, close, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [avatarObj, setAvatarObj] = useState({});
	const [url, setUrl] = useState('');
	const [prevUrl, setPrevUrl] = useState('');

	const { values, handlers, hasUnsavedChanges, allFieldAreFilled } = useDefaultPersonForm({ defaultValues: person && person._id ? person : null });

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');
	const deletePerson = useMethod('deletePerson');

	useMemo(() => {
		setUrl(person?.avatarSource?.url ?? '');
		setPrevUrl(person?.avatarSource?.url ?? '');
	}, [person]);

	const setUploadedPreview = useCallback(async (file) => {
		setUrl(URL.createObjectURL(file));
		// console.log({ file });
		setAvatarObj({ file });
	}, [setAvatarObj]);

	const [clickUpload] = useFileInput(setUploadedPreview);

	const uploadAvatar = useCallback(async () => {
		if (url !== prevUrl) {
			const avatarData = await uploadPersonAvatar({ file: avatarObj.file });
			return { _id: avatarData._id, url: avatarData.url };
		} else {
			return person.avatarSource;
		}
	}, [avatarObj, person, prevUrl, url]);

	const saveAction = useCallback(async (personValues, avatarSource, previousPersonId) => {
		// console.dir({ personValues });
		const personData = createPerson({ personToSave: { ...personValues, avatarSource } }, { previousData: { _id: previousPersonId } });
		const validation = validate(personData);
		if (validation.length === 0) {
			const _id = await insertOrUpdatePerson(personData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdatePerson, t]);

	const handleSave = useCallback(async () => {
		try {
			const avatarSource = await uploadAvatar();

			await saveAction(values, avatarSource, person?._id ?? null);
			onChange();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [uploadAvatar, saveAction, values, person, onChange, close, dispatchToastMessage]);

	return <Box {...props}>
		<Field>
			<a><img alt={t('Avatar')} height='100%' width='100%' src={url}/></a>
			<Button mbs='x4' w={'auto'} square onClick={clickUpload}><Icon name='upload' size='x20'/>{t('Upload_avatar')}</Button>
		</Field>
		<hr align='center' width='100%' size='2' color='#cbced1' />
		<PersonForm defaultHandlers={handlers} defaultValues={values} />
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={person?._id ? !hasUnsavedChanges && prevUrl === url : !allFieldAreFilled}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
		{/*<Field>*/}
		{/*	<Field.Row>*/}
		{/*		<ButtonGroup stretch w='full'>*/}
		{/*			<Button primary danger onClick={openConfirmDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>*/}
		{/*		</ButtonGroup>*/}
		{/*	</Field.Row>*/}
		{/*</Field>*/}
	</Box>;
}
