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
import ru from 'date-fns/locale/ru';

import { registerLocale } from 'react-datepicker';
registerLocale('ru', ru);

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validate, createWorkingGroupData } from './lib';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { useEndpointData } from '/client/hooks/useEndpointData';

require('react-datepicker/dist/react-datepicker.css');

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

export function EditWorkingGroup({ _id, cache, onChange, ...props }) {
	const queryUser = useMemo(() => ({
		query: JSON.stringify({ _id }),
	}), [_id, cache]);

	const { data, state, error } = useEndpointDataExperimental('users.list', queryUser);

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

	if (error || !data || data.users.length < 1) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditWorkingGroupWithData workingGroupUser={data.users[0]} onChange={onChange} {...props}/>;
}

function EditWorkingGroupWithData({ close, onChange, workingGroupUser, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		_id,
		workingGroup: previousWorkingGroup,
		surname: previousSurname,
		name: previousName,
		patronymic: previousPatronymic,
		position: previousPosition,
		phone: previousPhone,
		email: previousEmail
	} = workingGroupUser || {};
	const previousWorkingGroupUser = workingGroupUser || {};

	const [workingGroup, setWorkingGroup] = useState(previousWorkingGroup);
	const [surname, setSurname] = useState(previousSurname);
	const [name, setName] = useState(previousName);
	const [patronymic, setPatronymic] = useState(previousPatronymic);
	const [position, setPosition] = useState(previousPosition);
	const [phone, setPhone] = useState(previousPhone);
	const [email, setEmail] = useState(previousEmail);

	const setModal = useSetModal();

	useEffect(() => {
		setWorkingGroup(previousWorkingGroup || '');
		setSurname(previousSurname || '');
		setName(previousName || '');
		setPatronymic(previousPatronymic || '');
		setPosition(previousPosition || '');
		setPhone(previousPhone || '');
		setEmail(previousEmail || '');
	}, [
		previousWorkingGroup,
		previousSurname,
		previousName,
		previousPatronymic,
		previousPosition,
		previousPhone,
		previousEmail,
		previousWorkingGroupUser,
		_id]);

	const deleteWorkingGroupUser = useMethod('deleteWorkingGroupUser');
	const insertOrUpdateWorkingGroup = useMethod('insertOrUpdateWorkingGroup');

	const hasUnsavedChanges = useMemo(() =>
		previousWorkingGroup !== workingGroup
		|| previousSurname !== surname
		|| previousName !== name
		|| previousPatronymic !== patronymic
		|| previousPosition !== position
		|| previousPhone !== phone
		|| previousEmail !== email,
	[workingGroup, surname, name, patronymic, position, phone, email]);

	const saveAction = useCallback(async (workingGroup, surname, name, patronymic, position, phone, email) => {
		const workingGroupData = createWorkingGroupData(
			workingGroup,
			surname,
			name,
			patronymic,
			position,
			phone,
			email,
			{
				previousWorkingGroup,
				previousSurname,
				previousName,
				previousPatronymic,
				previousPosition,
				previousPhone,
				previousEmail,
				_id });
		const validation = validate(workingGroupData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroup(workingGroupData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [
		_id,
		dispatchToastMessage,
		insertOrUpdateWorkingGroup,
		workingGroup,
		surname,
		name,
		patronymic,
		position,
		phone,
		email,
		previousWorkingGroup,
		previousSurname,
		previousName,
		previousPatronymic,
		previousPosition,
		previousPhone,
		previousEmail,
		previousWorkingGroupUser
	]);

	const handleSave = useCallback(async () => {
		saveAction(
			workingGroup,
			surname,
			name,
			patronymic,
			position,
			phone,
			email
		);
		onChange();
	}, [saveAction, onChange]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteWorkingGroupUser(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteWorkingGroupUser, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const workingGroupOptions = useMemo(() => [
		['Не выбрано', t('Not_chosen')],
		['Члены рабочей группы', 'Члены рабочей группы'],
		['Представители субъектов Российской Федерации', 'Представители субъектов Российской Федерации'],
		['Иные участники', 'Иные участники'],
	], [t]);

	const getShortFio = (surname, name, patronymic) => [surname, name.charAt(0).toUpperCase(), patronymic ? patronymic.charAt(0).toUpperCase() : ''].join(' ');

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Full_Name')}</Field.Label>
			<Field.Row>
				<TextInput readOnly value={getShortFio(surname, name, patronymic)}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Working_group')}</Field.Label>
			<Field.Row>
				<Select options={workingGroupOptions} onChange={setWorkingGroup} value={workingGroup} selected={workingGroup}/>
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
		{/*<Field>*/}
		{/*	<Field.Row>*/}
		{/*		<ButtonGroup stretch w='full'>*/}
		{/*			<Button primary danger onClick={openConfirmDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>*/}
		{/*		</ButtonGroup>*/}
		{/*	</Field.Row>*/}
		{/*</Field>*/}
	</VerticalBar.ScrollableContent>;
}
