import React, { useCallback, useMemo, useState } from 'react';
import { Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useSetModal } from '../../../../../client/contexts/ModalContext';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { SuccessModal, WarningModal } from '../../../../utils/index';
import { getAnimation } from '../../../../utils/client/index';

const SlideAnimation = getAnimation({ type: 'slideInLeft' });

export function Persons({ councilId, onChange, invitedPersons, setInvitedPersons, isSecretary }) {
	const t = useTranslation();

	const deletePersonFromCouncil = useMethod('deletePersonFromCouncil');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const onDeletePersonFromCouncilConfirm = useCallback(async (personId) => {
		try {
			if (councilId) {
				await deletePersonFromCouncil(councilId, personId);
			}
			const persons = invitedPersons.filter((person) => person._id !== personId);
			setInvitedPersons(persons);
			setModal(() => <SuccessModal title={t('Deleted')} contentText={t('Participant_Has_Been_Deleted')} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deletePersonFromCouncil, dispatchToastMessage, onChange, invitedPersons, setInvitedPersons]);

	const onDel = (personId) => () => { onDeletePersonFromCouncilConfirm(personId); };

	const onDeletePersonFromCouncilClick = (personId) => () => setModal(() => <WarningModal title={t('Are_you_sure')} contentText={t('Participant_Delete_Warning')} onDelete={onDel(personId)} onCancel={() => setModal(undefined)}/>);

	return <SlideAnimation><InvitedPersonsTable invitedPersons={invitedPersons} onDelete={onDeletePersonFromCouncilClick}/></SlideAnimation>;
}

function InvitedPersonsTable({ invitedPersons, onDelete }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'fio'} color='default'>{t('Council_participant')}</Th>,
		mediaQuery && <Th key={'phone'} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} color='default'>{t('Email')}</Th>,
		mediaQuery && <Th key={'Joined_at'} style={{ width: '190px' }} color='default'>{t('Joined_at')}</Th>,
		<Th w='x40' key='delete'/>,
	], [mediaQuery]);

	const styleTableRow = { wordWrap: 'break-word' };
	const style = { textOverflow: 'ellipsis', overflow: 'hidden' };

	const getBackgroundColor = (invitedPerson) => {
		const index = invitedPersons.findIndex((user) => user._id === invitedPerson._id);
		if (index > 0 && index % 2 === 1) {
			return 'var(--color-lighter-blue)';
		}

		return '';
	};

	const renderRow = (invitedPerson) => {
		const iu = invitedPerson;
		return <Table.Row key={iu._id} style={styleTableRow} backgroundColor={getBackgroundColor(invitedPerson)} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.surname} {iu.name} {iu.patronymic}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{formatDateAndTime(iu.ts)}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small aria-label={t('Delete')} onClick={onDelete(iu._id)}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={invitedPersons} total={invitedPersons.length} setParams={setParams} params={params} />;
}
