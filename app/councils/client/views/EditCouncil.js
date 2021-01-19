import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, Field, Icon, TextAreaInput, TextInput, Modal, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { validate, createCouncilData } from './lib';
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

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);
const useQuery = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1,	surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: '', $options: 'i' } },
			{ username: { $regex: '', $options: 'i' } },
			{ name: { $regex: '', $options: 'i' } },
			{ surname: { $regex: '', $options: 'i' } },
		],
		$and: [
			{ type: { $ne: 'bot' } },
		],
	}),
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction]);

export function EditCouncilPage() {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const councilId = useRouteParameter('id');

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const usersQuery = useQuery(debouncedParams, debouncedSort);

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const { data } = useEndpointDataExperimental('councils.findOne', query) || { result: [] };
	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };
	const usersData = useEndpointData('users.list', usersQuery) || { users: [] };
	const invitedUsersData = useEndpointData('councils.invitedUsers', query) || { invitedUsers: [] };

	const [cache, setCache] = useState();
	const [invitedUsers, setInvitedUsers] = useState([]);
	const [users, setUsers] = useState([]);

	useEffect(() => {
		if (invitedUsersData.invitedUsers) {
			setInvitedUsers(invitedUsersData.invitedUsers);
		}
		if (usersData.users) {
			setUsers(usersData.users);
		}
	}, [invitedUsersData, usersData]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroups && workingGroups.workingGroups?.length > 0) {
			return res.concat(workingGroups.workingGroups.map((workingGroup) => [workingGroup.title, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

	if (!data) {
		return <Box fontScale='h1' pb='x20'>{'error'}</Box>;
	}

	if (!data.invitedUsers) {
		data.invitedUsers = [];
	}

	return <EditCouncilWithNewData council={data} onChange={onChange} workingGroupOptions={workingGroupOptions} users={users} invitedUsersData={invitedUsers}/>;
}

EditCouncilPage.displayName = 'EditCouncilPage';

export default EditCouncilPage;

function EditCouncilWithNewData({ council, onChange, workingGroupOptions, users, invitedUsersData }) {
	const t = useTranslation();

	// console.log(council);
	const { _id, d: previousDate, desc: previousDescription } = council || {};
	const previousInvitedUsers = useMemo(() => council.invitedUsers ? council.invitedUsers.slice() : [], [council.invitedUsers.slice()]);
	const previousCouncil = council || {};

	const [context, setContext] = useState('participants');
	const [date, setDate] = useState(new Date(previousDate));
	const [description, setDescription] = useState(previousDescription);
	// const [invitedUsers, setInvitedUsers] = useState(previousInvitedUsers);
	const [onCreateParticipantId, setOnCreateParticipantId] = useState();
	const [invitedUsersIds, setInvitedUsersIds] = useState([]);

	const invitedUsers = useMemo(() => users.filter((user) => invitedUsersIds.findIndex((iUser) => iUser === user._id) > -1), [invitedUsersIds, users]);

	const setModal = useSetModal();

	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');
	const deleteCouncil = useMethod('deleteCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		setDate(new Date(previousDate) || '');
		setDescription(previousDescription || '');
		if (invitedUsersData) {
			setInvitedUsersIds(invitedUsersData.map((user) => user._id));
		}
	}, [previousDate, previousDescription, previousCouncil, _id, invitedUsersData]);

	const compare = (arr1, arr2) => arr1.length === arr2.length && arr1.every((v, i) => ( v === arr2[i]._id));

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
		setInvitedUsersIds(previousInvitedUsers);
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
		await saveAction(date, description, invitedUsers.map((user) => user._id));
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
				{context === 'participants' && <Participants councilId={_id} onChange={onChange} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsersIds}/>}
				{context === 'addParticipants' && <AddParticipant councilId={_id} onChange={onChange} close={onClose} users={users} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} onNewParticipant={onParticipantClick}/>}
				{context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} workingGroupOptions={workingGroupOptions}/>}
				{context === 'onCreateParticipant' && <AddParticipant onCreateParticipantId={onCreateParticipantId} councilId={_id} onChange={onChange} close={onClose} invitedUsers={invitedUsers} onNewParticipant={onParticipantClick}/>}
			</Page.Content>
		</Page>
	</Page>;
}
