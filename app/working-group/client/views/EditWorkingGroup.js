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
	TextAreaInput,
	TextInput,
} from '@rocket.chat/fuselage';
import moment from 'moment';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { Modal } from '../../../../client/components/basic/Modal';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validate, createWorkingGroupData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

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
	//b8vBMZpYCf4n82x3c
	// const query = useMemo(() => ({
	// 	query: JSON.stringify({ _id }),
	// }), [_id, cache]);
	//_id = 'b8vBMZpYCf4n82x3c';
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

	return <EditWorkingGroupWithData workingGroup={data.workingGroups[0]} onChange={onChange} {...props}/>;
}

function EditWorkingGroupWithData({ close, onChange, workingGroup, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		_id,
		workingGroupType: previousWorkingGroupType,
		surname: previousSurname,
		name: previousName,
		patronymic: previousPatronymic,
		position: previousPosition,
		phone: previousPhone,
		email: previousEmail
	} = workingGroup || {};
	const previousWorkingGroup = workingGroup || {};

	const [workingGroupType, setWorkingGroupType] = useState(previousWorkingGroupType);
	const [surname, setSurname] = useState(previousSurname);
	const [name, setName] = useState(previousName);
	const [patronymic, setPatronymic] = useState(previousPatronymic);
	const [position, setPosition] = useState(previousPosition);
	const [phone, setPhone] = useState(previousPhone);
	const [email, setEmail] = useState(previousEmail);

	const [modal, setModal] = useState();

	useEffect(() => {
		setWorkingGroupType(previousWorkingGroupType || '');
		setSurname(previousSurname || '');
		setName(previousName || '');
		setPatronymic(previousPatronymic || '');
		setPosition(previousPosition || '');
		setPhone(previousPhone || '');
		setEmail(previousEmail || '');
	}, [
		previousWorkingGroupType,
		previousSurname,
		previousName,
		previousPatronymic,
		previousPosition,
		previousPhone,
		previousEmail,
		previousWorkingGroup,
		_id]);

	const deleteWorkingGroupUser = useMethod('deleteWorkingGroupUser');
	const insertOrUpdateWorkingGroup = useMethod('insertOrUpdateWorkingGroup');

	const hasUnsavedChanges = useMemo(() =>
		previousWorkingGroupType !== workingGroupType
		|| previousSurname !== surname
		|| previousName !== name
		|| previousPatronymic !== patronymic
		|| previousPosition !== position
		|| previousPhone !== phone
		|| previousEmail !== email,
	[workingGroupType, surname, name, patronymic, position, phone, email]);

	const saveAction = async (workingGroupType, surname, name, patronymic, position, phone, email) => {
		const workingGroupData = createWorkingGroupData(
			workingGroupType,
			surname,
			name,
			patronymic,
			position,
			phone,
			email,
			{
				previousWorkingGroupType,
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
	};

	const handleSave = useCallback(async () => {
		await saveAction(
			workingGroupType,
			surname,
			name,
			patronymic,
			position,
			phone,
			email
		);
		onChange();
	}, [
		workingGroupType,
		surname,
		name,
		patronymic,
		position,
		phone,
		email,
		_id]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteWorkingGroupUser(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	return <>
		<VerticalBar.ScrollableContent {...props}>
			<Field>
				<Field.Label>{t('Working_group')}</Field.Label>
				<Field.Row>
					<TextAreaInput value={workingGroupType} onChange={(e) => setWorkingGroupType(e.currentTarget.value)} placeholder={t('Working_group')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Surname')}</Field.Label>
				<Field.Row>
					<TextInput value={surname} onChange={(e) => setSurname(e.currentTarget.value)} placeholder={t('Surname')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Patronymic')}</Field.Label>
				<Field.Row>
					<TextInput value={patronymic} onChange={(e) => setPatronymic(e.currentTarget.value)} placeholder={t('Patronymic')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Council_Organization_Position')}</Field.Label>
				<Field.Row>
					<TextAreaInput value={position} onChange={(e) => setPosition(e.currentTarget.value)} placeholder={t('Council_Organization_Position')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Phone_number')}</Field.Label>
				<Field.Row>
					<TextInput value={phone} onChange={(e) => setPhone(e.currentTarget.value)} placeholder={t('Phone_number')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Email')}</Field.Label>
				<Field.Row>
					<TextInput value={email} onChange={(e) => setEmail(e.currentTarget.value)} placeholder={t('Email')} />
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
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button primary danger onClick={openConfirmDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</VerticalBar.ScrollableContent>
		{ modal }
	</>;
}
