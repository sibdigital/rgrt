import React, { useCallback, useState, useMemo } from 'react';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	Icon,
} from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useFileInput } from '../../../../client/hooks/useFileInput';
import { validate, createPerson } from './lib';
import { uploadPersonAvatar } from './uploadPersonAvatar';
import PersonForm, { useDefaultPersonForm, getPersonFormFields } from './PersonForm';

export function EditPerson({ workingGroupOptions, person, onChange, close, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [picturePreview, setPicturePreview] = useState({});
	const [avatarSource, setAvatarSource] = useState({});
	const [currentGroup, setCurrentGroup] = useState({});

	const { values, handlers, hasUnsavedChanges, allFieldAreFilled } = useDefaultPersonForm({ defaultValues: person && person._id ? getPersonFormFields({ person }) : null });

	useMemo(() => {
		if(values?.group?._id) {
			setCurrentGroup(values.group);
		}

		if(typeof values?.group === 'string') {
			const personGroup = workingGroupOptions?.find((group) => group[0] === values?.group) || ['', ''];
			setCurrentGroup({ _id: personGroup[0], title: personGroup[1] });
		}
	}, [values])
	
	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');

	useMemo(() => {
		setAvatarSource(person?.avatarSource ?? {});
	}, [person]);

	const loadPreview = useCallback(async (file) => {
		setPicturePreview(() => {
			return {
				url: URL.createObjectURL(file),
				file,
			};
		})
	}, [setPicturePreview]);

	const [clickUpload] = useFileInput(loadPreview);

	const deletePhoto = useCallback(() => {
		setPicturePreview({});
		setAvatarSource({});
	}, [setPicturePreview]);

	const saveAction = useCallback(async (currentGroup, personValues, avatarSource, previousPersonId) => {
		// console.dir({ personValues });
		personValues.group = currentGroup;


		const personData = createPerson({ personToSave: { ...personValues, avatarSource } }, { previousData: { _id: previousPersonId } });
		const validation = validate(personData);
		if (validation.length === 0) {
			const _id = await insertOrUpdatePerson(personData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdatePerson, t]);

	const handleSave = useCallback(async () => {
		try {
			const avatarData = picturePreview?.file ? await uploadPersonAvatar(picturePreview?.file) : avatarSource;
			const uploadingAvatar = {_id: avatarData?._id, url: avatarData?.url};

			await saveAction(currentGroup, values, uploadingAvatar, person?._id ?? null);
			onChange();
			dispatchToastMessage({ type: 'success', message: t('Person_was_added_successful') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [saveAction, currentGroup, avatarSource, picturePreview, values, person, onChange, close, dispatchToastMessage]);

	return <Box {...props}>
		<PersonForm workingGroupOptions={workingGroupOptions} defaultHandlers={handlers} defaultValues={values} />
		{currentGroup?.title === 'Состав комиссии' && <Field m='x8' mbe='0' w='98%'>
			{picturePreview?.url || avatarSource?.url 
				? <a><img alt={t('Avatar')} height='100%' width='100%' src={picturePreview?.url ?? avatarSource?.url}/></a> 
				: <></>}
			{picturePreview?.url || avatarSource?.url
				? <Button mb='x8' w={'auto'} square onClick={deletePhoto}><Icon name='trash' size='x20' pie='x4'/>{t('Delete_photo')}</Button>
				: <Button mb='x8' w={'auto'} square onClick={clickUpload}><Icon name='upload' size='x20' pie='x4'/>{t('Upload_photo')}</Button>}
		</Field>}
		<Field m='x8' mbe='0' w='98%'>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={
						person?._id 
						? !hasUnsavedChanges && picturePreview?.url === undefined && avatarSource?.url !== undefined 
						: !allFieldAreFilled}>{t('Save')}
					</Button>
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
