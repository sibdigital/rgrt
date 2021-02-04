import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Field,
	Button,
	Table, Icon,
} from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { EditProposalsForTheAgenda } from './EditProposalsForTheAgenda';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validateAgendaSection, createAgendaSection } from './lib';

export function Proposals({ onEditProposal, agendaId, userData, proposalsListData, onAddProposal }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const [cache, setCache] = useState(new Date());
	const [context, setContext] = useState('');
	const [currentProposal, setCurrentProposal] = useState({});
	const [proposalsList, setProposalsList] = useState([]);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const insertOrUpdateAgendaSection = useMethod('insertOrUpdateAgendaSection');
	const deleteProposalToAgenda = useMethod('deleteProposalToAgenda');
	const updateProposalStatus = useMethod('updateProposalStatus');

	const tableCellIconStyle = { backgroundColor: 'transparent', borderColor: 'transparent' };

	useEffect(() => {
		if (proposalsListData) {
			setProposalsList(proposalsListData);
		}
	}, [proposalsListData]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, [cache]);

	const close = useCallback(() => {
		setContext('');
	}, []);

	const onEditDataClick = useCallback((proposal, type = 'new') => {
		const arr = type !== 'new' ? proposalsList.map((_proposal) => (_proposal._id === proposal._id && proposal) || _proposal) : proposalsList.concat(proposal);
		setProposalsList(arr);
		setContext('');
		onChange();
	}, [proposalsList]);

	const onAddProposalClick = useCallback(async (proposal) => {
		const agendaSection = createAgendaSection({
			item: proposal.item,
			initiatedBy: proposal.initiatedBy,
			issueConsideration: proposal.issueConsideration,
			date: proposal.date,
			speakers: [],
		});
		const validation = validateAgendaSection(agendaSection);
		if (validation.length === 0) {
			const result = await insertOrUpdateAgendaSection(agendaId, agendaSection);
			await updateProposalStatus(agendaId, proposal._id, t('Agenda_status_approved'));

			if (result && result._id) {
				agendaSection._id = result._id;
			}

			const arr = proposalsList.map((prop) => {
				if (prop._id === proposal._id) {
					prop.added = true;
					prop.status = t('Agenda_status_approved');
				}
				return prop;
			});

			setProposalsList(arr);
			onAddProposal(agendaSection);
			onChange();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdateAgendaSection, agendaId, proposalsList]);

	const onDeleteProposalClick = useCallback(async (proposalId) => {
		try {
			await deleteProposalToAgenda(agendaId, proposalId);
		} catch (error) {
			console.log(error);
		}
	}, [agendaId]);

	const onProposalClick = useCallback((proposal) => {
		if (!proposal.added) {
			onEditProposal(proposal);
		}
	}, []);

	const handleNewProposalClick = useCallback(() => {
		setContext('new');
	}, []);

	const header = useMemo(() => [
		mediaQuery && <Th w='x150' key={'Proposal_for_the_agenda_item'} color='default'>
			{ t('Proposal_for_the_agenda_item') }
		</Th>,
		mediaQuery && <Th w='x200' key={'Agenda_initiated_by'} color='default'>
			{ t('Agenda_initiated_by') }
		</Th>,
		<Th w='x300' key={'Agenda_issue_consideration'} color='default'>
			{ t('Agenda_issue_consideration') }
		</Th>,
		<Th w='x150' key={'Date'} color='default'>
			{ t('Date') }
		</Th>,
		mediaQuery && <Th w='x200' key={'Status'} color='default'>
			{ t('Status') }
		</Th>,
		<Th w='x40' key='delete'/>,
		<Th w='x40' key='plus'/>,
		<Th w='x40' key='edit'/>,
	], [t, mediaQuery]);

	const renderRow = (proposal) => {
		const { _id, item, issueConsideration, date, initiatedBy, status } = proposal;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default' onClick={() => onProposalClick(proposal)}>{item ?? ''}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default' style={{ whiteSpace: 'normal' }} onClick={() => onProposalClick(proposal)}>{initiatedBy.value ?? ''}</Table.Cell>}
			<Table.Cell fontScale='p1' color='default' onClick={() => onProposalClick(proposal)}>{issueConsideration}</Table.Cell>
			<Table.Cell fontScale='p1' color='default' onClick={() => onProposalClick(proposal)}>{formatDateAndTime(date ?? new Date())}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default' onClick={() => onProposalClick(proposal)}>{status}</Table.Cell>}
			{ <Table.Cell alignItems={'end'}>
				<Button style={tableCellIconStyle} color='red' small aria-label={t('trash')} onClick={() => onDeleteProposalClick(_id)}>
					<Icon name='trash' size='x20'/>
				</Button>
			</Table.Cell>}
			{ <Table.Cell alignItems={'end'}>
				<Button style={tableCellIconStyle} disabled={proposal.added} color={proposal.added ? '#e4e7ea' : 'green'} small aria-label={t('plus')} onClick={() => onAddProposalClick(proposal)}>
					<Icon name='plus' size='x20'/>
				</Button>
			</Table.Cell>}
			{ <Table.Cell alignItems={'end'}>
				<Button style={tableCellIconStyle} disabled={proposal.added} small aria-label={t('edit')} onClick={() => onProposalClick(proposal)}>
					<Icon name='edit' size='x20'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <Field display='flex' flexDirection='row'>
		<Field>
			<GenericTable header={header} renderRow={renderRow} results={proposalsList} total={proposalsList.length} setParams={setParams} params={params}/>
		</Field>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'new' && t('Agenda_added') }
				{ context === 'edit' && t('Agenda_edited') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'new' && <EditProposalsForTheAgenda onEditDataClick={onEditDataClick} close={close} agendaId={agendaId} userData={userData}/>}
			{context === 'edit' && <EditProposalsForTheAgenda data={currentProposal} onEditDataClick={onEditDataClick} close={close} agendaId={agendaId} userData={userData}/>}
		</VerticalBar>}
	</Field>;
}
