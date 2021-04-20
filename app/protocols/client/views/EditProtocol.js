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
import { FlowRouter } from 'meteor/kadira:flow-router';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validateProtocolData, createProtocolData } from './lib';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { settings } from '../../../settings/client';

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
			{t('Protocol_Delete_Warning')}
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
			{t('Protocol_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function EditProtocol({ _id, cache, onChange, ...props }) {
	const query = useMemo(() => ({
		query: JSON.stringify({ _id }),
	}), [_id, cache]);

	const { data, state, error } = useEndpointDataExperimental('protocols.findOne', query);

	if (state === ENDPOINT_STATES.LOADING) {
		return <Box pb='x20'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || !data) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditProtocolWithData protocol={data} onChange={onChange} {...props}/>;
}

function EditProtocolWithData({ close, onChange, protocol, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDate = useFormatDate();
	const isAllowedEdit = hasPermission('manage-protocols', useUserId());

	const { _id, d: previousDate, num: previousNumber, place: previousPlace } = protocol || {};
	const previousProtocol = protocol || {};

	const [date, setDate] = useState(new Date(previousDate));
	const [number, setNumber] = useState(previousNumber);
	const [place, setPlace] = useState(previousPlace);
	const setModal = useSetModal();

	const council = useMemo(() => protocol?.council, [protocol]);

	useEffect(() => {
		setDate(new Date(previousDate) || '');
		setNumber(previousNumber || '');
		setPlace(previousPlace || '');
	}, [previousDate, previousNumber, previousPlace, _id]);

	const deleteProtocol = useMethod('deleteProtocol');
	const insertOrUpdateProtocol = useMethod('insertOrUpdateProtocol');

	const councilUrl = council ? [settings.get('Site_Url'), 'council/', council._id].join('') : '';
	const councilData = useEndpointData('councils.findOne', useMemo(() => ({
		query: JSON.stringify({ _id: council?._id }),
		fields: JSON.stringify({ d: 1, type: 1 }),
	}), [council]));
	const councilTitle = useMemo(() => (councilData?.type?.title ? [councilData.type.title, ' от ', formatDate(councilData.d)].join('') : ''), [councilData, formatDate]);

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const hasUnsavedChanges = useMemo(() => previousDate !== date || previousNumber !== number || previousPlace !== place,
		[date, number, place]);

	const saveAction = useCallback(async (date, number, place) => {
		const protocolData = createProtocolData(date, number, place, previousProtocol);
		const validation = validateProtocolData(protocolData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateProtocol(protocolData);
		}
		validation.forEach((error) => dispatchToastMessage({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }));
	}, [_id, dispatchToastMessage, insertOrUpdateProtocol, date, number, place, previousProtocol, t]);

	const handleSave = useCallback(async () => {
		await saveAction(date, number, place);
		onChange();
	}, [saveAction, onChange]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteProtocol(_id);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [_id, close, deleteProtocol, dispatchToastMessage, onChange]);

	const openConfirmDelete = () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const goToCouncil = (councilId) => () => {
		FlowRouter.go(`/council/${ councilId }`);
	};

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Protocol_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Protocol_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Protocol_Date')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy'
					selected={date}
					onChange={(newDate) => setDate(newDate)}
					customInput={<TextInput />}
					locale='ru'
				/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Protocol_Place')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={place} onChange={(e) => setPlace(e.currentTarget.value)} placeholder={t('Protocol_Place')} />
			</Field.Row>
		</Field>
		{ councilData && <Field>
			<Field.Label>{t('Council')}</Field.Label>
			<Field.Row>
				<a href={councilUrl}>{councilTitle}</a>
			</Field.Row>
		</Field>}
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					{ isAllowedEdit && <Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>}
				</ButtonGroup>
			</Field.Row>
		</Field>
		{/*<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button primary danger onClick={openConfirmDelete}><Icon name='trash' mie='x4'/>{t('Delete')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>*/}
	</VerticalBar.ScrollableContent>;
}
