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
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validateSectionData, createSectionData } from './lib';
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
			{t('Section_Delete_Warning')}
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
			{t('Section_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditSection({ protocolId, _id, cache, onChange, ...props }) {
	const query = useMemo(() => ({
		query: JSON.stringify({ _id: protocolId }),
	}), [protocolId, _id, cache]);

	const { data, state, error } = useEndpointDataExperimental('protocols.findOne', query);

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

	if (error || !data) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditSectionWithData protocol={data} sectionId={_id} onChange={onChange} {...props}/>;
}

function EditSectionWithData({ close, onChange, protocol, sectionId, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const section = protocol.sections.find(s => s._id === sectionId);

	const { _id, num: previousNumber, name: previousName } = section || {};
	const previousSection = section || {};

	const [number, setNumber] = useState('');
	const [name, setName] = useState('');
	const setModal = useSetModal();

	useEffect(() => {
		setNumber(previousNumber || '');
		setName(previousName || '');
	}, [previousNumber, previousName, _id]);

	const deleteSection = useMethod('deleteSection');
	const insertOrUpdateSection = useMethod('insertOrUpdateSection');

	const hasUnsavedChanges = useMemo(() => previousNumber !== number || previousName !== name,
		[number, name]);

	const saveAction = useCallback(async (number, name) => {
		const sectionData = createSectionData(number, name, { previousNumber, previousName, _id });
		const validation = validateSectionData(sectionData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateSection(protocol._id, sectionData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateSection, number, name, previousNumber, previousName, previousSection, t]);

	const handleSave = useCallback(async () => {
		saveAction(number, name);
		onChange();
	}, [saveAction, onChange]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteSection(protocol._id, _id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteSection, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Section_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Section_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Section_Name')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Section_Name')} />
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
