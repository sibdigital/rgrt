import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	Icon,
	TextAreaInput,
	TextInput,
	Modal, Table, Label, Margins, CheckBox,
} from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { validate, createCouncilData } from './lib';

import { useFormatDateAndTime } from '/client/hooks/useFormatDateAndTime';
import { useRouteParameter } from '/client/contexts/RouterContext';

import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { GenericTable, Th } from '/client/components/GenericTable';
import Page from '/client/components/basic/Page';

registerLocale('ru', ru);

require('react-datepicker/dist/react-datepicker.css');

const DeleteWarningModal = ({ title, onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{title}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ title, onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{title}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditCouncilPage() {
	const councilId = useRouteParameter('id');
	const context = useRouteParameter('context');
	//const councilId = _id ? _id : (context === 'new' ? '1' : context);
	//console.log(_id);
	console.log(context);
	console.log(councilId);

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const { data } = useEndpointDataExperimental('councils.findOne', query) || { result: [] };
	const [cache, setCache] = useState();

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	if (!data) {
		return <Box fontScale='h1' pb='x20'>{'error'}</Box>;
	}

	if (!data.invitedUsers) {
		data.invitedUsers = [];
	}

	return <EditCouncilWithNewData council={data} onChange={onChange} context={context}/>;
}

EditCouncilPage.displayName = 'EditCouncilPage';

export default EditCouncilPage;

const style = { textOverflow: 'ellipsis', overflow: 'hidden' };

function EditCouncilWithNewData({ council, onChange, context }) {
	const t = useTranslation();

	const { _id, d: previousDate, desc: previousDescription } = council || {};
	const previousInvitedUsers = useMemo(() => council.invitedUsers ? council.invitedUsers.slice() : [], [council.invitedUsers.slice()]);
	const previousCouncil = council || {};

	const isEditUserState = context === 'newParticipant';
	const [isEditUser, setIsEditUser] = useState(isEditUserState);
	const [date, setDate] = useState(new Date(previousDate));
	const [description, setDescription] = useState(previousDescription);
	const [invitedUsers, setInvitedUsers] = useState(previousInvitedUsers);
	const [currentInvitedUser, setCurrentInvitedUser] = useState({});

	const setModal = useSetModal();

	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');
	const deleteCouncil = useMethod('deleteCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		setDate(new Date(previousDate) || '');
		setDescription(previousDescription || '');
	}, [previousDate, previousDescription, previousCouncil, _id]);

	const compare = (arr1, arr2) => { return arr1.length === arr2.length && arr1.every((v, i) => (
		v.firstName === arr2[i].firstName
		&& v.lastName === arr2[i].lastName
		&& v.patronymic === arr2[i].patronymic
		&& v.position === arr2[i].position
		&& v.contactPersonFirstName === arr2[i].contactPersonFirstName
		&& v.contactPersonLastName === arr2[i].contactPersonLastName
		&& v.contactPersonPatronymicName === arr2[i].contactPersonPatronymicName
		&& v.phone === arr2[i].phone
		&& v.email === arr2[i].email
		&& v.ts === arr2[i].ts));
	};

	const goBack = () => {
		window.history.back();
	};

	const goToCouncils = () => {
		FlowRouter.go('councils');
	};

	// console.log(compare(previousInvitedUsers, invitedUsers));
	// console.log(previousInvitedUsers);
	// console.log(invitedUsers);
	// console.log(council.invitedUsers);
	// console.log(description);
	// console.log(previousDescription);
	// console.log(council.desc);

	const hasUnsavedChanges = useMemo(() => new Date(previousDate).getTime() !== new Date(date).getTime() || previousDescription !== description || !compare(previousInvitedUsers, invitedUsers),
		[date, description, invitedUsers, previousDate, previousDescription, previousInvitedUsers]);

	const hasEditUser = useMemo(() => isEditUser === true, [isEditUser]);

	const handleEditUser = () => {
		setIsEditUser(!isEditUser);
	};

	const handleAddUser = () => {
		setCurrentInvitedUser({});
		handleEditUser();
	};

	const resetData = () => {
		setDate(new Date(previousDate));
		setDescription(previousDescription);
		setInvitedUsers(previousInvitedUsers);
		onChange();
	};

	const getIndexInvitedUser = (invitedUser) => {
		return invitedUsers.findIndex((user) => (
			user.firstName === invitedUser.firstName
			&& user.lastName === invitedUser.lastName
			&& user.patronymic === invitedUser.patronymic
			&& user.position === invitedUser.position
			&& user.contactPersonFirstName === invitedUser.contactPersonFirstName
			&& user.contactPersonLastName === invitedUser.contactPersonLastName
			&& user.contactPersonPatronymicName === invitedUser.contactPersonPatronymicName
			&& user.phone === invitedUser.phone
			&& user.email === invitedUser.email
			&& user.ts === invitedUser.ts
		));
	};

	const onEditClick = (invitedUser) => () => {
		setCurrentInvitedUser(invitedUser);
		onChange();
		handleEditUser();
	};

	const handleInsertOrUpdatePerson = (newUser, oldUser) => () => {
		const indexOldUser = getIndexInvitedUser(oldUser);
		if (indexOldUser > -1) {
			invitedUsers[indexOldUser] = newUser;
		} else {
			invitedUsers.push(newUser);
		}
		setCurrentInvitedUser({});
		onChange();
		handleEditUser();
	};

	const saveAction = useCallback(async (date, description, invitedUsers) => {
		const councilData = createCouncilData(date, description, { previousDate, previousDescription, _id }, invitedUsers);
		const validation = validate(councilData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateCouncil(councilData);
			goBack();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateCouncil, date, description, invitedUsers, previousDate, previousDescription, previousCouncil, t]);

	const handleSaveCouncil = useCallback(async () => {
		await saveAction(date, description, invitedUsers);
		dispatchToastMessage({ type: 'success', message: t('Council_edited') });
		onChange();
	}, [saveAction, onChange]);

	const handleDeleteCouncil = useCallback(async () => {
		try {
			await deleteCouncil(_id);
			setModal(() => <SuccessModal title={'Delete'} onClose={() => { setModal(undefined); onChange(); }}/>);
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [deleteCouncil, onChange]);

	const onDeleteParticipantConfirm = (invitedUser) => () => {
		try {
			const indexUser = getIndexInvitedUser(invitedUser);
			if (indexUser < 0) {
				dispatchToastMessage({ type: 'error', message: t('User_not_found') });
				return;
			}
			invitedUsers.splice(indexUser, 1);
			setModal(() => <SuccessModal title={t('Council_Participant_Has_Been_Deleted')} onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	};

	const onDeleteCouncilConfirm = useCallback(async () => {
		try {
			await handleDeleteCouncil();
			goToCouncils();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [handleDeleteCouncil, dispatchToastMessage, onChange]);

	const onDeleteParticipantClick = (invitedUser) => () => setModal(() => <DeleteWarningModal title={t('Council_Delete_Participant_Warning')} onDelete={onDeleteParticipantConfirm(invitedUser)} onCancel={() => setModal(undefined)}/>);

	const onDeleteCouncilClick = () => setModal(() => <DeleteWarningModal title={t('Council_Delete_Warning')} onDelete={onDeleteCouncilConfirm} onCancel={() => setModal(undefined)}/>);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<Button className='go-back-button' onClick={goBack}>
						<Icon name='back'/>
					</Button>
					<Label fontScale='h1'>{t('Council_edit')}</Label>
				</Field>
				<ButtonGroup>
					<Button primary danger small aria-label={t('Delete')} onClick={onDeleteCouncilClick}>
						{t('Delete')}
					</Button>
					<Button primary small aria-label={t('Council_Add_Participant')} disabled={hasEditUser} onClick={handleAddUser}>
						{t('Council_Add_Participant')}
					</Button>
					<Button primary small aria-label={t('Cancel')} disabled={!hasUnsavedChanges} onClick={resetData}>
						{t('Cancel')}
					</Button>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveCouncil}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Date')} <span style={ { color: 'red' } }>{t('Editing')}</span></Field.Label>
					<Field.Row>
						<DatePicker
							dateFormat='dd.MM.yyyy HH:mm'
							selected={date}
							onChange={(newDate) => setDate(newDate)}
							showTimeSelect
							timeFormat='HH:mm'
							timeIntervals={5}
							timeCaption='Время'
							customInput={<TextInput border='1px solid #4fb0fc' />}
							locale='ru'
							popperClassName='date-picker'
						/>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')} <span style={ { color: 'red' } }>{t('Editing')}</span></Field.Label>
					<Field.Row>
						<TextAreaInput border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field height={'600px'}>
						{ isEditUser && <EditInvitedUser invitedUser={currentInvitedUser} handleCancel={handleEditUser} handleInsertOrUpdateSubmit={handleInsertOrUpdatePerson}/>}
						{ !isEditUser && <InvitedUsersTable invitedUsers={invitedUsers} onEdit={onEditClick} onDelete={onDeleteParticipantClick}/>}
					</Field>
				</Field>
			</Page.Content>
		</Page>
	</Page>;
}

function EditInvitedUser({ invitedUser, handleCancel, handleInsertOrUpdateSubmit }) {
	const [newData, setNewData] = useState({
		firstName: { value: invitedUser.firstName ?? '', required: true },
		lastName: { value: invitedUser.lastName ?? '', required: true },
		patronymic: { value: invitedUser.patronymic ?? '', required: false },
		position: { value: invitedUser.position ?? '', required: true },
		contactPersonFirstName: { value: invitedUser.contactPersonFirstName ?? '', required: false },
		contactPersonLastName: { value: invitedUser.contactPersonLastName ?? '', required: false },
		contactPersonPatronymicName: { value: invitedUser.contactPersonPatronymicName ?? '', required: false },
		phone: { value: invitedUser.phone ?? '', required: true },
		email: { value: invitedUser.email ?? '', required: true },
		ts: { value: invitedUser.ts ?? '', required: false },
	});

	const isContact = !!(invitedUser.contactPersonFirstName && invitedUser.contactPersonLastName);

	const [isContactPerson, setIsContactPerson] = useState(isContact);

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const packNewData = () => {
		const dataToSend = {};
		Object.keys(newData).forEach((key) => {
			dataToSend[key] = newData[key].value.trim();
		});
		if (!isContactPerson) {
			delete dataToSend.contactPersonFirstName;
			delete dataToSend.contactPersonLastName;
			delete dataToSend.contactPersonPatronymicName;
		}
		if (!dataToSend.ts) {
			dataToSend.ts = new Date();
		}
		return dataToSend;
	};

	const handleIAmContactPerson = () => {
		setNewData({
			...newData,
			contactPersonFirstName: { value: newData.contactPersonFirstName.value, required: !isContactPerson },
			contactPersonLastName: { value: newData.contactPersonLastName.value, required: !isContactPerson },
		});
		setIsContactPerson(!isContactPerson);
	};

	const t = useTranslation();

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0, [JSON.stringify(newData)]);

	console.log('allFieldAreFilled', allFieldAreFilled);

	const inputsStyle = { width: '99%' };

	return <Margins blockStart='x32' blockEnd='x32'>
		<Box height='100%'>
			<Box display='flex' fontScale='s1' color='hint' marginBlockEnd='x16'>
				<Field.Label width='auto'>{t('Council_participant_info_description')}</Field.Label>
				<ButtonGroup>
					<Button fontSize={'1.1rem'} primary small aria-label={t('Cancel')} onClick={handleCancel}>
						{t('Cancel')}
					</Button>
					<Button fontSize={'1.1rem'} disabled={!allFieldAreFilled} primary small aria-label={t('Accept')} onClick={handleInsertOrUpdateSubmit(packNewData(), invitedUser)}>
						{t('Accept')}
					</Button>
				</ButtonGroup>
			</Box>
			<Box display='flex' flexDirection='column' overflow='auto' height='85%'>
				<Margins all='x8'>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_second_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.lastName.value} flexGrow={1} onChange={handleChange('lastName')} placeholder={`${ t('Council_second_name_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_first_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.firstName.value} flexGrow={1} onChange={handleChange('firstName')} placeholder={`${ t('Council_first_name_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_patronymic')}</Field.Label>
						<Field.Row>
							<TextInput value={newData.patronymic.value} flexGrow={1} onChange={handleChange('patronymic')} placeholder={`${ t('Council_patronymic_placeholder') }`} />
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_Organization_Position')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.position.value} flexGrow={1} onChange={handleChange('position')} placeholder={`${ t('Council_Organization_Position_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field.Row style={inputsStyle}>
						<CheckBox checked={isContactPerson} onChange={handleIAmContactPerson}/>
						<Field.Label>{t('Council_Is_Contact_person')}</Field.Label>
					</Field.Row>
					{ isContactPerson && <Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_lastname')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.contactPersonLastName.value} flexGrow={1} onChange={handleChange('contactPersonLastName')} placeholder={`${ t('Council_Contact_person_lastname_placeholder') } (${ t('Required') })`}/>
						</Field.Row>
					</Field> }
					{ isContactPerson && <Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_firstname')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.contactPersonFirstName.value} flexGrow={1} onChange={handleChange('contactPersonFirstName')} placeholder={`${ t('Council_Contact_person_firstname_placeholder') } (${ t('Required') })`}/>
						</Field.Row>
					</Field> }
					{ isContactPerson && <Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_patronymic')}</Field.Label>
						<Field.Row>
							<TextInput value={newData.contactPersonPatronymicName.value} flexGrow={1} onChange={handleChange('contactPersonPatronymicName')} placeholder={`${ t('Council_Contact_person_patronymic_placeholder') } (${ t('optional') })`}/>
						</Field.Row>
					</Field> }
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.phone.value} flexGrow={1} onChange={handleChange('phone')} placeholder={`${ t('Council_Contact_person_Phone_number_placeholder') }`}/>
						</Field.Row>
					</Field>
					<Field style={inputsStyle}>
						<Field.Label>{t('Council_Contact_person_email')} <span style={ { color: 'red' } }>*</span></Field.Label>
						<Field.Row>
							<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Council_Contact_person_email_placeholder') }`}/>
						</Field.Row>
					</Field>
				</Margins>
			</Box>
		</Box>
	</Margins>;
}

function InvitedUsersTable({ invitedUsers, onEdit, onDelete }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'fio'} color='default'>{t('Council_participant')}</Th>,
		<Th key={'position'} color='default'>{t('Council_Organization_Position')}</Th>,
		mediaQuery && <Th key={'contact'} color='default'>{t('Council_Contact_person')}</Th>,
		mediaQuery && <Th key={'phone'} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} color='default'>{t('Email')}</Th>,
		mediaQuery && <Th key={'createdAt'} style={{ width: '190px' }} color='default'>{t('Joined_at')}</Th>,
		<Th w='x40' key='edit'></Th>,
		<Th w='x40' key='delete'></Th>,
	], [mediaQuery]);

	const styleTableRow = { wordWrap: 'break-word' };

	const getBackgroundColor = (invitedUser) => {
		const index = invitedUsers.findIndex((user) => (
			user.firstName === invitedUser.firstName
			&& user.lastName === invitedUser.lastName
			&& user.patronymic === invitedUser.patronymic
			&& user.position === invitedUser.position
			&& user.contactPersonFirstName === invitedUser.contactPersonFirstName
			&& user.contactPersonLastName === invitedUser.contactPersonLastName
			&& user.contactPersonPatronymicName === invitedUser.contactPersonPatronymicName
			&& user.phone === invitedUser.phone
			&& user.email === invitedUser.email
			&& user.ts === invitedUser.ts
		));
		if (index > 0 && index % 2 === 1) {
			return 'var(--color-lighter-blue)';
		}

		return '';
	};

	const renderRow = (invitedUser) => {
		const iu = invitedUser;
		return <Table.Row key={iu._id} style={styleTableRow} backgroundColor={getBackgroundColor(invitedUser)} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.lastName} {iu.firstName} {iu.patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.position}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.contactPersonLastName} {iu.contactPersonFirstName} {iu.contactPersonPatronymicName}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{formatDateAndTime(iu.ts)}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEdit(iu)} aria-label={t('Edit_User')} >
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onDelete(iu)} aria-label={t('Delete')} >
					<Icon name='trash'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <Field mbe='x8'>
		<Field height={'600px'}>
			<GenericTable header={header} renderRow={renderRow} results={invitedUsers} total={invitedUsers.length} setParams={setParams} params={params} />
		</Field>
	</Field>;
}
