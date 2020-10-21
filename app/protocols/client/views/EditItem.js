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
import { validateItemData, createItemData } from './lib';
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
			{t('Item_Delete_Warning')}
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
			{t('Item_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditItem({ protocolId, sectionId, _id, cache, onChange, ...props }) {
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

	return <EditItemWithData protocol={data} sectionId={sectionId} itemId={_id} onChange={onChange} {...props}/>;
}

function EditItemWithData({ close, onChange, protocol, sectionId, itemId, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const item = protocol.sections.find(s => s._id === sectionId).items.find(i => i._id === itemId);

	const { _id, num: previousNumber, name: previousName, responsible: previousResponsible, expireAt: previousExpireAt } = item || {};
	const previousItem = item || {};

	const [number, setNumber] = useState('');
	const [name, setName] = useState('');
	const [responsible, setResponsible] = useState('');
	const [expireAt, setExpireAt] = useState('');
	const setModal = useSetModal();

	useEffect(() => {
		setNumber(previousNumber || '');
		setName(previousName || '');
		setResponsible(previousResponsible || '');
		setExpireAt(previousExpireAt ? new Date(previousExpireAt) : '');
	}, [previousNumber, previousName, previousResponsible, previousExpireAt, _id]);

	const deleteItem = useMethod('deleteItem');
	const insertOrUpdateItem = useMethod('insertOrUpdateItem');

	const hasUnsavedChanges = useMemo(() => previousNumber !== number || previousName !== name || previousResponsible !== responsible || previousExpireAt !== expireAt,
		[number, name, responsible, expireAt]);

	const saveAction = useCallback(async (number, name, responsible, expireAt) => {
		const itemData = createItemData(number, name, responsible, expireAt, { previousNumber, previousName, _id });
		const validation = validateItemData(itemData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateItem(protocol._id, sectionId, itemData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateItem, number, name, responsible, expireAt, previousNumber, previousName, previousResponsible, previousExpireAt, previousItem, t]);

	const handleSave = useCallback(async () => {
		saveAction(number, name, responsible, expireAt);
		onChange();
	}, [saveAction, onChange]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteItem(protocol._id, sectionId, _id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteItem, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Item_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => setNumber(e.currentTarget.value)} placeholder={t('Item_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Item_Name')}</Field.Label>
			<Field.Row>
				<TextAreaInput rows='10' multiple value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Item_name')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Item_Responsible')}</Field.Label>
			<Field.Row>
				<TextInput value={responsible} onChange={(e) => setResponsible(e.currentTarget.value)} placeholder={t('Item_Responsible')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Item_ExpireAt')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy'
					selected={expireAt}
					onChange={(newDate) => setExpireAt(newDate)}
					customInput={<TextInput />}
					locale='ru'
				/>
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
