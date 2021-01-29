import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Icon, Tile, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useSetModal } from '../../../../../client/contexts/ModalContext';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';

const clickable = css`
		cursor: pointer;
		// border-bottom: 2px solid #F2F3F5 !important;

		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ _id, itemsPerPage, current }, [ column, direction ], cache) => useMemo(() => ({
	query: JSON.stringify({ _id }),
	fields: JSON.stringify({ name: 1, username: 1, emails: 1,
		surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [_id, itemsPerPage, current, column, direction, cache]);

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Participant_Delete_Warning')}
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
			{t('Participant_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function Participants({ protocolId, onAddParticipantClick }) {
	const [params, setParams] = useState({ _id: protocolId, current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('protocols.participants', query) || { users: [] };

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	return <ParticipantsWithData data={data} protocolId={protocolId} onAddClick={onAddParticipantClick} onChange={onChange}/>;
};

function ParticipantsWithData({ data, protocolId, onAddClick, onChange }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const setModal = useSetModal();

	const deleteParticipant = useMethod('deleteParticipantFromProtocol');

	const onDeleteConfirm = useCallback((userId) => async () => {
		try {
			await deleteParticipant(protocolId, userId);
			setModal(() => <SuccessModal onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	}, [deleteParticipant, dispatchToastMessage, onChange]);

	const openConfirmDelete = (userId) => () => setModal(() => <DeleteWarningModal onDelete={onDeleteConfirm(userId)} onCancel={() => setModal(undefined)}/>);

	const User = (user) => <Box
		pb='x4'
		color='default'
		className={clickable}
		display='flex'
	>
		<Box is='span' flexGrow={1}>
			<Box fontSize={"16px"}>{user.surname} {user.name} {user.patronymic}</Box>
			{/* <Box color='hint'>{user.position}, {user.organization}</Box> */}
		</Box>
		<Icon onClick={openConfirmDelete(user._id)} pi='x8' name='cross'/>
	</Box>;

	return <VerticalBar.ScrollableContent>
		<Box mbe='x8' flexGrow={1}>
			{data && !data.users.length
				? <Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{t('No_data_found')}
				</Tile>
				: <>
					{data.users
						? data.users.map((props, index) => <User key={props._id || index} { ...props}/>)
						: <></>
					}
				</>
			}
		</Box>
		<Button primary onClick={onAddClick('add-participant')} aria-label={t('New')}>
			{t('Participant_Add')}
		</Button>
	</VerticalBar.ScrollableContent>;
}
