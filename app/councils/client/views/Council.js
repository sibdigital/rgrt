import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { ButtonGroup, Button, Field, Icon, Label, TextInput, TextAreaInput, Modal, Tabs, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { settings } from '../../../settings/client';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { Participants } from './Participants/Participants';
import { AddParticipant } from './Participants/AddParticipant';
import { CreateParticipant } from './Participants/CreateParticipant';

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

export function CouncilPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const councilId = useRouteParameter('id');

	const [onCreateParticipantId, setOnCreateParticipantId] = useState();
	const [context, setContext] = useState('participants');
	const [invitedUsers, setInvitedUsers] = useState([]);
	const [persons, setPersons] = useState([]);
	const [cache, setCache] = useState();
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [users, setUsers] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const usersQuery = useQuery(debouncedParams, debouncedSort);

	const onChange = () => { console.log('onChange'); setCache(new Date()); };

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const data = useEndpointData('councils.findOne', query) || { result: [] };
	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };
	const usersData = useEndpointData('users.list', usersQuery) || { users: [] };
	const invitedUsersData = useEndpointData('councils.invitedUsers', query) || { invitedUsers: [] };
	// const personsData = useEndpointData('persons.list', useMemo(() => ({ }), []));
	// const personsData = useEndpointData('persons.findOne', useMemo(() => ({ query: JSON.stringify({ _id: '"FK7b6iun9mAyyjit8"' }) }), []));
	// useMemo(() => ({ query: JSON.stringify({ _id: { $in: data?.invitedPersons?.map((person) => person._id) } }) }

	useEffect(() => {
		console.log(data);
		// console.log(personsData);
		if (invitedUsersData.invitedUsers) {
			setInvitedUsers(invitedUsersData.invitedUsers);
		}
		if (usersData.users) {
			setUsers(usersData.users);
		}
		if (data.invitedPersons) {
			setPersons(data.invitedPersons);
		}
	}, [invitedUsersData, usersData]);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroups && workingGroups.workingGroups?.length > 0) {
			return res.concat(workingGroups.workingGroups.map((workingGroup) => [workingGroup.title, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

	return <Council persons={persons} councilId={councilId} data={data} users={users} setUsers={setUsers} onChange={onChange} workingGroupOptions={workingGroupOptions} invitedUsersData={invitedUsers}/>;
}

CouncilPage.displayName = 'CouncilPage';

export default CouncilPage;

function Council({ persons, councilId, data, users, setUsers, onChange, workingGroupOptions, invitedUsersData }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [onCreateParticipantId, setOnCreateParticipantId] = useState();
	const [context, setContext] = useState('participants');
	const [invitedUsersIds, setInvitedUsersIds] = useState([]);
	const [tab, setTab] = useState('info');

	useEffect(() => {
		if (invitedUsersData) {
			setInvitedUsersIds(invitedUsersData.map((user) => user._id));
		}
	}, [invitedUsersData]);

	const invitedUsers = useMemo(() => users.filter((user) => invitedUsersIds.findIndex((iUser) => iUser === user._id) > -1), [invitedUsersIds, users]);

	const handleTabClick = useMemo(() => (tab) => () => setTab(tab), []);

	const setModal = useSetModal();

	const deleteCouncil = useMethod('deleteCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');

	const downloadCouncilParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadCouncilParticipantsMethod({ _id, dateString: formatDateAndTime(data.d) });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			const fileName = t('Council_Invited_Users_List') + ' ' + moment(new Date()).format('DD MMMM YYYY') + '.docx';
			link.setAttribute('download', fileName);
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadCouncilParticipants :', e);
		}
	};

	const address = settings.get('Site_Url') + 'i/' + data.inviteLink || '';

	const goBack = () => {
		window.history.back();
	};

	const goToCouncils = () => {
		FlowRouter.go('councils');
	};

	const onEdit = (_id) => () => {
		FlowRouter.go(`/council/edit/${ _id }`);
	};

	const onAddParticipantClick = (_id) => () => {
		setContext('addParticipants');
	};

	const onParticipantClick = useCallback((context) => () => {
		setContext(context);
	}, [context]);

	const onEmailSendClick = (_id) => () => {
		FlowRouter.go(`/manual-mail-sender/council/${ _id }`);
	};

	const onClose = () => {
		setContext('participants');
		if (onCreateParticipantId) {
			setOnCreateParticipantId(undefined);
			location.reload()
		}
	};

	const onCreateParticipantClick = useCallback((user) => () => {
		setOnCreateParticipantId(user._id);
		setContext('onCreateParticipant');
	}, [onCreateParticipantId, context]);

	const onDeleteCouncilConfirm = useCallback(async () => {
		try {
			await deleteCouncil(councilId);
			setModal(() => <SuccessModal title={'Delete'} onClose={() => { setModal(undefined); }}/>);
			goToCouncils();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteCouncil, dispatchToastMessage]);

	const onDeleteCouncilClick = () => setModal(() => <DeleteWarningModal title={t('Council_Delete_Warning')} onDelete={onDeleteCouncilConfirm} onCancel={() => setModal(undefined)}/>);

	const header = useMemo(() => [
		<Th key={'File_name'} color='default'>
			{ t('File_name') }
		</Th>,
		<Th w='x40' key='download'/>,
	], [mediaQuery]);

	const renderRow = (document) => {
		const { _id, title } = document;
		return <Table.Row tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{title}</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button onClick={onDownloadClick(_id)} small aria-label={t('download')}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<Button className='go-back-button' onClick={goBack}>
						<Icon name='back'/>
					</Button>
					<Label fontScale='h1'>{t('Council')}</Label>

				</Field>
				<ButtonGroup>
					<Button primary danger small aria-label={t('Delete')} onClick={onDeleteCouncilClick}>
						{t('Delete')}
					</Button>
					<Button primary small aria-label={t('Edit')} onClick={onEdit(councilId)}>
						{t('Edit')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Date')}</Field.Label>
					<Field.Row>
						<TextInput readOnly is='span' fontScale='p1'>{formatDateAndTime(data.d)}</TextInput>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput style={ { whiteSpace: 'normal' } } value={data.desc} row='4' readOnly fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Council_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' fontScale='p1' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				<Tabs flexShrink={0} mbe='x8'>
					<Tabs.Item selected={tab === 'info'} onClick={handleTabClick('info')}>{t('Council_Invited_Users')}</Tabs.Item>
					<Tabs.Item selected={tab === 'persons'} onClick={handleTabClick('persons')}>{t('Council_Invited_Persons')}</Tabs.Item>
					<Tabs.Item selected={tab === 'files'} onClick={handleTabClick('files')}>{t('Files')}</Tabs.Item>
				</Tabs>
				{tab === 'info' && context === 'participants' && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button marginInlineEnd='10px' small primary onClick={onAddParticipantClick(councilId)} aria-label={t('Add')}>
							{t('Council_Add_Participant')}
						</Button>
						<Button marginInlineEnd='10px' small primary onClick={onEmailSendClick(councilId)} aria-label={t('Send_email')}>
							{t('Send_email')}
						</Button>
						<Button small primary onClick={downloadCouncilParticipants(councilId)} aria-label={t('Download')}>
							{t('Download_Council_Participant_List')}
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
				{tab === 'info' && context === 'participants' && <Participants councilId={councilId} onChange={onChange} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsersIds}/>}
				{tab === 'info' && context === 'addParticipants' && <AddParticipant councilId={councilId} onChange={onChange} close={onClose} users={users} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} onNewParticipant={onParticipantClick}/>}
				{tab === 'info' && context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} workingGroupOptions={workingGroupOptions}/>}
				{tab === 'info' && context === 'onCreateParticipant' && <AddParticipant onCreateParticipantId={onCreateParticipantId} councilId={councilId} onChange={onChange} close={onClose} invitedUsers={invitedUsers} onNewParticipant={onParticipantClick}/>}
				{tab === 'files' && 
					<GenericTable header={header} renderRow={renderRow} results={[]} total={0} setParams={setParams} params={params}/>
				}
				{tab === 'persons' && 
					<PersonsTable persons={persons} />}
			</Page.Content>
		</Page>
	</Page>;
}

function PersonsTable({ persons }) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');
	
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const header = useMemo(() => [
		<Th key={'Council_Invited_Person'} color='default'>{ t('Council_Invited_Person') }</Th>,
		<Th key={'Phone_number'} color='default'>{ t('Phone_number') }</Th>,
		<Th key={'Email'} color='default'>{ t('Email') }</Th>,
	], [mediaQuery]);

	const renderRow = (person) => {
		const { _id, surname, name, patronymic, phone, email } = person;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default' style={{ whiteSpace: 'normal' }}>{surname} {name} {patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{phone}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{email}</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={persons ?? []} total={persons?.length ?? 0} setParams={setParams} params={params}/>;
}