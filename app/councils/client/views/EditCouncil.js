import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { Box, Button, ButtonGroup, Field, Icon, TextAreaInput, TextInput, Modal, Label, Tabs } from '@rocket.chat/fuselage';
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
import { useRouteParameter, useCurrentRoute } from '../../../../client/contexts/RouterContext';
import { validate, createCouncilData } from './lib';
import { settings } from '../../../settings/client';
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
const useQuery = ({ itemsPerPage, current }, [column, direction], councilId) => useMemo(() => ({
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
			{ _id: councilId }
		],
	}),
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, councilId, column, direction]);

export function EditCouncilPage() {
	const t = useTranslation();
	const context = useRouteParameter('context');
	const councilId = useRouteParameter('id');
	const routeUrl = useCurrentRoute();

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
	const invitedUsersData = useEndpointData('councils.invitedUsers', useQuery(debouncedParams, debouncedSort, councilId)) || { invitedUsers: [] };

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

	const { _id, d: previousDate, desc: previousDescription } = council || {};
	const previousInvitedUsers = useMemo(() => council.invitedUsers ? council.invitedUsers.slice() : [], [council.invitedUsers.slice()]);
	const previousCouncil = council || {};

	const [context, setContext] = useState('participants');
	const [date, setDate] = useState(new Date(previousDate));
	const [description, setDescription] = useState(previousDescription);
	const [onCreateParticipantId, setOnCreateParticipantId] = useState();
	const [invitedUsersIds, setInvitedUsersIds] = useState([]);
	const [tab, setTab] = useState('info');

	const address = settings.get('Site_Url') + 'i/' + council.inviteLink || '';
	// const invitedUsers = useMemo(() => users.filter((user) => invitedUsersIds.findIndex((iUser) => iUser === user._id) > -1), [invitedUsersIds, users]);

	useEffect(() => {
		setDate(new Date(previousDate) || '');
		setDescription(previousDescription || '');
		if (invitedUsersData) {
			setInvitedUsersIds(invitedUsersData);
		}
	}, [previousDate, previousDescription, invitedUsersData]);

	const invitedUsers = useMemo(() => users.filter((user) => {
		const iUser = invitedUsersIds.find((iUser) => iUser._id === user._id);
		if (!iUser) { return; }

		if (!iUser.ts) {
			user.ts = new Date('January 1, 2021 00:00:00');
		} else {
			user.ts = iUser.ts;
		}
		return user;
	}), [invitedUsersIds, users]);

	const setModal = useSetModal();

	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');
	const deleteCouncil = useMethod('deleteCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

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
			location.reload();
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

	// const header = useMemo(() => [
	// 	<Th key={'File_name'} color='default'>
	// 		{ t('File_name') }
	// 	</Th>,
	// 	<Th w='x40' key='download'/>,
	// ], [mediaQuery]);

	// const renderRow = (document) => {
	// 	const { _id, title } = document;
	// 	return <Table.Row tabIndex={0} role='link' action>
	// 		<Table.Cell fontScale='p1' color='default'>{title}</Table.Cell>
	// 		<Table.Cell alignItems={'end'}>
	// 			<Button onClick={onDownloadClick(_id)} small aria-label={t('download')}>
	// 				<Icon name='download'/>
	// 			</Button>
	// 		</Table.Cell>
	// 	</Table.Row>;
	// };

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
				<Field mbe='x8'>
					<Field.Label>{t('Council_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' fontScale='p1' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Council_type')}</Field.Label>
					<Field.Row>
						<TextInput readOnly />
					</Field.Row>
				</Field>
				{/* <Tabs flexShrink={0} mbe='x8'>
					<Tabs.Item selected={tab === 'info'} onClick={handleTabClick('info')}>{t('Council_Invited_Users')}</Tabs.Item>
					<Tabs.Item selected={tab === 'files'} onClick={handleTabClick('files')}>{t('Files')}</Tabs.Item>
				</Tabs> */}
				{context === 'participants' && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button marginInlineEnd='10px' small primary onClick={onAddParticipantClick(_id)} aria-label={t('Add')}>
							{t('Council_Add_Participant')}
						</Button>
					</Field.Row>
				</Field>}
				{tab === 'files' && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button marginInlineEnd='10px' small primary disabled aria-label={t('Add')}>
							{t('Upload_file_question')}
						</Button>
					</Field.Row>
				</Field>}
				{tab === 'info' && context === 'participants' && <Participants councilId={_id} onChange={onChange} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsersIds}/>}
				{tab === 'info' && context === 'addParticipants' && <AddParticipant councilId={_id} onChange={onChange} close={onClose} users={users} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} onNewParticipant={onParticipantClick}/>}
				{tab === 'info' && context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} workingGroupOptions={workingGroupOptions}/>}
				{tab === 'info' && context === 'onCreateParticipant' && <AddParticipant onCreateParticipantId={onCreateParticipantId} councilId={_id} onChange={onChange} close={onClose} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} onNewParticipant={onParticipantClick}/>}
				{/* {tab === 'files' && 
					<GenericTable header={header} renderRow={renderRow} results={[]} total={0} setParams={setParams} params={params}/>
				} */}
			</Page.Content>
		</Page>
	</Page>;
}
