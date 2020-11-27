import React, { useCallback, useMemo, useState } from 'react';
import { ButtonGroup, Button, Field, Icon, Label, TextInput, TextAreaInput, Modal } from '@rocket.chat/fuselage';
import moment from 'moment';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
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

export function CouncilPage() {
	console.log('council');
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const councilId = useRouteParameter('id');

	const [onCreateParticipantId, setOnCreateParticipantId] = useState();
	const [context, setContext] = useState('participants');
	const [cache, setCache] = useState();
	const [users, setUsers] = useState([]);

	const onChange = () => { console.log('onChange'); setCache(new Date()); };

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);

	const data = useEndpointData('councils.findOne', query) || { result: [] };
	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };

	const invitedUsers = data.invitedUsers || [];

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

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroups && workingGroups.workingGroups?.length > 0) {
			return res.concat(workingGroups.workingGroups.map((workingGroup) => [workingGroup.title, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

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
				{context === 'participants' && <Field mbe='x8'>
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
				{context === 'participants' && <Participants councilId={councilId} onChange={onChange}/>}
				{context === 'addParticipants' && <AddParticipant councilId={councilId} onChange={onChange} close={onClose} users={users} invitedUsers={invitedUsers} onNewParticipant={onParticipantClick}/>}
				{context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} workingGroupOptions={workingGroupOptions}/>}
				{context === 'onCreateParticipant' && <AddParticipant onCreateParticipantId={onCreateParticipantId} councilId={councilId} onChange={onChange} close={onClose} invitedUsers={invitedUsers} onNewParticipant={onParticipantClick}/>}
			</Page.Content>
		</Page>
	</Page>;
}

CouncilPage.displayName = 'CouncilPage';

export default CouncilPage;
