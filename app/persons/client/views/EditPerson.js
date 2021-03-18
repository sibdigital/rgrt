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
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { validate, createPerson } from './lib';
import { useFileInput } from '/client/hooks/useFileInput';
import { uploadPersonAvatar } from './uploadPersonAvatar';

const DEFAULT_WEIGHT_PERSON = 100;

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Working_group_delete_warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Working_group_has_been_deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditPerson({ _id, person, cache, onChange, ...props }) {
	const curPerson = person ?? {
		_id: null,
		weight: DEFAULT_WEIGHT_PERSON,
		surname: '',
		name: '',
		patronymic: '',
		phone: '',
		email: '',
	};
	return <EditWorkingGroupWithData person={curPerson} onChange={onChange} {...props}/>;
}

function EditWorkingGroupWithData({ person, onChange, close, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		_id,
		surname: previousSurname,
		name: previousName,
		patronymic: previousPatronymic,
		phone: previousPhone,
		email: previousEmail,
		weight: previousWeight,
	} = person || {};
	const previousPerson = person || {};

	const [surname, setSurname] = useState(previousSurname);
	const [name, setName] = useState(previousName);
	const [patronymic, setPatronymic] = useState(previousPatronymic);
	const [phone, setPhone] = useState(previousPhone);
	const [email, setEmail] = useState(previousEmail);
	const [weight, setWeight] = useState(person.weight ?? DEFAULT_WEIGHT_PERSON);
	const [avatarObj, setAvatarObj] = useState();
	const [newAvatarSource, setNewAvatarSource] = useState();

	const url = newAvatarSource;

	const setModal = useSetModal();

	useEffect(() => {
		setSurname(previousSurname || '');
		setName(previousName || '');
		setPatronymic(previousPatronymic || '');
		setPhone(previousPhone || '');
		setEmail(previousEmail || '');
		setWeight(previousWeight || DEFAULT_WEIGHT_PERSON);
	}, [previousSurname, previousName, previousPatronymic, previousPhone, previousEmail, previousPerson, previousWeight]);

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');
	const deletePerson = useMethod('deletePerson');

	const hasUnsavedChanges = useMemo(() =>
		previousSurname !== surname
		|| previousName !== name
		|| previousPatronymic !== patronymic
		|| previousPhone !== phone
		|| previousEmail !== email
		|| previousWeight !== weight
	, [previousSurname, surname, previousName, name, previousPatronymic, patronymic, previousPhone, phone, previousEmail, email, previousWeight, weight]);

	const allFieldFilled = useMemo(() =>
		surname !== ''
		&& name !== ''
		&& patronymic !== ''
		&& phone !== ''
		&& email !== ''
		&& weight !== ''
	, [surname, name, patronymic, phone, email, weight]);

	const saveAction = useCallback(async (surname, name, patronymic, phone, email, weight, avatarSource) => {
		
		const personData = createPerson(surname, name, patronymic, phone, email, previousPerson, weight, avatarSource);
		const validation = validate(personData);
		if (validation.length === 0) {
			const _id = await insertOrUpdatePerson(personData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdatePerson, previousPerson, t]);

	const handleSave = useCallback(async () => {
		const promiseResolve = uploadAvatar().then((resolve) => {
			return resolve;
		})
		const avatarSource = await promiseResolve;
		console.log(avatarSource);

		await saveAction(surname, name, patronymic, phone, email, weight, avatarSource);
		close();
	}, [saveAction, close, surname, name, patronymic, phone, email, weight]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deletePerson(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deletePerson, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const setUploadedPreview = useCallback(async (file) => {
		setNewAvatarSource(URL.createObjectURL(file));
		setAvatarObj({ file: file });
	}, [setAvatarObj]);

	const [clickUpload] = useFileInput(setUploadedPreview);

	const uploadAvatar = async() => {
		const avatarData = await uploadPersonAvatar(avatarObj);

		return avatarData;
	}

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<a><img height='100%' width='100%' src={url}/></a>
			<Button mbs='x4' w={'auto'} square onClick={clickUpload}><Icon name='upload' size='x20'/>{t('Upload photo')}</Button>
		</Field>
		<hr align='center' width='100%' size='2' color='#cbced1' />
		<Field>
			<Field.Label>{t('Weight')}</Field.Label>
			<Field.Row>
				<TextInput value={weight} onChange={(e) => setWeight(e.currentTarget.value)}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Surname')}</Field.Label>
			<Field.Row>
				<TextInput value={surname} onChange={(e) => setSurname(e.currentTarget.value)}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Patronymic')}</Field.Label>
			<Field.Row>
				<TextInput value={patronymic} onChange={(e) => setPatronymic(e.currentTarget.value)}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Phone_number')}</Field.Label>
			<Field.Row>
				<TextInput value={phone} onChange={(e) => setPhone(e.currentTarget.value)}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Email')}</Field.Label>
			<Field.Row>
				<TextInput value={email} onChange={(e) => setEmail(e.currentTarget.value)}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!_id ? !allFieldFilled : !hasUnsavedChanges}>{t('Save')}</Button>
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
	</VerticalBar.ScrollableContent>;
}
