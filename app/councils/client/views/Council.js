import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { ButtonGroup, Button, Field, Icon, Label, TextInput, TextAreaInput, Modal, Tabs, Table, Select } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useRouteParameter, useCurrentRoute } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { settings } from '../../../settings/client';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { fileUploadToCouncil, filesValidation } from '../../../ui/client/lib/fileUpload';
import { mime } from '../../../utils/lib/mimeTypes';
import { Participants, Persons } from './Participants/Participants';
import { AddParticipant, AddPerson } from './Participants/AddParticipant';
import { CreateParticipant } from './Participants/CreateParticipant';
import { LeaderType } from 'docx';

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

const invitedUsersQuery = ({ itemsPerPage, current }, [column, direction], councilId) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: '', $options: 'i' } },
			{ username: { $regex: '', $options: 'i' } },
			{ name: { $regex: '', $options: 'i' } },
			{ surname: { $regex: '', $options: 'i' } },
		],
		$and: [
			{ type: { $ne: 'bot' } },
			{ _id: councilId },
		],
	}),
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, councilId, column, direction]);

const invitedPersonsQuery = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, email: 1, surname: 1, patronymic: 1, phone: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction), surnames: column === 'surname' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction]);

export function CouncilPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const councilId = useRouteParameter('id');
	const routeUrl = useCurrentRoute();

	const [onCreateParticipantId, setOnCreateParticipantId] = useState();
	const [context, setContext] = useState('participants');
	const [invitedUsers, setInvitedUsers] = useState([]);
	const [files, setFiles] = useState([]);
	const [persons, setPersons] = useState([]);
	const [invitedPersons, setInvitedPersons] = useState([]);
	const [cache, setCache] = useState();
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [users, setUsers] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const usersQuery = useQuery(debouncedParams, debouncedSort);
	const personsQuery = invitedPersonsQuery(debouncedParams, debouncedSort);

	const onChange = useCallback(() => { 
		console.log('onChange'); 
		setCache(new Date()); 
	}, [cache] );

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const data = useEndpointData('councils.findOne', query) || {  };
	// const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };
	// const usersData = useEndpointData('users.list', usersQuery) || { users: [] };
	// const invitedUsersData = useEndpointData('councils.invitedUsers', invitedUsersQuery(debouncedParams, debouncedSort, councilId)) || { invitedUsers: [] };
	const workingGroups = { workingGroups: [] };
	const usersData = { users: [] };
	const invitedUsersData = { invitedUsers: [] };
	const invitedPersonsData = useEndpointData('councils.invitedPersons', useMemo(() => ({ query: JSON.stringify({ _id: councilId }) }), [councilId])) || { persons: [] };
	const personsData = useEndpointData('persons.list', personsQuery) || { persons: [] };
	// useMemo(() => ({ query: JSON.stringify({ _id: { $in: data?.invitedPersons?.map((person) => person._id) } }) }

	useEffect(() => {
		// console.log(data);
		if (data.documents) {
			setFiles(data.documents);
		}
		if (personsData.persons) {
			setPersons(personsData.persons);
		}
		if (invitedPersonsData.persons) {
			setInvitedPersons(invitedPersonsData.persons);
		}
	}, [invitedPersonsData, personsData, data]);

	const mode = useMemo(() => routeUrl[0].includes('council-edit') ? 'edit' : 'read', [routeUrl]);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroups && workingGroups.workingGroups?.length > 0) {
			return res.concat(workingGroups.workingGroups.map((workingGroup) => [workingGroup.title, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

	const councilTypeOptions = useMemo(() => {
		const res = [[{ _id: null, title: 'Заседание' }, 'Заседание']];
		return res;
	}, []);

	return <Council mode={mode} persons={persons} filesData={files} invitedPersonsData={invitedPersons} councilId={councilId} data={data} users={users} setUsers={setUsers} onChange={onChange} workingGroupOptions={workingGroupOptions} councilTypeOptions={councilTypeOptions} invitedUsersData={invitedUsers}/>;
}

CouncilPage.displayName = 'CouncilPage';

export default CouncilPage;

function Council({ mode, persons, filesData, invitedPersonsData, councilId, data, users, setUsers, onChange, workingGroupOptions, councilTypeOptions, invitedUsersData }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const { d: previousDate, desc: previousDescription, type: previousCouncilType } = data || {};
	const previousCouncil = data || {};

	const [date, setDate] = useState(new Date(previousDate));
	const [description, setDescription] = useState(previousDescription);
	const [councilType, setCouncilType] = useState(previousCouncilType);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [onCreateParticipantId, setOnCreateParticipantId] = useState();
	const [context, setContext] = useState('participants');
	const [invitedUsersIds, setInvitedUsersIds] = useState([]);
	const [invitedPersonsIds, setInvitedPersonsIds] = useState([]);
	const [attachedFiles, setAttachedFiles] = useState([]);
	const [tab, setTab] = useState('persons');

	useEffect(() => {
		console.log(data);
		if (mode === 'edit') {
			setDate(new Date(previousDate) || '');
			setDescription(previousDescription ?? '');
			setCouncilType(previousCouncilType ?? '');
		}
		if (invitedPersonsData) {
			setInvitedPersonsIds(invitedPersonsData);
		}
		if (filesData) {
			setAttachedFiles(filesData);
		}
	}, [invitedPersonsData, previousDate, previousDescription, previousCouncilType]);

	const inputStyles = useMemo(() => ({ whiteSpace: 'normal', border: mode === 'edit' ? '1px solid #4fb0fc' : '' }), [mode]);

	const invitedPersons = useMemo(() => persons.filter((person) => {
		const iPerson = invitedPersonsIds.find((iPerson) => iPerson._id === person._id);
		if (!iPerson) { return; }

		if (!iPerson.ts) {
			person.ts = new Date('January 1, 2021 00:00:00');
		} else {
			person.ts = iPerson.ts;
		}
		return person;
	}), [invitedPersonsIds, persons]);

	
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

	const handleTabClick = useMemo(() => (tab) => () => setTab(tab), []);

	const setModal = useSetModal();

	const deleteCouncil = useMethod('deleteCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');
	
	const address = settings.get('Site_Url') + 'i/' + data.inviteLink || '';

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

	const fileUpload = async (files) => {
		const validationArray = await filesValidation(files);
		console.log(validationArray);
		if (validationArray.length === 0) {
			await fileUploadToCouncil(files, { _id: councilId });
			setAttachedFiles(attachedFiles ? attachedFiles.concat(files) : files);
			dispatchToastMessage({ type: 'success', message: 'success' });
		} else {
			validationArray.map((val) => dispatchToastMessage({ type: 'error', message: val.fileName + ' ' + val.error }));
		}
	}

	const fileUploadClick = async () => {
		if (!settings.get('FileUpload_Enabled')) {
			console.log('!fileupload_enabled');
			return null;
		}
		const $input = $(document.createElement('input'));
		$input.css('display', 'none');
		$input.attr({
			id: 'fileupload-input',
			type: 'file',
			multiple: 'multiple',
		});

		$(document.body).append($input);

		$input.one('change', async function(e) {
			const filesToUpload = [...e.target.files].map((file) => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				return {
					file,
					name: file.name,
					title: file.name,
				};
			});

			// fileUpload(filesToUpload);
			const validationArray = await filesValidation(filesToUpload);
			console.log(validationArray);
			if (validationArray.length === 0) {
				await fileUploadToCouncil(filesToUpload, { _id: councilId });
				setAttachedFiles(attachedFiles ? attachedFiles.concat(filesToUpload) : filesToUpload);
			} else {
				validationArray.map((val) => dispatchToastMessage({ type: 'error', message: val.error }));
			}

			$input.remove();
			onChange();
		});
		$input.click();

		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
			$input.click();
		}
		onChange();
	};

	const bufFileUploadClick = async () => {
		console.log('here');
		await fileUploadClick();
		if (data.documents.length !== attachedFiles.length) {
			const $input = $(document.createElement('fileupload-input'));
			if ($input) {
				$input.remove();
			}
			dispatchToastMessage({ type: 'success', message: 'success' });
		}
	};

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
	};

	const onCreateParticipantClick = useCallback((user) => () => {
		setOnCreateParticipantId(user._id);
		setContext('onCreateParticipant');
	}, [onCreateParticipantId]);

	const onCreatePersonsClick = useCallback((person) => () => {
		setContext('participants');
		onChange();
	}, [onChange]);

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
				<Button small aria-label={t('download')}>
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
					<Button primary small aria-label={t('Agenda')}>
						{t('Agenda')}
					</Button>
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
						{mode !== 'edit' && <TextInput readOnly is='span' fontScale='p1'>{formatDateAndTime(data.d)}</TextInput>}
						{mode === 'edit' && 
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
								popperClassName='date-picker'/>
						}
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput style={ inputStyles } value={data.desc} onChange={(e) => setDescription(e.currentTarget.value)} row='4' readOnly={mode !== 'edit'} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Council_type')}</Field.Label>
					<Field.Row>
						{mode !== 'edit' && <TextInput readOnly value={councilType ?? t('Council_type_meeting')}/>}
						{mode === 'edit' && 
							<Select style={inputStyles} options={councilTypeOptions} onChange={(val) => setCouncilType(val)} value={councilType} placeholder={t('Number')}/>
						}
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
					<Tabs.Item selected={tab === 'persons'} onClick={handleTabClick('persons')}>{t('Council_Invited_Users')}</Tabs.Item>
					<Tabs.Item selected={tab === 'files'} onClick={handleTabClick('files')}>{t('Files')}</Tabs.Item>
				</Tabs>
				{tab !== 'files' && context === 'participants' && <Field mbe='x8'>
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
						<Button onClick={bufFileUploadClick} mie='10px' small primary aria-label={t('Add')}>
							{t('Upload_file_question')}
						</Button>
					</Field.Row>
				</Field>}
				{tab === 'info' && context === 'participants' && <Participants councilId={councilId} onChange={onChange} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsersIds}/>}
				{tab === 'info' && context === 'addParticipants' && <AddParticipant councilId={councilId} onChange={onChange} close={onClose} users={users} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} onNewParticipant={onParticipantClick}/>}
				{tab === 'info' && context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} workingGroupOptions={workingGroupOptions}/>}
				{tab === 'info' && context === 'onCreateParticipant' && <AddParticipant onCreateParticipantId={onCreateParticipantId} councilId={councilId} onChange={onChange} close={onClose} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} onNewParticipant={onParticipantClick}/>}
				{tab === 'files' && 
					<GenericTable header={header} renderRow={renderRow} results={attachedFiles} total={attachedFiles.length} setParams={setParams} params={params}/>
				}
				{tab === 'persons' && context === 'participants' &&
					<Persons councilId={councilId} onChange={onChange} invitedPersons={invitedPersons} setInvitedPersons={setInvitedPersonsIds}/>
				}
				{tab === 'persons' && context === 'addParticipants' &&
					<AddPerson councilId={councilId} onChange={onChange} close={onClose} persons={persons} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds} onNewParticipant={onParticipantClick}/>
				}
				{tab === 'persons' && context === 'newParticipants' &&
					<CreateParticipant councilId={councilId} goTo={onCreatePersonsClick} close={onClose} onChange={onChange} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds}/>
				}
			</Page.Content>
		</Page>
	</Page>;
}
