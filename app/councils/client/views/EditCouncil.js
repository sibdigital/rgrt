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
import DatePicker from 'react-datepicker';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { Modal } from '../../../../client/components/basic/Modal';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validate, createCouncilData } from './lib';
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
			{t('Council_Delete_Warning')}
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
			{t('Council_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditCouncil({ _id, cache, onChange, ...props }) {
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
	}), [_id, cache]);

	const { data, state, error } = useEndpointDataExperimental('councils.list', query);

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

	if (error || !data || data.councils.length < 1) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditCouncilWithData council={data.councils[0]} onChange={onChange} {...props}/>;
}

function EditCouncilWithData({ close, onChange, council, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { _id, d: previousDate, desc: previousDescription } = council || {};
	const previousCouncil = council || {};

	const [date, setDate] = useState(new Date(previousDate));
	const [description, setDescription] = useState(previousDescription);
	const [modal, setModal] = useState();

	useEffect(() => {
		setDate(new Date(previousDate) || '');
		setDescription(previousDescription || '');
	}, [previousDate, previousDescription, previousCouncil, _id]);

	const deleteCouncil = useMethod('deleteCouncil');
	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');

	const hasUnsavedChanges = useMemo(() => previousDate !== date || previousDescription !== description,
		[date, description]);

	const saveAction = async (date, description) => {
		const councilData = createCouncilData(date, description, { previousDate, previousDescription, _id });
		const validation = validate(councilData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateCouncil(councilData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	};

	const handleSave = useCallback(async () => {
		await saveAction(date, description);
		onChange();
	}, [date, description, _id]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteCouncil(_id);
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
				<Field.Label>{t('Date')}</Field.Label>
				<Field.Row>
					<DatePicker
						dateFormat='dd.MM.yyyy HH:mm'
						selected={date}
						onChange={(newDate) => setDate(newDate)}
						showTimeSelect
						timeFormat='HH:mm'
						timeIntervals={5}
						timeCaption='time'
						customInput={<TextInput />}
					/>
					{/* <InputBox type='date' value={date} onChange={(e) => setDate(e.currentTarget.value)} placeholder={t('Date')} />*/}
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextAreaInput value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
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
