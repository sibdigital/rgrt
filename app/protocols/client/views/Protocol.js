import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Field, Icon, Label, Modal } from '@rocket.chat/fuselage';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { Sections } from './Sections';
import { AddSection } from './AddSection';
import { AddItem } from './AddItem';
import { EditSection } from './EditSection';
import { EditItem } from './EditItem';
import { Participants } from './participants/Participants';
import { AddParticipant } from './participants/AddParticipant';
import { CreateParticipant } from './participants/CreateParticipant';
import { popover } from '../../../ui-utils/client/lib/popover';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { EditProtocol } from '../../../protocols/client/views/EditProtocol';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';

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

export function ProtocolPage() {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDate = useFormatDate();
	const isAllowedEdit = hasPermission('manage-protocols', useUserId());

	const [cache, setCache] = useState();
	const setModal = useSetModal();

	const router = useRoute('protocol');
	const protocolId = useRouteParameter('id');
	const context = useRouteParameter('context');
	const sectionId = useRouteParameter('sectionId');
	const itemId = useRouteParameter('itemId');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: protocolId }),
	}), [protocolId, cache]);

	const data = useEndpointData('protocols.findOne', query) || {};
	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };

	const title = t('Protocol').concat(' ').concat(t('Date_to')).concat(' ').concat(formatDate(data.d)).concat(' ').concat(' № ').concat(data.num);

	const deleteProtocol = useMethod('deleteProtocol');
	const deleteSection = useMethod('deleteSection');
	const deleteItem = useMethod('deleteItem');
	const moveSection = useMethod('moveSection');
	const moveItem = useMethod('moveItem');

	const onEditClick = useCallback((context) => () => {
		router.push({ id: protocolId, context });
	}, [router]);

	const onDeleteConfirm = useCallback(async () => {
		try {
			await deleteProtocol(protocolId);
			setModal(() => <SuccessModal title={t('Protocol_Has_Been_Deleted')} onClose={() => { setModal(undefined); }}/>);
			FlowRouter.go('protocols');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteProtocol, dispatchToastMessage]);

	const onDeleteClick = () => setModal(() => <DeleteWarningModal title={t('Protocol_Delete_Warning')} onDelete={onDeleteConfirm} onCancel={() => setModal(undefined)}/>);

	const onAddSectionClick = useCallback((context) => () => {
		router.push({ id: protocolId, context });
	}, [router]);

	const onEditSectionClick = useCallback((_id) => () => {
		router.push({
			id: protocolId,
			context: 'edit-section',
			sectionId: _id,
		});
	}, [router]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const close = useCallback(() => {
		router.push({
			id: protocolId,
		});
	}, [router]);

	const onAddItemClick = useCallback((context, sectionId) => () => {
		router.push({
			id: protocolId,
			context: context,
			sectionId: sectionId
		});
	}, [router]);

	const onEditItemClick = useCallback((sectionId, _id) => () => {
		router.push({
			id: protocolId,
			context: 'edit-item',
			sectionId: sectionId,
			itemId: _id
		});
	}, [router]);

	const onParticipantsClick = useCallback((context) => () => {
		router.push({ id: protocolId, context: context });
	}, [router]);

	const onAddParticipantClick = useCallback((context) => () => {
		router.push({
			id: protocolId,
			context: context
		});
	}, [router]);

	const onDeleteSectionConfirm = useCallback((_id) => async () => {
		try {
			await deleteSection(protocolId, _id);
			setModal(() => <SuccessModal title={t('Section_Has_Been_Deleted')} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [deleteSection, dispatchToastMessage, onChange]);

	const openConfirmDeleteSection = (sectionId) => () => setModal(() => <DeleteWarningModal
		title={t('Section_Delete_Warning')} onDelete={onDeleteSectionConfirm(sectionId)} onCancel={() => setModal(undefined)}/>);

	const onMoveSectionClick = useCallback((direction, _id) => async () => {
		try {
			const moved = await moveSection(direction, protocolId, _id);
			if (moved) {
				dispatchToastMessage({type: 'success', message: t('Section_Moved_Successfully')});
				onChange();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [moveSection, dispatchToastMessage, onChange]);

	const onSectionMenuClick = useCallback((event) => {
		const items = [
			{
				// icon: 'edit',
				name: t('Section_Edit'),
				action: onEditSectionClick(event.currentTarget.dataset.section)
			},
			{
				// icon: '',
				name: t('Item_Add'),
				action: onAddItemClick('new-item', event.currentTarget.dataset.section)
			},
			event.currentTarget.dataset.first !== 'true' && {
				// icon: 'edit',
				name: t('Section_Move_Up'),
				action: onMoveSectionClick('up', event.currentTarget.dataset.section),
			},
			event.currentTarget.dataset.last !== 'true' && {
				// icon: 'edit',
				name: t('Section_Move_Down'),
				action: onMoveSectionClick('down', event.currentTarget.dataset.section),
			},
			{
				// icon: 'edit',
				name: t('Section_Delete'),
				action: openConfirmDeleteSection(event.currentTarget.dataset.section)
			},
		]
		const config = {
			columns: [
				{
					groups: [
						{ items }
					]
				}
			],
			currentTarget: event.currentTarget,
			offsetVertical: 10,
		};
		popover.open(config);
	}, [])

	const onDeleteItemConfirm = useCallback((sectionId, _id) => async () => {
		try {
			await deleteItem(protocolId, sectionId, _id);
			setModal(() => <SuccessModal title={t('Item_Has_Been_Deleted')} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [deleteItem, dispatchToastMessage, onChange]);

	const openConfirmDeleteItem = (sectionId, itemId) => () => setModal(() => <DeleteWarningModal
		title={t('Item_Delete_Warning')} onDelete={onDeleteItemConfirm(sectionId, itemId)}
		onCancel={() => setModal(undefined)}/>);

	const onMoveItemClick = useCallback((direction, sectionId, _id) => async () => {
		try {
			const moved = await moveItem(direction, protocolId, sectionId, _id);
			if (moved) {
				dispatchToastMessage({type: 'success', message: t('Item_Moved_Successfully')});
				onChange();
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [moveItem, dispatchToastMessage, onChange]);

	const openWorkingGroupRequest = (protocolsItemId) => () => {
		FlowRouter.go(`/working-groups-request/add/new-protocols-item-request/${ protocolsItemId }`);
	};


	const onItemMenuClick = useCallback((event) => {
		const items = [
			{
				// icon: 'edit',
				name: t('Item_Edit'),
				action: onEditItemClick(event.currentTarget.dataset.section, event.currentTarget.dataset.item),
			},
			event.currentTarget.dataset.first !== 'true' && {
				// icon: 'edit',
				name: t('Item_Move_Up'),
				action: onMoveItemClick('up', event.currentTarget.dataset.section, event.currentTarget.dataset.item),
			},
			event.currentTarget.dataset.last !== 'true' && {
				// icon: 'edit',
				name: t('Item_Move_Down'),
				action: onMoveItemClick('down', event.currentTarget.dataset.section, event.currentTarget.dataset.item),
			},
			{
				// icon: 'edit',
				name: t('Item_Delete'),
				action: openConfirmDeleteItem(event.currentTarget.dataset.section, event.currentTarget.dataset.item)
			},
			{
				name: t('Working_group_request'),
				action: openWorkingGroupRequest(event.currentTarget.dataset.item)
			}
		]
		const config = {
			columns: [
				{
					groups: [
						{ items }
					]
				}
			],
			currentTarget: event.currentTarget,
			offsetVertical: 10,
		};
		popover.open(config);
	}, [])

	const goBack = () => {
		FlowRouter.go('/protocols');
	};

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
					<GoBackButton onClick={goBack}/>
					<Label fontScale='h1'>{t('Protocol')}</Label>
				</Field>
				<ButtonGroup>
					{!context && <Button mbe='x8' small primary onClick={onEditClick('edit')} aria-label={t('Protocol_Info')}>
						{t('Protocol_Info')}
					</Button>}
					{isAllowedEdit && !context && <Button mbe='x8' small primary danger onClick={onDeleteClick} aria-label={t('Delete')}>
						{t('Delete')}
					</Button>}
					{isAllowedEdit && !context && <Button mbe='x8' small primary onClick={onAddSectionClick('new-section')} aria-label={t('Section_Add')}>
						{t('Section_Add')}
					</Button>}
					{!context && <Button mbe='x8' small primary onClick={onParticipantsClick('participants')} aria-label={t('Participants')}>
						{t('Participants')}
					</Button>}
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContent>
				<Box maxWidth='x800' w='full' alignSelf='center' pi='x32' pb='x24' fontSize='x16' borderStyle='solid' borderWidth='x2' borderColor='hint'>
					<Box mbe='x24' display='flex' flexDirection='column'>
						<Box is='span' fontScale='h1' alignSelf='center'>{title}</Box>
					</Box>
					<Box mbe='x16' display='flex' flexDirection='column'>
						<Box is='span' alignSelf='center'>{data.place}</Box>
					</Box>
					<Sections data={data.sections} onSectionMenuClick={onSectionMenuClick} onItemMenuClick={onItemMenuClick} isAllowedEdit={isAllowedEdit}/>
				</Box>
			</Page.ScrollableContent>
		</Page>
		{ context
		&& <VerticalBar width='x520' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'edit' && t('Protocol_Info') }
				{ context === 'new-section' && t('Section_Add') }
				{ context === 'new-item' && t('Item_Add') }
				{ context === 'edit-section' && t('Section_Info') }
				{ context === 'edit-item' && t('Item_Info') }
				{ context === 'participants' && t('Participants') }
				{ context === 'add-participant' && t('Participant_Add') }
				{ context === 'create-participant' && t('Participant_Create') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'edit' && <EditProtocol _id={protocolId} close={close} onChange={onChange} cache={cache}/>}
			{context === 'new-section' && <AddSection goToNew={onEditSectionClick} close={close} onChange={onChange}/>}
			{context === 'new-item' && <AddItem goToNew={onEditItemClick} close={close} onChange={onChange}/>}
			{context === 'edit-section' && <EditSection protocolId={protocolId} _id={sectionId} close={close} onChange={onChange} cache={cache}/>}
			{context === 'edit-item' && <EditItem protocolId={protocolId} sectionId={sectionId} _id={itemId} close={close} onChange={onChange} cache={cache}/>}
			{context === 'participants' && <Participants protocolId={protocolId} onAddParticipantClick={onAddParticipantClick} close={close}/>}
			{context === 'add-participant' && <AddParticipant protocolId={protocolId} close={onParticipantsClick} onCreateParticipant={onAddParticipantClick}/>}
			{context === 'create-participant' && <CreateParticipant goTo={onParticipantsClick} close={onParticipantsClick} workingGroupOptions={workingGroupOptions}/>}
		</VerticalBar>}
	</Page>;
}

ProtocolPage.displayName = 'ProtocolPage';

export default ProtocolPage;
