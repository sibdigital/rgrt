import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Field,
	Button,
	Label,
	ButtonGroup,
	Callout, Table, Icon,
} from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useUserId } from '../../../../client/contexts/UserContext';
import { EditProposalsForTheAgenda } from './EditProposalsForTheAgenda';

registerLocale('ru', ru);

export function ProposalsForTheAgendaPage() {
	const t = useTranslation();
	const userId = useUserId();
	const id = useRouteParameter('id');

	const { data: userData, state: userState, error: userError } = useEndpointDataExperimental('users.info', useMemo(() => ({
		userId,
		fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1, organization: 1 }),
	}), [userId])) || { };

	const { data: agendaUserData, state: agendaUserState, error: agendaUserError } = useEndpointDataExperimental('agendas.proposalsByUser', useMemo(() => ({
		query: JSON.stringify({ councilId: id, userId }),
		fields: JSON.stringify({ proposals: 1 }),
	}), [userId])) || { proposals: [] };

	if ([userState, agendaUserState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{ t('Loading') }</Callout>;
	}

	if (userError) {
		console.log('error');
		return <Callout m='x16' type='danger'>{ userError }</Callout>;
	}

	if (agendaUserError) {
		console.log('error');
		return <Callout m='x16' type='danger'>{ agendaUserError }</Callout>;
	}

	return <ProposalsForTheAgenda userData={userData.user ?? {}} agendaData={agendaUserData}/>;
}

ProposalsForTheAgendaPage.displayName = 'ProposalsForTheAgendaPage';

export default ProposalsForTheAgendaPage;

function ProposalsForTheAgenda({ userData, agendaData }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const [cache, setCache] = useState(new Date());
	const [context, setContext] = useState('');
	const [currentProposal, setCurrentProposal] = useState({});
	const [proposalsList, setProposalsList] = useState([]);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	useEffect(() => {
		if (agendaData.proposals) {
			setProposalsList(agendaData.proposals);
		}
	}, [agendaData]);

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

	const onProposalClick = useCallback((proposal) => {
		setCurrentProposal(proposal);
		setContext('edit');
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
	], [t]);

	const renderRow = (proposal) => {
		const { _id, item, issueConsideration, date, initiatedBy, status } = proposal;
		return <Table.Row key={_id} tabIndex={0} role='link' action onClick={() => onProposalClick(proposal)}>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{item ?? ''}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default' style={{ whiteSpace: 'normal' }}>{initiatedBy.value ?? ''}</Table.Cell>}
			<Table.Cell fontScale='p1' color='default'>{issueConsideration}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDateAndTime(date ?? new Date())}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{status}</Table.Cell>}
			{ <Table.Cell alignItems={'end'}>
				<Button disabled={proposal.added} small aria-label={t('edit')} onClick={() => onProposalClick(proposal)}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Proposals_for_the_agenda')}</Label>
				</Field>
				<ButtonGroup>
					{<Button mbe='x8' small primary aria-label={t('Agenda_add')} onClick={handleNewProposalClick}>
						{t('Agenda_add')}
					</Button>}
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<GenericTable header={header} renderRow={renderRow} results={proposalsList} total={proposalsList.length} setParams={setParams} params={params}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'new' && t('Agenda_added') }
				{ context === 'edit' && t('Agenda_edited') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'new' && <EditProposalsForTheAgenda onEditDataClick={onEditDataClick} close={close} agendaId={agendaData._id} userData={userData}/>}
			{context === 'edit' && <EditProposalsForTheAgenda data={currentProposal} onEditDataClick={onEditDataClick} close={close} agendaId={agendaData._id} userData={userData}/>}
		</VerticalBar>}
	</Page>;
}
