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
	Modal
} from '@rocket.chat/fuselage';
import moment from 'moment';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validate, createWorkingGroupMeetingData } from './lib';
import { useSetModal } from '../../../../client/contexts/ModalContext';
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
			{t('Working_group_meeting_delete_warning')}
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
			{t('Working_group_meeting_has_been_deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditWorkingGroupMeeting({ _id, cache, onChange, ...props }) {
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
	}), [_id, cache]);

	const { data, state, error } = useEndpointDataExperimental('working-group-meetings.list', query);


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

	if (error || !data || data.workingGroupMeetings.length < 1) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditWorkingGroupMeetingWithData workingGroupMeeting={data.workingGroupMeetings[0]} onChange={onChange} {...props}/>;
}

function EditWorkingGroupMeetingWithData({ close, onChange, workingGroupMeeting, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		_id,
		d: previousDate,
		desc: previousDescription,
	} = workingGroupMeeting || {};
	const previousWorkingGroupMeeting = workingGroupMeeting || {};

	const [date, setDate] = useState(new Date(previousDate));
	const [desccription, setDescription] = useState(previousDescription);

	const setModal = useSetModal();

	useEffect(() => {
		setDate(new Date(previousDate) || '');
		setDescription(previousDescription || '');
	}, [
		previousDate,
		previousDescription,
		previousWorkingGroupMeeting,
		_id]);

	const deleteWorkingGroupMeeting = useMethod('deleteWorkingGroupMeeting');
	const insertOrUpdateWorkingGroupMeeting = useMethod('insertOrUpdateWorkingGroupMeeting');

	const hasUnsavedChanges = useMemo(() =>
		previousDate !== date
		|| previousDescription !== desccription,
		[date, desccription]);

	const saveAction = useCallback(async (date, description) => {
		const workingGroupMeetingData = createWorkingGroupMeetingData(
			date,
			description,
			{
				previousDate,
				previousDescription,
				_id });
		const validation = validate(workingGroupMeetingData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateWorkingGroupMeeting(workingGroupMeetingData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [
		_id,
		dispatchToastMessage,
		insertOrUpdateWorkingGroupMeeting,
		date,
		desccription,
		previousDate,
		previousDescription,
		previousWorkingGroupMeeting,
	]);

	const handleSave = useCallback(async () => {
		saveAction(
			date,
			desccription,
		);
		onChange();
	}, [saveAction, onChange]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteWorkingGroupMeeting(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteWorkingGroupMeeting, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Date')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy HH:mm'
					selected={date}
					onChange={(newDate) => setDate(newDate)}
					showTimeSelect
					timeFormat='HH:mm'
					timeIntervals={5}
					timeCaption='Время'
					customInput={<TextInput />}
					locale='ru'
				/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={desccription} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
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
	</VerticalBar.ScrollableContent>;
}
