import React, { useCallback, useMemo } from 'react';
import { Button, ButtonGroup, Icon, Modal, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useSetModal } from '../../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Working_group_delete_warning')}
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
			{t('Working_group_has_been_deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function WorkingGroupCompositions({
	data,
	sort,
	onEditClick,
	onHeaderClick,
	setParams,
	onChange,
	params,
}) {
	const t = useTranslation();

	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const deleteWorkingGroupComposition = useMethod('deleteWorkingGroupComposition');

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const onDeleteConfirm = useCallback(async (_id) => {
		try {
			await deleteWorkingGroupComposition(_id);
			setModal(() => <SuccessModal title={'Delete'} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteWorkingGroupComposition, dispatchToastMessage, onChange]);

	const onDel = (_id) => () => { onDeleteConfirm(_id); };

	const onDeleteClick = (_id) => () => setModal(() => <DeleteWarningModal title={t('Council_Delete_Warning')} onDelete={onDel(_id)} onCancel={() => setModal(undefined)}/>);

	const header = useMemo(() => [
		mediaQuery && <Th key={'Working_group_type'} color='default'>
			{t('Working_group_type')}
		</Th>,
		<Th w='x40' key='edit'></Th>,
		<Th w='x40' key='delete'></Th>,
	], [sort, mediaQuery]);

	const renderRow = (WorkingGroupComposition) => {
		const { _id, title } = WorkingGroupComposition;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{title}</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteClick(_id)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data} total={data.length} setParams={setParams} params={params} />;
}
