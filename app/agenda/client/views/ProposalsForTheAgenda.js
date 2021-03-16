import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
	Field,
	Button,
	Label,
	ButtonGroup,
	Callout,
} from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useUserId } from '../../../../client/contexts/UserContext';
import { EditProposalsForTheAgenda } from './EditProposalsForTheAgenda';
import { Proposals } from './Proposals';

registerLocale('ru', ru);

export function ProposalsForTheAgendaPage({ proposalsCache = new Date(), isFullLoad = true, onAgendaClick = null }) {
	const t = useTranslation();
	const userId = useUserId();
	const id = useRouteParameter('id');

	const [cache, setCache] = useState(new Date());

	const { data: userData, state: userState, error: userError } = useEndpointDataExperimental('users.info', useMemo(() => ({
		userId,
		fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1, organization: 1 }),
	}), [userId])) || { };

	const { data: agendaUserData, state: agendaUserState, error: agendaUserError } = useEndpointDataExperimental('agendas.proposalsByUser', useMemo(() => ({
		query: JSON.stringify({ councilId: id, userId }),
		fields: JSON.stringify({ proposals: 1 }),
		cache: JSON.stringify({ cache }),
		proposalsCache: JSON.stringify({ proposalsCache }),
	}), [id, userId, cache, proposalsCache])) || { proposals: [] };

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	if ([userState, agendaUserState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16'>{ t('Loading') }</Callout>;
	}

	if (userError) {
		console.log('error', userError);
		return <Callout m='x16' type='danger'>{ t('Error') }</Callout>;
	}

	if (agendaUserError) {
		console.log('error', agendaUserData);
		return <Callout m='x16' type='danger'>{ t('Error') }</Callout>;
	}

	return <ProposalsForTheAgenda userData={userData.user ?? {}} agendaData={agendaUserData} onChange={onChange} isFullLoad={isFullLoad} onAgendaClick={onAgendaClick}/>;
}

ProposalsForTheAgendaPage.displayName = 'ProposalsForTheAgendaPage';

export default ProposalsForTheAgendaPage;

function ProposalsForTheAgenda({ userData, agendaData, onChange, isFullLoad, onAgendaClick = null }) {
	const t = useTranslation();

	const [context, setContext] = useState('');
	const [currentProposal, setCurrentProposal] = useState({});
	const [proposalsList, setProposalsList] = useState([]);

	useEffect(() => {
		if (agendaData.proposals) {
			setProposalsList(agendaData.proposals);
		}
	}, [agendaData]);

	const close = useCallback(() => {
		setContext('');
	}, []);

	const onEditDataClick = useCallback((proposal, type) => {
		const arr = type !== 'new' ? proposalsList.map((_proposal) => (_proposal._id === proposal._id && proposal) || _proposal) : proposalsList.concat(proposal);
		setProposalsList(arr);
		setContext('');
		onChange();
	}, [onChange, proposalsList]);

	const handleNewProposalClick = useCallback(() => {
		setContext('new');
	}, []);

	const onEditProposal = useCallback((proposal) => {
		if (onAgendaClick) {
			onAgendaClick(proposal);
			return;
		}
		setCurrentProposal(proposal);
		setContext('edit');
	}, [onAgendaClick]);

	return <Page flexDirection='row'>
		<Page>
			{isFullLoad && <Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Proposals_for_the_agenda')}</Label>
				</Field>
				<ButtonGroup mis='auto'>
					{context === '' && <Button mbe='x8' small primary aria-label={t('Proposal_for_the_agenda_add')} onClick={handleNewProposalClick}>
						{t('Proposal_for_the_agenda_add')}
					</Button>}
				</ButtonGroup>
			</Page.Header>}
			<Page.Content>
				<Proposals mode={'user'} proposalsListData={proposalsList} agendaId={agendaData._id} onEditProposal={onEditProposal}/>
			</Page.Content>
		</Page>
		{ context
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'new' && t('Proposal_for_the_agenda_added') }
				{ context === 'edit' && t('Proposal_for_the_agenda_edited') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{context === 'new' && <EditProposalsForTheAgenda onEditDataClick={onEditDataClick} close={close} agendaId={agendaData._id} userData={userData}/>}
				{context === 'edit' && <EditProposalsForTheAgenda data={currentProposal} onEditDataClick={onEditDataClick} close={close} agendaId={agendaData._id} userData={userData}/>}
			</VerticalBar.ScrollableContent>
		</VerticalBar>}
	</Page>;
}
