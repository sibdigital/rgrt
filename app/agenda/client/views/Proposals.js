import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Icon,
	Button,
	Table,
} from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { Tooltip } from '@material-ui/core';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { validateAgendaSection, createAgendaSection } from './lib';

export const ProposalStatusEnum = Object.freeze({
	APPROVED: 1,
	PROPOSED: 2,
	DELETED: 3,
});

export function Proposals({ onEditProposal, agendaId, proposalsListData, onAddProposal, mode = '' }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();

	const mediaQuery = useMediaQuery('(min-width: 769px)');

	const [cache, setCache] = useState(new Date());
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

	const onAddProposalClick = useCallback(async (proposal) => {
		console.log(proposal);
		const agendaSection = createAgendaSection({
			proposalId: proposal._id,
			item: proposal.item,
			initiatedBy: proposal.initiatedBy,
			issueConsideration: proposal.issueConsideration,
			date: proposal.date,
			speakers: [],
		});
		const validation = validateAgendaSection(agendaSection);
		if (validation.length === 0) {
			console.log(agendaSection);
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
	}, [insertOrUpdateAgendaSection, agendaId, proposalsList, t]);

	const onDeleteProposalClick = useCallback(async (proposalId) => {
		try {
			await updateProposalStatus(agendaId, proposalId, t('Agenda_status_declined'));
			// await deleteProposalToAgenda(agendaId, proposalId);
			const arr = proposalsList.map((proposal) => {
				if (proposal._id === proposalId) {
					proposal.status = t('Agenda_status_declined');
					proposal.added = true;
				}
				return proposal;
			});
			setProposalsList(arr);
			dispatchToastMessage({ type: 'success', message: t('Proposal_for_the_agenda_declined') });
		} catch (error) {
			console.log(error);
		}
	}, [agendaId, dispatchToastMessage, t, updateProposalStatus, proposalsList]);

	const onProposalClick = useCallback((proposal) => {
		if (!proposal.added) {
			onEditProposal(proposal);
		}
	}, []);

	const header = useMemo(() => [
		// mediaQuery && <Th w='x150' key={'Proposal_for_the_agenda_item'} color='default'>
		// 	{ t('Proposal_for_the_agenda_item') }
		// </Th>,
		mediaQuery && <Th w='x200' key={'Agenda_initiated_by'} color='default'>
			{ t('Agenda_initiated_by') }
		</Th>,
		<Th w='x300' key={'Agenda_issue_consideration'} color='default'>
			{ t('Agenda_issue_consideration') }
		</Th>,
		// <Th w='x150' key={'Date'} color='default'>
		// 	{ t('Date') }
		// </Th>,
		mediaQuery && <Th w='x200' key={'Status'} color='default'>
			{ t('Status') }
		</Th>,
		mode === 'secretary' && <Th w='x35' key='minus'/>,
		mode === 'secretary' && <Th w='x35' key='plus'/>,
		<Th w='x35' key='edit'/>,
	], [t, mediaQuery, mode]);

	const renderRow = (proposal) => {
		const { _id, item, issueConsideration, date, initiatedBy, status } = proposal;
		const isProposalApproved = (proposal.status === t('Agenda_status_approved') || proposal.status === 'Agenda_status_approved');
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default' style={{ whiteSpace: 'normal' }} onClick={() => onProposalClick(proposal)}>{initiatedBy.value ?? ''}</Table.Cell>}
			<Table.Cell fontScale='p1' color='default' onClick={() => onProposalClick(proposal)}>{issueConsideration}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default' onClick={() => onProposalClick(proposal)}>{status}</Table.Cell>}
			{ mode === 'secretary' && <Table.Cell alignItems={'end'}>
				<Tooltip title={t('Decline')} arrow placement='top'>
					<Button style={tableCellIconStyle} disabled={isProposalApproved || proposal.added} color={isProposalApproved ? '#e4e7ea' : ''} small aria-label={t('Decline')} onClick={() => onDeleteProposalClick(_id)}>
						<Icon name='cross' size='x16'/>
					</Button>
				</Tooltip>
			</Table.Cell>}
			{ mode === 'secretary' && <Table.Cell alignItems={'end'}>
				<Tooltip title={t('Include_in_the_agenda')} arrow placement='top'>
					<Button style={tableCellIconStyle} disabled={proposal.added} color={proposal.added ? '#e4e7ea' : 'green'} small aria-label={t('plus')} onClick={() => onAddProposalClick(proposal)}>
						<Icon name='plus' size='x16'/>
					</Button>
				</Tooltip>
			</Table.Cell>}
			{ <Table.Cell alignItems={'end'}>
				<Tooltip title={t('Edit')} arrow placement='top'>
					<Button style={tableCellIconStyle} disabled={proposal.added} small aria-label={t('edit')} onClick={() => onProposalClick(proposal)}>
						<Icon name='edit' size='x16'/>
					</Button>
				</Tooltip>
			</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={proposalsList} total={proposalsList.length} setParams={setParams} params={params}/>;
	// return <Field display='flex' flexDirection='row'>
	// 	<GenericTable header={header} renderRow={renderRow} results={proposalsList} total={proposalsList.length} setParams={setParams} params={params}/>
	// </Field>;
}
