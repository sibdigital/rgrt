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

import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';

import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { GenericTable, Th } from '../../../../client/components/GenericTable';
import Page from '../../../../client/components/basic/Page';
import { AddParticipant } from './Participants/AddParticipant';
import { CreateParticipant } from './Participants/CreateParticipant';
import { Participants } from './Participants/Participants';

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
	const context = useRouteParameter('context');
	const councilId = useRouteParameter('id');

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

	return <EditCouncilWithNewData council={data} onChange={onChange}/>;
}

EditCouncilPage.displayName = 'EditCouncilPage';

export default EditCouncilPage;

function EditCouncilWithNewData({ council, onChange }) {
	const t = useTranslation();

	const { _id, d: previousDate, desc: previousDescription } = council || {};
	const previousInvitedUsers = useMemo(() => council.invitedUsers ? council.invitedUsers.slice() : [], [council.invitedUsers.slice()]);
	const previousCouncil = council || {};

	const [context, setContext] = useState('participants');
	const [date, setDate] = useState(new Date(previousDate));
	const [description, setDescription] = useState(previousDescription);
	const [invitedUsers, setInvitedUsers] = useState(previousInvitedUsers);
	const [onCreateParticipantId, setOnCreateParticipantId] = useState();

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

	const handleInsertOrUpdatePerson = (newUser, oldUser) => () => {
		const indexOldUser = getIndexInvitedUser(oldUser);
		if (indexOldUser > -1) {
			invitedUsers[indexOldUser] = newUser;
		} else {
			invitedUsers.push(newUser);
		}
		onChange();
	};

	const onAddParticipantClick = (_id) => () => {
		setContext('addParticipants');
	};

	const onCreateParticipantClick = useCallback((_id) => () => {
		setOnCreateParticipantId(_id);
		setContext('onCreateParticipant');
	}, [onCreateParticipantId, context]);

	const onParticipantClick = useCallback((context) => () => {
		setContext(context);
	}, [context]);

	const onClose = () => {
		setContext('participants');
		if (onCreateParticipantId) {
			setOnCreateParticipantId(undefined);
		}
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
						<TextAreaInput style={ { whiteSpace: 'normal' } } row='4' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
					</Field.Row>
				</Field>
				{context === 'participants' && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button marginInlineEnd='10px' small primary onClick={onAddParticipantClick(_id)} aria-label={t('Add')}>
							{t('Council_Add_Participant')}
						</Button>
					</Field.Row>
				</Field>}
				{context === 'participants' && <Participants councilId={_id} onChange={onChange}/>}
				{context === 'addParticipants' && <AddParticipant councilId={_id} onChange={onChange} close={onClose} invitedUsers={invitedUsers} onNewParticipant={onParticipantClick}/>}
				{context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} />}
				{context === 'onCreateParticipant' && <AddParticipant onCreateParticipantId={onCreateParticipantId} councilId={_id} onChange={onChange} close={onClose} invitedUsers={invitedUsers} onNewParticipant={onParticipantClick}/>}
			</Page.Content>
		</Page>
	</Page>;
}
