import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	ButtonGroup,
	Button,
	Field,
	Icon,
	Label,
	TextInput,
	TextAreaInput,
	Modal,
	Tabs,
	Table,
	Select,
	Box, Margins, Chip, Callout,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import ReactTooltip from 'react-tooltip';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useRouteParameter, useCurrentRoute } from '../../../../client/contexts/RouterContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { hasPermission } from '../../../authorization';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { settings } from '../../../settings/client';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { fileUploadToCouncil, filesValidation } from '../../../ui/client/lib/fileUpload';
import { mime } from '../../../utils/lib/mimeTypes';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { SuccessModal, WarningModal } from '../../../utils/client/index';
import { Persons } from './Participants/Participants';
import { AddPerson } from './Participants/AddParticipant';
import { CreateParticipant } from './Participants/CreateParticipant';
import { createCouncilData, validate, downloadCouncilParticipantsForm } from './lib';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const invitedPersonsQuery = ({ itemsPerPage, current }, [column, direction], isAllow) => useMemo(() => ({
	isAllow,
	fields: JSON.stringify({ name: 1, email: 1, surname: 1, patronymic: 1, phone: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction), surnames: column === 'surname' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction]);

export function CouncilPage() {
	const t = useTranslation();
	const councilId = useRouteParameter('id');
	const routeUrl = useCurrentRoute();
	const userId = Meteor.userId();
	const isAllow = hasPermission('edit-councils', userId);

	const [files, setFiles] = useState([]);
	const [persons, setPersons] = useState([]);
	const [invitedPersons, setInvitedPersons] = useState([]);
	const [cache, setCache] = useState();
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const personsQuery = invitedPersonsQuery(debouncedParams, debouncedSort, isAllow);

	const onChange = useCallback(() => {
		console.log('onChange');
		setCache(new Date());
	}, [cache]);

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);


	const { data, state } = useEndpointDataExperimental('councils.findOne', query) || {};
	const { data: invitedPersonsData, state: invitedPersonsDataState } = useEndpointDataExperimental('councils.invitedPersons', useMemo(() => ({ query: JSON.stringify({ _id: councilId }) }), [councilId])) || { persons: [] };
	const { data: personsData, state: personsDataState } = useEndpointDataExperimental('persons.list', personsQuery) || { persons: [] };
	const { data: currentUser, state: currentUserState } = useEndpointDataExperimental('users.getRoles', useMemo(() => ({ query: JSON.stringify({ _id: userId }) }), [userId]));
	const { data: currentPerson, state: currentPersonState } = useEndpointDataExperimental('users.getPerson', useMemo(() => ({ query: JSON.stringify({ userId }) }), [userId]));
	const { data: protocolData, state: protocolsDataState } = useEndpointDataExperimental('protocols.findByCouncilId', query);
	const { data: workingGroupData, state: workingGroupState } = useEndpointDataExperimental('working-groups.list',
		useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), []));

	useEffect(() => {
		if (data && data.documents) {
			setFiles(data.documents);
		}
		if (personsData && personsData.persons) {
			setPersons(personsData.persons);
		}
		if (invitedPersonsData && invitedPersonsData.persons) {
			setInvitedPersons(invitedPersonsData.persons);
		}
	}, [invitedPersonsData, personsData, data]);

	const mode = useMemo(() => routeUrl[0].includes('council-edit') ? 'edit' : 'read', [routeUrl]);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroupData && workingGroupData.workingGroups?.length > 0) {
			return res.concat(workingGroupData.workingGroups.map((workingGroup) => [workingGroup._id, workingGroup.title]));
		}
		return res;
	}, [workingGroupData]);

	const councilTypeOptions = useMemo(() => [
		[t('Council_type_meeting'), t('Council_type_meeting')],
		[t('Council_type_conference'), t('Council_type_conference')],
	], [t]);

	let isLoading = true;
	if ([state, invitedPersonsDataState, personsDataState, currentUserState, currentPersonState, protocolsDataState, workingGroupState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
	} else {
		isLoading = false;
	}

	if (mode === 'edit' && !isAllow) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <Council isLoading={isLoading} mode={mode} persons={persons} setPersons={setPersons} filesData={files} invitedPersonsData={invitedPersons} currentPerson={currentPerson} councilId={councilId} data={data} userRoles={currentUser?.roles ?? []} onChange={onChange} workingGroupOptions={workingGroupOptions} councilTypeOptions={councilTypeOptions} protocolData={protocolData}/>;
}

CouncilPage.displayName = 'CouncilPage';

export default CouncilPage;

// eslint-disable-next-line complexity
function Council({
	isLoading = true,
	mode,
	persons,
	setPersons,
	filesData,
	invitedPersonsData,
	currentPerson,
	councilId,
	data,
	userRoles,
	onChange,
	councilTypeOptions,
	protocolData,
	workingGroupOptions,
}) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const [date, setDate] = useState(new Date());
	const [description, setDescription] = useState('');
	const [councilType, setCouncilType] = useState('');
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [context, setContext] = useState('participants');
	const [invitedPersonsIds, setInvitedPersonsIds] = useState([]);
	const [attachedFiles, setAttachedFiles] = useState([]);
	const [currentUploadedFiles, setCurrentUploadedFiles] = useState([]);
	const [tab, setTab] = useState('files');
	const [staticFileIndex, setStaticFileIndex] = useState(0);
	const [isSecretary, setIsSecretary] = useState(false);
	const [isUserJoin, setIsUserJoin] = useState(false);

	useEffect(() => {
		if (isLoading) { return; }
		if (userRoles.includes('secretary') || userRoles.includes('admin')) {
			setIsSecretary(true);
			setTab('persons');
		}
		if (currentPerson && data?.invitedPersons?.findIndex((person) => person._id === currentPerson._id) > -1) {
			setIsUserJoin(true);
		}
		if (data) {
			setDate(new Date(data.d));
			setDescription(data.desc);
			setCouncilType(data.type?.title ?? '');
		}
		if (invitedPersonsData) {
			setInvitedPersonsIds(invitedPersonsData);
		}
		if (filesData) {
			setAttachedFiles(filesData);
		}
	}, [invitedPersonsData, filesData, userRoles, data, currentPerson, isLoading]);

	const setModal = useSetModal();

	const deleteFileFromCouncil = useMethod('deleteFileFromCouncil');

	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');
	const deleteCouncil = useMethod('deleteCouncil');
	const deleteCouncilFromPersons = useMethod('deleteCouncilFromPersons');

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');

	const addPersonsToCouncil = useMethod('addPersonsToCouncil');
	const addCouncilToPersons = useMethod('addCouncilToPersons');
	const deletePersonFromCouncil = useMethod('deletePersonFromCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	const address = [settings.get('Site_Url'), 'i/', data?.inviteLink || ''].join('');

	const inputStyles = useMemo(() => ({ whiteSpace: 'normal', border: mode === 'edit' ? '1px solid #4fb0fc' : '' }), [mode]);

	const invitedPersons = useMemo(() => persons?.filter((person) => {
		const iPerson = invitedPersonsIds.find((iPerson) => iPerson._id === person._id);
		if (!iPerson) { return; }

		if (!iPerson.ts) {
			person.ts = new Date('January 1, 2021 00:00:00');
		} else {
			person.ts = iPerson.ts;
		}
		return person;
	}) || [], [invitedPersonsIds, persons]);

	const goToCouncils = () => {
		FlowRouter.go('councils');
	};

	const goToAgenda = () => {
		// window.open([settings.get('Site_Url'), 'agenda/council/', councilId].join(''), '_blank');
		FlowRouter.go(`/agenda/council/${ councilId }`);
	};

	const goToProposalsForTheAgenda = () => {
		window.open([settings.get('Site_Url'), 'proposals_for_the_agenda/council/', councilId].join(''), '_blank');
	};

	const onEdit = (_id) => () => {
		FlowRouter.go(`/council/edit/${ _id }`);
		FlowRouter.reload();
	};

	const saveCouncilAction = useCallback(async (date, description, councilType, invitedPersons) => {
		const councilData = createCouncilData(date, description, councilType, invitedPersons, { _id: councilId });
		const validation = validate(councilData);
		if (validation.length === 0) {
			await insertOrUpdateCouncil(councilData);
			FlowRouter.go(`/council/${ councilId }`);
			FlowRouter.reload();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [councilId, dispatchToastMessage, insertOrUpdateCouncil, date, description, t]);

	const handleSaveCouncil = useCallback(async () => {
		try {
			await saveCouncilAction(date, description, {
				_id: '',
				title: councilType,
			}, invitedPersonsIds);
			dispatchToastMessage({ type: 'success', message: t('Council_edited') });
		} catch (error) {
			console.log(error);
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onChange();
		}
	}, [date, description, councilType, saveCouncilAction, onChange]);

	const handleFileUploadChipClick = (index) => () => {
		setCurrentUploadedFiles(currentUploadedFiles.filter((file, _index) => _index !== index));
	};

	const hasUnsavedChanges = useMemo(() => isLoading ? false : new Date(data.d).getTime() !== new Date(date).getTime() || data.desc !== description || (!data.type && councilType !== '') || (data.type && data.type.title !== councilType),
		[date, description, councilType, data]);

	const handleTabClick = useMemo(() => (tab) => () => setTab(tab), []);

	const downloadCouncilParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadCouncilParticipantsMethod({ _id, dateString: formatDateAndTime(data.d) });
			const fileName = [data.type?.title ?? '', ' ', moment(new Date(data.d)).format('DD MMMM YYYY'), '.docx'].join('');
			if (res) {
				downloadCouncilParticipantsForm({ res, fileName });
			}
		} catch (e) {
			console.error('[council.js].downloadCouncilParticipants :', e);
		}
	};

	const onDownloadFileClick = (file) => async (e) => {
		e.preventDefault();
		try {
			const filename = `${ file.title }`;
			if (window.navigator && window.navigator.msSaveOrOpenBlob) {
				console.log('window navigator');
				const blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(file)))], { type: file.type });
				return navigator.msSaveOrOpenBlob(blob, filename);
			}
			const aElement = document.createElement('a');
			aElement.download = filename;
			aElement.href = `${ file.title_link }`;
			aElement.target = '_blank';
			document.body.appendChild(aElement);
			aElement.click();
			document.body.removeChild(aElement);
		} catch (e) {
			console.error('[index.js].downloadWorkingGroupRequestAnswerFile: ', e);
		}
	};

	const fileUploadClick = async () => {
		if (!settings.get('FileUpload_Enabled')) {
			console.log('!fileupload_enabled');
			return null;
		}
		setContext('uploadFiles');
		let fileIndex = staticFileIndex;
		const $input = $(document.createElement('input'));
		$input.css('display', 'none');
		$input.attr({
			id: 'fileupload-input',
			type: 'file',
			multiple: 'multiple',
		});

		$(document.body).append($input);

		$input.one('change', function(e) {
			const filesToUpload = [...e.target.files].map((file) => {
				Object.defineProperty(file, 'type', {
					value: mime.lookup(file.name),
				});
				fileIndex++;
				return {
					file,
					name: file.name,
					title: file.name,
					id: fileIndex,
					ts: new Date(),
				};
			});
			setStaticFileIndex(fileIndex);
			setCurrentUploadedFiles(currentUploadedFiles ? currentUploadedFiles.concat(filesToUpload) : filesToUpload);

			$input.remove();
			onChange();
		});
		$input.click();

		if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
			$input.click();
		}
		onChange();
	};

	const fileUpload = async () => {
		let validationArray = [];
		console.log(currentUploadedFiles);
		if (currentUploadedFiles.length > 0) {
			validationArray = await filesValidation(currentUploadedFiles);
			if (validationArray.length > 0) {
				const attachedFilesBuf = currentUploadedFiles;
				validationArray.map((errFile) => attachedFilesBuf.map((file) => {
					if (errFile.id === file.id) {
						file.fail = true;
						file.error = errFile.error;
					}
					return file;
				}));
				dispatchToastMessage({ type: 'error', message: t('Working_group_request_invite_file_upload_failed') });
				setAttachedFiles(attachedFilesBuf);
				onChange();
			} else {
				await fileUploadToCouncil(currentUploadedFiles, { _id: councilId });
				setAttachedFiles(attachedFiles ? attachedFiles.concat(currentUploadedFiles) : currentUploadedFiles);
				setCurrentUploadedFiles([]);
				dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
			}
		}
	};

	const joinToCouncil = async () => {
		try {
			console.log('join');
			if (!isUserJoin) {
				await addCouncilToPersons(councilId, [currentPerson]);
				await addPersonsToCouncil(councilId, [{ _id: currentPerson._id, ts: new Date() }]);
				setIsUserJoin(true);
				dispatchToastMessage({ type: 'success', message: t('Council_joined') });
			} else {
				await deletePersonFromCouncil(councilId, currentPerson._id);
				setIsUserJoin(false);
				dispatchToastMessage({ type: 'success', message: t('Council_declined_participation') });
			}
		} catch (error) {
			console.log(error);
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const resetData = () => {
		window.history.back();
		// setDate(new Date(data.d));
		// setDescription(data.desc);
		// setCouncilType(data.type ?? '');
		// onChange();
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

	const onCreatePersonsClick = useCallback((person) => () => {
		console.log('here');
		// const res = invitedPersons ? invitedPersons.concat(person) : [person];
		setPersons(persons ? persons.concat(person) : [person]);
		// setInvitedPersonsIds(res);
		setContext('participants');
		onChange();
	}, [invitedPersons, persons, setPersons, onChange]);

	const onDeleteCouncilConfirm = useCallback(async () => {
		try {
			await deleteCouncil(councilId);
			await deleteCouncilFromPersons(councilId, invitedPersonsIds);
			setModal(() => <SuccessModal title={t('Deleted')} contentText={t('Delete')} onClose={() => { setModal(undefined); }}/>);
			goToCouncils();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteCouncil, deleteCouncilFromPersons, invitedPersonsIds, dispatchToastMessage]);

	const onDeleteCouncilClick = () => setModal(() => <WarningModal title={t('Are_you_sure')} contentText={t('Council_Delete_Warning')} onDelete={onDeleteCouncilConfirm} onCancel={() => setModal(undefined)}/>);

	const onFileDeleteConfirm = async (fileId) => {
		console.log(fileId);
		try {
			await deleteFileFromCouncil(councilId, fileId);
			setAttachedFiles(attachedFiles.filter((file) => file._id !== fileId));
			setModal(() => <SuccessModal title={t('Deleted')} contentText={t('File_has_been_deleted')} onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	};

	const openFileDeleteConfirm = (fileId) => setModal(() => <WarningModal title={t('Are_you_sure')} onDelete={() => onFileDeleteConfirm(fileId) } onCancel={() => setModal(undefined)}/>);

	const onDeleteFileConfirmDel = (fileId) => async (e) => {
		e.preventDefault();
		try {
			openFileDeleteConfirm(fileId);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const onOpenCouncilProtocol = (protocolData, councilId) => () => {
		if (protocolData.protocol.length !== 0) {
			const protocolId = protocolData.protocol[0]._id;
			FlowRouter.go(`/protocol/${ protocolId }`);
		} else {
			FlowRouter.go(`/protocols/new-council-protocol/${ councilId }`);
		}
	};

	const header = useMemo(() => [
		<Th key={'File_name'} color='default'>
			{ t('File_name') }
		</Th>,
		<Th w='x200' key={'File_uploaded_uploadedAt'} color='default'>
			{ t('File_uploaded_uploadedAt') }
		</Th>,
		<Th w='x40' key='download'/>,
		isSecretary && <Th w='x40' key='delete'/>,
	], [mediaQuery, isSecretary]);

	const renderRow = (document) => {
		const { _id, title, ts } = document;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{title}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDateAndTime(ts ?? new Date())}</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small aria-label={t('download')} onClick={onDownloadFileClick(document)}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
			{isSecretary && <Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteFileConfirmDel(document._id)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Council')} {isLoading && t('Loading')}</Label>

				</Field>
				{ mode !== 'edit' && <ButtonGroup>
					{isSecretary && <Button disabled={isLoading} primary small aria-label={t('Edit')} onClick={onEdit(councilId)}>
						{t('Edit')}
					</Button>}
					{isSecretary && <Button disabled={isLoading} primary danger small aria-label={t('Delete')} onClick={onDeleteCouncilClick}>
						{t('Delete')}
					</Button>}
					{isSecretary && <Button primary small aria-label={t('Agenda')} onClick={goToAgenda}>
						{t('Agenda')}
					</Button>}
					{!isSecretary && <Button primary small aria-label={t('Proposals_for_the_agenda')} onClick={goToProposalsForTheAgenda}>
						{t('Proposals_for_the_agenda')}
					</Button>}
					{!isSecretary && <Button disabled={isLoading} danger={isUserJoin} small primary aria-label={t('Council_join')} onClick={joinToCouncil}>
						{isUserJoin ? t('Council_decline_participation') : t('Council_join')}
					</Button>}
					{isSecretary && <Button disabled={isLoading} primary small aria-label={t('Protocol')} onClick={onOpenCouncilProtocol(protocolData, councilId)}>
						{t('Protocol')}
					</Button>}
				</ButtonGroup>}
				{ mode === 'edit' && <ButtonGroup>
					<Button disabled={isLoading} primary danger small aria-label={t('Delete')} onClick={onDeleteCouncilClick}>
						{t('Delete')}
					</Button>
					<Button primary small aria-label={t('Cancel')} disabled={isLoading} onClick={resetData}>
						{t('Cancel')}
					</Button>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges || isLoading} onClick={handleSaveCouncil}>
						{t('Save')}
					</Button>
					{/*<Button primary small aria-label={t('Agenda')} onClick={goToAgenda}>*/}
					{/*	{t('Agenda')}*/}
					{/*</Button>*/}
					{/*<Button disabled={isLoading} primary small aria-label={t('Protocol')} onClick={onOpenCouncilProtocol(protocolData, councilId)}>*/}
					{/*	{t('Protocol')}*/}
					{/*</Button>*/}
				</ButtonGroup>}
			</Page.Header>
			<Page.Content>
				<Field mbe='x8' display='flex' flexDirection='row'>
					<Field mis='x4' >
						<Field.Label>{t('Council_type')}</Field.Label>
						<Field.Row>
							{mode !== 'edit'
							&& <TextInput readOnly value={councilType ?? t('Council_type_meeting')}/>}
							{mode === 'edit'
							&& <Select style={inputStyles} options={councilTypeOptions} onChange={(val) => setCouncilType(val)} value={councilType} placeholder={t('Council_type')}/>
							}
						</Field.Row>
					</Field>
					<Field mis='x4'>
						<Field.Label>{t('Date')}</Field.Label>
						<Field.Row>
							{mode !== 'edit' && <TextInput readOnly is='span' fontScale='p1'>{formatDateAndTime(data?.d ?? new Date())}</TextInput>}
							{mode === 'edit'
								&& <DatePicker
									dateFormat='dd.MM.yyyy HH:mm'
									selected={date}
									onChange={(newDate) => setDate(newDate)}
									showTimeSelect
									timeFormat='HH:mm'
									timeIntervals={5}
									timeCaption='Время'
									customInput={<TextInput style={ inputStyles } />}
									locale='ru'
									popperClassName='date-picker'/>
							}
						</Field.Row>
					</Field>
				</Field>
				<Field mbe='x8' mis='x4'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput style={ inputStyles } value={description} onChange={(e) => setDescription(e.currentTarget.value)} row='4' readOnly={mode !== 'edit'} fontScale='p1'/>
					</Field.Row>
				</Field>
				{isSecretary && <Field mbe='x8'>
					<Field.Label>{t('Council_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' target='_blank'>{address}</a>
					</Field.Row>
				</Field>}
				<Tabs flexShrink={0} mbe='x8'>
					{isSecretary && <Tabs.Item selected={tab === 'persons'} onClick={handleTabClick('persons')}>{t('Council_Invited_Users')}</Tabs.Item>}
					<Tabs.Item selected={tab === 'files'} onClick={handleTabClick('files')}>{t('Files')}</Tabs.Item>
				</Tabs>
				{tab !== 'files' && context === 'participants' && isSecretary
				&& <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button disabled={isLoading} marginInlineEnd='10px' small primary onClick={onAddParticipantClick(councilId)} aria-label={t('Add')}>
							{t('Council_Add_Participant')}
						</Button>
						<Button disabled={isLoading} marginInlineEnd='10px' small primary onClick={onEmailSendClick(councilId)} aria-label={t('Send_email')}>
							{t('Send_email')}
						</Button>
						<Button disabled={isLoading} small primary onClick={downloadCouncilParticipants(councilId)} aria-label={t('Download')}>
							{t('Download_Council_Participant_List')}
						</Button>
					</Field.Row>
				</Field>}
				{tab === 'files' && isSecretary && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button disabled={isLoading} onClick={fileUploadClick} mie='10px' small primary aria-label={t('Upload_file')}>
							{t('Upload_file')}
						</Button>
					</Field.Row>
				</Field>}
				{tab === 'persons' && context === 'participants' && isSecretary
					&& <Persons councilId={councilId} onChange={onChange} invitedPersons={invitedPersons} setInvitedPersons={setInvitedPersonsIds}/>
				}
				{tab === 'persons' && context === 'addParticipants' && isSecretary
					&& <AddPerson councilId={councilId} onChange={onChange} close={onClose} persons={persons} invitedPersons={invitedPersons} setInvitedPersons={setInvitedPersonsIds} onNewParticipant={onParticipantClick}/>
				}
				{tab === 'persons' && context === 'newParticipants' && isSecretary
					&& <CreateParticipant workingGroupOptions={workingGroupOptions} councilId={councilId} goTo={onCreatePersonsClick} close={onClose} onChange={onChange} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds}/>
				}
				{tab === 'files' && context === 'uploadFiles' && currentUploadedFiles?.length > 0
					&& <Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='flex-start' mbs='x4'>
						<Margins inlineEnd='x4' blockEnd='x4'>
							{currentUploadedFiles.map((file, index) =>
								<Chip pi='x4' key={index} onClick={handleFileUploadChipClick(index)} border={file.fail ? '2px solid red' : ''} data-for='fileErrorTooltip' data-tip={ file.error ?? '' } style={{ whiteSpace: 'normal' }}>
									{file.name ?? ''}
									<ReactTooltip id='fileErrorTooltip' effect='solid' place='top'/>
								</Chip>)}
						</Margins>
					</Box>
				}
				{tab === 'files' && context === 'uploadFiles' && currentUploadedFiles?.length > 0
					&& <Field mbe='x8'>
						<Field.Row>
							<Button onClick={fileUpload} mie='10px' small primary aria-label={t('Click_to_load')}>
								{t('Click_to_load')}
							</Button>
							<Field.Label>{t('Number_of_files')} {currentUploadedFiles?.length ?? 0}</Field.Label>
						</Field.Row>
					</Field>
				}
				{tab === 'files'
					&& <GenericTable header={header} renderRow={renderRow} results={attachedFiles} total={attachedFiles.length} setParams={setParams} params={params}/>
				}
			</Page.Content>
		</Page>
	</Page>;
}
